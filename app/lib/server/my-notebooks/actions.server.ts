import { redirect } from "react-router";

import { prisma } from "@/lib/server/prisma.server";
import { requireUser } from "@/lib/server/session.server";
import { requireNotebookRole } from "@/lib/server/notebook-access.server";
import { ExcelParseError, parseExcelWorkbook } from "@/lib/shared/excel";
import { normalizeCardData, type CardData } from "@/lib/shared/card-data";
import { normalizeColumns } from "@/lib/shared/notebook-columns";
import {
  parseCardHead,
  parseCardValue,
  parseColumnName,
  parseDuplicateChoice,
  parseMove,
  parseNewNotebookTitle,
  parseNotebookLanguage,
  parseNotebookTitle,
  parseStarCount,
} from "@/lib/shared/notebook-schema";
import { isBlankCardFields, pickCardFields } from "@/lib/shared/bulk-edit";
import { compactRows, groupContinuationRows } from "@/lib/shared/card-groups";
import { clampToGroup, notebookGroup, sortNotebooks } from "@/lib/shared/notebook-order";
import { moveToInsertionPoint } from "@/lib/shared/reorder";
import { datedTitle, numberedTitle, type RenameNotebookState } from "@/lib/shared/notebook-title";
import { toStudyDay } from "@/lib/shared/study-calendar";
import type { FormState } from "@/lib/shared/form-state";
import { recordStudyEvent } from "@/lib/server/study-events.server";

// フォームの `row:0:列名`, `row:1:列名`, ... という連番の入力欄を、存在する分だけ読み取って組にする
// （入力欄は必ず0番から連番で置く）。同じ連番内の列同士は同じ組（Excelの1行に相当）として対応付けられる。
// 空文字の値は保存せず、どの列も空の組は取り除く（compactRows）
function readCardRows(
  columns: string[],
  formData: FormData,
): { rows: CardData["rows"] } | { error: string } {
  const bodyColumns = columns.slice(1);
  const rows: CardData["rows"] = [];
  let i = 0;
  while (bodyColumns.some((column) => formData.has(`row:${i}:${column}`))) {
    const row: Record<string, string> = {};
    for (const column of bodyColumns) {
      const value = parseCardValue(formData.get(`row:${i}:${column}`) ?? "");
      if (!value.success) return { error: value.error };
      if (value.data !== "") row[column] = value.data;
    }
    rows.push(row);
    i += 1;
  }
  return { rows: compactRows(rows) };
}

// フォームの入力を検証してカードのデータにする。不正な入力(空の見出し語・長すぎる値)はエラーメッセージを返す
function readCardData(
  columns: string[],
  formData: FormData,
): { data: CardData } | { error: string } {
  const head = parseCardHead(formData.get("head") ?? "");
  if (!head.success) return { error: head.error };
  const parsed = readCardRows(columns, formData);
  if ("error" in parsed) return parsed;
  return { data: { head: head.data, rows: parsed.rows } };
}

// 見出し語の欄が空（空白だけ）か。見出し語が空の行は、上の単語の新しい組にする（groupContinuationRows）
const hasBlankHead = (formData: FormData) => String(formData.get("head") ?? "").trim() === "";

// 表に足した1行ぶんの入力を読み取る。見出し語が空の行は、見出し語を空のまま組だけ読み取る（上の単語に付ける分）
function readTableRow(
  columns: string[],
  formData: FormData,
): { data: CardData } | { error: string } {
  if (!hasBlankHead(formData)) return readCardData(columns, formData);
  const parsed = readCardRows(columns, formData);
  return "error" in parsed ? parsed : { data: { head: "", rows: parsed.rows } };
}

// 見出し語が空の行の、上に単語が無いとき
const NO_WORD_ABOVE_ERROR =
  "見出し語を入力してください（見出し語を空けると、上の単語の組として追加します）";

// 既存の単語帳へ、Excelファイルから単語をまとめて追加する。
// Excel側の列名（見出し語列を除く）を既存の単語帳の列と名前で突き合わせ、
// 一致する列名があればそこに追加し、無ければ単語帳の末尾に新しい列として追加する
export async function importCardsFromExcel(
  notebookId: string,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Excelファイル（.xlsx）を選択してください。" };
  }

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const existingColumns = normalizeColumns(notebook.columns);

  // Excelを解析（1行目=列名、2行目以降=単語データに変換）。
  // 解析に失敗した場合はエラーメッセージをフォームに戻す（それ以外の例外は再送出）
  let parsed;
  try {
    parsed = await parseExcelWorkbook(await file.arrayBuffer());
  } catch (error) {
    if (error instanceof ExcelParseError) {
      return { error: error.message };
    }
    throw error;
  }

  // 見出し語列（1列目）は名前が違っても無視してよい（Card.dataではheadという固定フィールドで
  // 扱われ、列名に依存しないため）。2列目以降だけを既存の列名リストに突き合わせる
  const excelBodyColumns = parsed.columns.slice(1);
  const newColumns = [...existingColumns];
  for (const name of excelBodyColumns) {
    if (!newColumns.includes(name)) newColumns.push(name);
  }

  // 追加するカードは既存カードの最大positionの続きから採番する
  const last = await prisma.card.aggregate({
    where: { notebookId },
    _max: { position: true },
  });
  let nextPosition = (last._max.position ?? -1) + 1;

  await prisma.$transaction([
    prisma.notebook.update({ where: { id: notebookId }, data: { columns: newColumns } }),
    ...parsed.rows.map((data) =>
      prisma.card.create({ data: { notebookId, data, position: nextPosition++ } }),
    ),
  ]);

  return {};
}

// Excelを介さず、アプリ上でゼロから単語帳を作成する。
// 「見出し語」「意味」の2列・単語0件で作成し、以降は列の追加・名前の変更・削除と
// 単語の追加を、この単語帳のページの表（NotebookTable）の上でそのまま行える
export async function createBlankNotebook(formData: FormData): Promise<FormState> {
  const user = await requireUser();

  // 一覧の「新しい単語帳」ではタイトルを送らないので、仮のタイトル（無題の単語帳）で作る
  const title = parseNewNotebookTitle(formData.get("title"));
  if (!title.success) {
    return { error: title.error };
  }

  // 新しい単語帳は、一覧のお気に入り以外（学習済みも除く）の一番上に並べる（並び順を、いまの一番上より1つ小さくする）
  const top = await prisma.notebook.aggregate({
    where: { userId: user.id, favorite: false, studied: false },
    _min: { listPosition: true },
  });
  const notebook = await prisma.notebook.create({
    data: {
      title: title.data,
      userId: user.id,
      columns: ["見出し語", "意味"],
      listPosition: (top._min.listPosition ?? 1) - 1,
    },
  });

  // ?new=1 で開くと、単語帳のページはタイトルを入力できる状態で始まる（NotebookTitle）
  throw redirect(`/my-notebooks/${notebook.id}?new=1`);
}

// 単語帳のタイトルを変える。作成者のみ実行可能。
// 自分の別の単語帳と名前が重なるときは、選び方（onDuplicate）が無ければ保存せずに候補を返し、
// 選び方があれば「このまま」「番号を付ける」「今日の日付を付ける」のどれかで保存する
export async function renameNotebook(
  notebookId: string,
  formData: FormData,
): Promise<RenameNotebookState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");
  const title = parseNotebookTitle(formData.get("title") ?? "");
  if (!title.success) return { error: title.error };
  const choice = parseDuplicateChoice(formData.get("onDuplicate"));
  if (!choice.success) return { error: choice.error };

  const others = await prisma.notebook.findMany({
    where: { userId: user.id, id: { not: notebookId } },
    select: { title: true },
  });
  const existing = others.map((other) => other.title);
  let newTitle = title.data;
  if (existing.includes(title.data)) {
    const today = toStudyDay(new Date());
    const numbered = numberedTitle(title.data, existing);
    const dated = datedTitle(title.data, today, existing);
    if (choice.data === undefined) {
      return { duplicate: { title: title.data, numbered, dated } };
    }
    if (choice.data === "number") newTitle = numbered;
    if (choice.data === "date") newTitle = dated;
  }

  await prisma.notebook.update({ where: { id: notebookId }, data: { title: newTitle } });
  return {};
}

// 単語帳の言語（単語を入力するときの補助に使う）を変える。作成者のみ実行可能
export async function updateNotebookLanguage(
  notebookId: string,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");
  const language = parseNotebookLanguage(formData.get("language"));
  if (!language.success) return { error: language.error };
  await prisma.notebook.update({ where: { id: notebookId }, data: { language: language.data } });
  return {};
}

// My単語帳の一覧で、単語帳をお気に入りにする・外す。お気に入りは一覧の一番上にまとめて並ぶ。作成者のみ実行可能
export async function toggleNotebookFavorite(notebookId: string): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");
  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { favorite: true },
  });
  await prisma.notebook.update({
    where: { id: notebookId },
    data: { favorite: !notebook.favorite },
  });
  return {};
}

// My単語帳の一覧で、単語帳を長押ししたまま動かして並べ替える。notebookId の単語帳を、beforeNotebookId の単語帳の前へ
// （無ければ自分のまとまりのいちばん後ろへ）動かす。番号ではなく id で受け取るので、並べ替えている間に
// 別の画面で単語帳が増減していても、狙った位置に入る。自分の単語帳を一覧と同じ順（sortNotebooks）に並べてから動かし、
// 並びの順に listPosition を振り直す。お気に入りとそれ以外の境目はまたがず、自分のまとまりの端に入れる（clampToGroup）
export async function moveNotebook(formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const notebooks = sortNotebooks(
    await prisma.notebook.findMany({
      where: { userId: user.id },
      select: { id: true, favorite: true, studied: true, listPosition: true, createdAt: true },
    }),
  );
  const ids = notebooks.map((notebook) => notebook.id);
  const from = ids.indexOf(String(formData.get("notebookId") ?? ""));
  const beforeId = String(formData.get("beforeNotebookId") ?? "");
  const before = beforeId === "" ? notebooks.length : ids.indexOf(beforeId);
  if (from === -1 || before === -1) {
    return { error: "並べ替える単語帳が見つかりません。ページを再読み込みしてください。" };
  }
  // 前に入れる単語帳を指定しないとき（before が一覧の末尾）は、自分のまとまりのいちばん後ろへ収まる
  const insertAt = clampToGroup(notebooks.map(notebookGroup), from, before);

  const ordered = moveToInsertionPoint(notebooks, from, insertAt);
  await prisma.$transaction(
    ordered
      .map((notebook, position) => ({ ...notebook, newPosition: position }))
      .filter((notebook) => notebook.listPosition !== notebook.newPosition)
      .map((notebook) =>
        prisma.notebook.update({
          where: { id: notebook.id },
          data: { listPosition: notebook.newPosition },
        }),
      ),
  );
  return {};
}

// My単語帳の一覧で、単語帳を学習済みにする・学習中に戻す。学習済みは一覧の一番下にまとめてグレーで並ぶ。作成者のみ実行可能
export async function toggleNotebookStudied(notebookId: string): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");
  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { studied: true },
  });
  await prisma.notebook.update({
    where: { id: notebookId },
    data: { studied: !notebook.studied },
  });
  return {};
}

// 単語帳を削除する（中の単語もまとめて削除される）。作成者のみ実行可能。
// 学習記録（StudyEvent など）は単語帳と外部キーでつないでいないので残る。学習カレンダーで元の名前を出せるよう、
// 削除と同時に名前を控えておく（DeletedNotebook）
export async function deleteNotebook(notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId, userId: user.id },
    select: { title: true },
  });
  await prisma.$transaction([
    prisma.deletedNotebook.upsert({
      where: { id: notebookId },
      create: { id: notebookId, title: notebook.title },
      update: { title: notebook.title, deletedAt: new Date() },
    }),
    prisma.notebook.delete({ where: { id: notebookId, userId: user.id } }),
  ]);
  throw redirect("/my-notebooks");
}

// 単語帳に単語を1件、手動で追加する
export async function createCard(notebookId: string, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const columns = normalizeColumns(notebook.columns);

  // 見出し語を空けて入力したら、いちばん下の単語の新しい組として足す（多義語を1つの単語にまとめる）
  if (hasBlankHead(formData)) {
    const parsedRows = readCardRows(columns, formData);
    if ("error" in parsedRows) return { error: parsedRows.error };
    const values = parsedRows.rows.filter((row) => Object.keys(row).length > 0);
    const lastCard = await prisma.card.findFirst({
      where: { notebookId },
      orderBy: { position: "desc" },
      select: { id: true, data: true },
    });
    if (values.length === 0 || !lastCard) return { error: NO_WORD_ABOVE_ERROR };
    const current = normalizeCardData(lastCard.data);
    await prisma.card.update({
      where: { id: lastCard.id },
      data: { data: { ...current, rows: compactRows([...current.rows, ...values]) } },
    });
    return { added: current.head };
  }

  const parsed = readCardData(columns, formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }
  const data = parsed.data;

  // 新規カードは常に末尾に追加する。既存カードの最大positionを調べ、+1した値を採番する。
  // カードが1件も無ければ _max.position は null になるので -1 を基点として扱う（結果0番になる）
  const last = await prisma.card.aggregate({
    where: { notebookId },
    _max: { position: true },
  });

  await prisma.card.create({
    data: { notebookId, data, position: (last._max.position ?? -1) + 1 },
  });

  return { added: data.head };
}

// 単語帳内の単語を1件、編集する
export async function updateCard(
  cardId: string,
  notebookId: string,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const columns = normalizeColumns(notebook.columns);
  const parsed = readCardData(columns, formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }
  const data = parsed.data;

  await prisma.card.update({
    where: { id: cardId, notebookId },
    data: { data },
  });

  return {};
}

// 単語帳の表の「表を編集」から、全部の単語をまとめて保存する。送られてくる単語ごとの入力欄は
// `card:<単語のid>:head` のように単語のidが前に付いている（lib/shared/bulk-edit.ts）。編集中に足した行は
// newCardId（画面で仮に付けた番号）で送られてくるので、新しい単語としていまの単語の後ろに加える。
// 一部だけ保存されることがないよう、全部の単語を先に読み取ってから、1つのトランザクションでまとめて保存する
export async function updateCards(notebookId: string, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const columns = normalizeColumns(notebook.columns);
  const cardIds = [...new Set(formData.getAll("cardId").map(String))];

  const updates: { id: string; data: CardData }[] = [];
  for (const [index, cardId] of cardIds.entries()) {
    const parsed = readCardData(columns, pickCardFields(formData, cardId));
    if ("error" in parsed) {
      return { error: `${index + 1}行目の単語: ${parsed.error}` };
    }
    updates.push({ id: cardId, data: parsed.data });
  }

  // 編集中に表の＋や ↓ で足した行（newCardId は画面で仮に付けた番号）。何も入力していない行は飛ばす。
  // 見出し語が空の行は、すぐ上の単語の新しい組にする（足した行の先頭なら、いまある最後の単語の組）
  const newEntries: CardData[] = [];
  for (const [index, newCardId] of formData.getAll("newCardId").map(String).entries()) {
    const fields = pickCardFields(formData, newCardId);
    if (isBlankCardFields(fields)) continue;
    const parsed = readTableRow(columns, fields);
    if ("error" in parsed) {
      return { error: `${cardIds.length + index + 1}行目の単語: ${parsed.error}` };
    }
    newEntries.push(parsed.data);
  }
  const { continuation, cards: newCards } = groupContinuationRows(newEntries);
  if (continuation.length > 0) {
    const lastUpdate = updates.at(-1);
    if (!lastUpdate) return { error: `${cardIds.length + 1}行目の単語: ${NO_WORD_ABOVE_ERROR}` };
    lastUpdate.data.rows = compactRows([...lastUpdate.data.rows, ...continuation]);
  }

  // この単語帳の単語だけを更新する（他の単語帳の単語のidが送られてきても書き換えない）
  const owned = await prisma.card.count({ where: { notebookId, id: { in: cardIds } } });
  if (owned !== cardIds.length) {
    return { error: "保存できない単語が含まれています。ページを再読み込みしてください。" };
  }
  // 新しい単語は、いまの単語の後ろに並べる
  const last = await prisma.card.aggregate({ where: { notebookId }, _max: { position: true } });
  const nextPosition = (last._max.position ?? -1) + 1;
  await prisma.$transaction([
    ...updates.map(({ id, data }) =>
      prisma.card.update({ where: { id, notebookId }, data: { data } }),
    ),
    ...newCards.map((data, index) =>
      prisma.card.create({ data: { notebookId, data, position: nextPosition + index } }),
    ),
  ]);

  return {};
}

// 全カードのデータを取得し、変換関数を適用してまとめて保存するヘルパー。
// 列の追加・変更に伴うデータ移行はすべてこの形で行う
async function migrateAllCards(
  notebookId: string,
  newColumns: string[],
  transform: (data: CardData) => CardData,
) {
  const cards = await prisma.card.findMany({
    where: { notebookId },
    select: { id: true, data: true },
  });

  await prisma.$transaction([
    prisma.notebook.update({ where: { id: notebookId }, data: { columns: newColumns } }),
    ...cards.map((card) => {
      const data = transform(normalizeCardData(card.data));
      return prisma.card.update({ where: { id: card.id }, data: { data } });
    }),
  ]);
}

// 単語帳の末尾に列（意味・発音などの列）を1つ追加する。
// 新設列は既存カードのどのデータにも存在しないだけなので、移行は不要
// （表ではキー無し＝空欄として表示される）
export async function addNotebookColumn(
  notebookId: string,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  const parsedName = parseColumnName(formData.get("name") ?? "");

  if (!parsedName.success) {
    return { error: parsedName.error };
  }
  const name = parsedName.data;

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const columns = normalizeColumns(notebook.columns);

  if (columns.includes(name)) {
    return { error: "同じ名前の列がすでにあります。" };
  }

  await prisma.notebook.update({
    where: { id: notebookId },
    data: { columns: [...columns, name] },
  });

  return {};
}

// 単語帳の列名を変更する。1列目（見出し語）はラベルの変更のみで済むが、
// 2列目以降は既存カードのcellsオブジェクトのキー名も
// 古い列名→新しい列名へ一括で付け替えないと、値が宙に浮いて表示されなくなる
export async function renameNotebookColumn(
  notebookId: string,
  columnIndex: number,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  const parsedName = parseColumnName(formData.get("name") ?? "");

  if (!parsedName.success) {
    return { error: parsedName.error };
  }
  const newName = parsedName.data;

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const columns = normalizeColumns(notebook.columns);
  const oldName = columns[columnIndex];

  if (oldName === undefined) {
    return { error: "指定された列が見つかりません。" };
  }
  if (newName === oldName) {
    return {};
  }
  if (columns.includes(newName)) {
    return { error: "同じ名前の列がすでにあります。" };
  }

  const newColumns = columns.map((column, index) => (index === columnIndex ? newName : column));

  if (columnIndex === 0) {
    // 見出し語列はラベルの変更のみ（card.data.headはキーではなく固定フィールドのため移行不要）
    await prisma.notebook.update({ where: { id: notebookId }, data: { columns: newColumns } });
  } else {
    await migrateAllCards(notebookId, newColumns, (data) => {
      const rows = data.rows.map((row) => {
        if (!(oldName in row)) return row;
        const { [oldName]: value, ...rest } = row;
        return { ...rest, [newName]: value };
      });
      return { ...data, rows };
    });
  }

  return {};
}

// 単語帳の列（見出し語列以外）を削除する。見出し語列は構造上削除不可。
// 既存カードのcellsから該当キーも取り除く
// 表の列を長押ししたまま動かして並べ替える。列の値は列名で持っているので、カードのデータは書き換えなくてよい。
// 先頭の見出し語の列（カードの表面）は動かさず、ほかの列だけを、見出し語の列より後ろで並べ替える
export async function moveNotebookColumn(
  notebookId: string,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  const move = parseMove({ from: formData.get("from"), insertAt: formData.get("insertAt") });
  if (!move.success) return { error: move.error };
  const { from, insertAt } = move.data;

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const columns = normalizeColumns(notebook.columns);
  if (from < 1 || from >= columns.length || insertAt < 1 || insertAt > columns.length) {
    return { error: "並べ替えの位置が正しくありません。" };
  }

  await prisma.notebook.update({
    where: { id: notebookId },
    data: { columns: moveToInsertionPoint(columns, from, insertAt) },
  });
  return {};
}

export async function deleteNotebookColumn(notebookId: string, columnIndex: number) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId },
    select: { columns: true },
  });
  const columns = normalizeColumns(notebook.columns);
  const name = columns[columnIndex];

  // 見出し語列（0番目）は削除不可。存在しない列指定は何もしない
  if (columnIndex <= 0 || name === undefined) {
    return;
  }

  const newColumns = columns.filter((_, index) => index !== columnIndex);

  await migrateAllCards(notebookId, newColumns, (data) => {
    const rows = data.rows.map((row) =>
      Object.fromEntries(Object.entries(row).filter(([key]) => key !== name)),
    );
    return { ...data, rows };
  });
}

// 単語帳内の単語を1件、削除する
// 表の行（単語）を長押ししたまま動かして並べ替える。from 番目の単語（cardId で照合する）を insertAt 番目の間へ動かし、
// 並びの順に position を振り直す。並べ替えている間に単語が増減して並びが変わっていたら、何もしない
export async function moveCard(notebookId: string, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  const move = parseMove({ from: formData.get("from"), insertAt: formData.get("insertAt") });
  if (!move.success) return { error: move.error };
  const { from, insertAt } = move.data;

  const cards = await prisma.card.findMany({
    where: { notebookId },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });
  if (cards[from]?.id !== formData.get("cardId") || insertAt > cards.length) {
    return { error: "単語の並びが変わっています。ページを再読み込みしてください。" };
  }

  const ordered = moveToInsertionPoint(cards, from, insertAt);
  await prisma.$transaction(
    ordered
      .map((card, position) => ({ ...card, newPosition: position }))
      .filter((card) => card.position !== card.newPosition)
      .map((card) =>
        prisma.card.update({ where: { id: card.id }, data: { position: card.newPosition } }),
      ),
  );
  return {};
}

export async function deleteCard(cardId: string, notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");

  await prisma.card.delete({ where: { id: cardId, notebookId } });
}

// 単語帳の公開・非公開を切り替える。公開中は /share/[notebookId] からログイン無しで閲覧できる。作成者のみ実行可能
export async function toggleNotebookPublic(notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "owner");

  const notebook = await prisma.notebook.findUniqueOrThrow({
    where: { id: notebookId, userId: user.id },
    select: { isPublic: true },
  });

  await prisma.notebook.update({
    where: { id: notebookId },
    data: { isPublic: !notebook.isPublic },
  });
}

// 単語の★を付け外しする。付けるときだけ starCount を+1し、外してもstarCountは減らさない。
// ★・回数はユーザーごとに独立しているため、共同編集者同士で付け外ししても互いに影響しない
export async function toggleStar(cardId: string, notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  await prisma.card.findUniqueOrThrow({ where: { id: cardId, notebookId }, select: { id: true } });

  const progress = await prisma.cardProgress.findUnique({
    where: { cardId_userId: { cardId, userId: user.id } },
    select: { starred: true },
  });
  const starred = progress?.starred ?? false;

  await prisma.cardProgress.upsert({
    where: { cardId_userId: { cardId, userId: user.id } },
    update: starred ? { starred: false } : { starred: true, starCount: { increment: 1 } },
    create: { cardId, userId: user.id, starred: true, starCount: 1 },
  });

  // 通常の暗記学習（全件）は並び順・件数が変わらないので再検証してよい
  // 復習モード（★のみ）は外した瞬間にカードが抜けて表示中のインデックスがずれるため、セッション中は再検証せず、次回開いたときのDB取得だけに反映させる
}

// 単語帳の表の★。押すたびに★を付けた状態にして回数を+1する（付いていても外さない）。
// ★を外すときは回数の修正（setStarCount / resetStar）で0に戻す
export async function addStar(cardId: string, notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  await prisma.card.findUniqueOrThrow({ where: { id: cardId, notebookId }, select: { id: true } });

  await prisma.cardProgress.upsert({
    where: { cardId_userId: { cardId, userId: user.id } },
    update: { starred: true, starCount: { increment: 1 } },
    create: { cardId, userId: user.id, starred: true, starCount: 1 },
  });
}

// 誤ってクリックした場合などに、★の回数を手動で書き換える
// 0にした場合は「一度も★を付けていない」状態と矛盾しないよう、starredも自動でfalseに戻す
export async function setStarCount(cardId: string, notebookId: string, formData: FormData) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  await prisma.card.findUniqueOrThrow({ where: { id: cardId, notebookId }, select: { id: true } });

  const count = parseStarCount(formData.get("count"));

  await prisma.cardProgress.upsert({
    where: { cardId_userId: { cardId, userId: user.id } },
    update: count === 0 ? { starCount: 0, starred: false } : { starCount: count },
    create: { cardId, userId: user.id, starCount: count },
  });
}

// ★の回数・付け外し状態をまとめて未使用の状態（0・未付与）に戻す
export async function resetStar(cardId: string, notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  await prisma.card.findUniqueOrThrow({ where: { id: cardId, notebookId }, select: { id: true } });

  await prisma.cardProgress.upsert({
    where: { cardId_userId: { cardId, userId: user.id } },
    update: { starCount: 0, starred: false },
    create: { cardId, userId: user.id, starCount: 0, starred: false },
  });
}

// 単語帳内の全カードの★（回数・付け外し状態）を一括でリセットする（自分の進捗のみ）
export async function resetAllStars(notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");

  await prisma.cardProgress.updateMany({
    where: { userId: user.id, card: { notebookId } },
    data: { starCount: 0, starred: false },
  });
}

// 暗記学習モード（/study, /review）でカードが1枚表示されるたびに呼び、表示回数を+1する
// ★の付け外しとは異なりカードの抽出条件（starred）を変えないため、復習モード（/review）を再検証しても表示中のカード構成はズレない
// mode は学習カレンダーで「暗記学習」と「★の復習」を分けて数えるためのもの
export async function incrementViewCount(
  cardId: string,
  notebookId: string,
  mode: "study" | "review",
) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  await prisma.card.findUniqueOrThrow({ where: { id: cardId, notebookId }, select: { id: true } });

  await prisma.cardProgress.upsert({
    where: { cardId_userId: { cardId, userId: user.id } },
    update: { viewCount: { increment: 1 } },
    create: { cardId, userId: user.id, viewCount: 1 },
  });
  await recordStudyEvent(user.id, {
    eventType: mode === "review" ? "card_review" : "card_study",
    itemId: cardId,
    deckId: notebookId,
  });
}

// 単語帳クイズで1問答えるたびに呼び、学習カレンダー用に記録する
export async function recordCardQuizAnswer(cardId: string, notebookId: string) {
  const user = await requireUser();
  await requireNotebookRole(notebookId, user.id, "member");
  await prisma.card.findUniqueOrThrow({ where: { id: cardId, notebookId }, select: { id: true } });

  await recordStudyEvent(user.id, { eventType: "card_quiz", itemId: cardId, deckId: notebookId });
}
