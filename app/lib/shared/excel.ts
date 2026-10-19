import ExcelJS from "exceljs";

import type { CardData } from "@/lib/shared/card-data";

export type ParsedNotebook = {
  // Excelの1行目（ヘッダー行）の値を、出現順のまま並べたもの。
  // 1列目が見出し語、2列目以降が意味・例文などの子項目に対応する
  columns: string[];
  // 2行目以降を、1列目（見出し語）の値が同じ行どうしでグルーピングしたもの。
  // 同じ見出し語が複数行に渡って登場する場合、多義語として1枚のカードにまとめる
  rows: CardData[];
};

export class ExcelParseError extends Error {}

export async function createTemplateWorkbookBuffer(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");
  worksheet.addRow([1, 2, 3]);

  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

// exceljsのCell.valueは文字列・数値・日付・数式結果オブジェクトなど
// 型がまちまちなので、表示用の1本の文字列に正規化する
function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("ja-JP");
  }
  if (typeof value === "object") {
    // 数式セル: { formula, result } の result を使う
    if ("result" in value) {
      return cellToText((value as ExcelJS.CellFormulaValue).result ?? "");
    }
    // リッチテキストセル: { richText: [{ text }, ...] }
    if ("richText" in value) {
      return (value as ExcelJS.CellRichTextValue).richText
        .map((fragment) => fragment.text)
        .join("");
    }
    // ハイパーリンクセル: { text, hyperlink }
    if ("text" in value) {
      return String((value as ExcelJS.CellHyperlinkValue).text ?? "");
    }
    return "";
  }
  return String(value).trim();
}

// アップロードされたExcelファイルの1シート目を読み取り、1行目をヘッダーとする可変列の単語帳データに変換する
export async function parseExcelWorkbook(buffer: ArrayBuffer): Promise<ParsedNotebook> {
  // ファイルを読み込み、データをworkbookに格納する
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ExcelParseError(
      "Excelファイル（.xlsx）として読み込めませんでした。ファイル形式を確認してください。" +
        "Googleスプレッドシートの場合は、「ファイル」→「ダウンロード」→「Microsoft Excel（.xlsx）」で保存したファイルを選んでください。",
    );
  }

  // 1シート目のみを対象とする
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.actualRowCount === 0) {
    throw new ExcelParseError("シートにデータが見つかりませんでした。");
  }

  // 1行目のコラム名を取得する
  const headerRow = worksheet.getRow(1);
  const columnCount = Math.max(headerRow.actualCellCount, worksheet.actualColumnCount);
  if (columnCount === 0) {
    throw new ExcelParseError("1行目にヘッダーが見つかりませんでした。");
  }

  // 列名の組み立て
  const usedNames = new Set<string>();
  const columns: string[] = [];
  // コラム数だけ繰り返す
  for (let col = 1; col <= columnCount; col += 1) {
    const raw = cellToText(headerRow.getCell(col).value);
    // 列名が空白ならデフォルト名を割り当てる
    let name = raw || `列${col}`;
    // 同名列がある場合は連番を振って区別する
    while (usedNames.has(name)) {
      name = `${raw || `列${col}`} (${col})`;
    }
    usedNames.add(name);
    columns.push(name);
  }

  // 見出し語（1列目）を除いた列名一覧
  const bodyColumns = columns.slice(1);
  const cards: CardData[] = [];
  // 見出し語（1列目）ごとにカードをまとめるためのインデックス。
  // 同じ見出し語の行を1つのカードにまとめるため、「見出し語→配列内でのインデックス」を記録するMap
  const groupIndexByHead = new Map<string, number>();
  let blankHeadCount = 0;

  for (let r = 2; r <= worksheet.rowCount; r += 1) {
    const row = worksheet.getRow(r);
    if (row.actualCellCount === 0) {
      continue;
    }

    // cellValues：各列のセル値を文字化した配列
    const cellValues = columns.map((_, index) => cellToText(row.getCell(index + 1).value));
    const hasValue = cellValues.some((text) => text !== "");
    if (!hasValue) {
      continue;
    }

    // head：1列目の値（見出し語）
    const head = cellValues[0];

    const groupKey = head !== "" ? `h:${head}` : `b:${blankHeadCount++}`;
    let groupIndex = groupIndexByHead.get(groupKey);
    // 初出のグループなら新規カードを作成
    if (groupIndex === undefined) {
      groupIndex = cards.length;
      groupIndexByHead.set(groupKey, groupIndex);
      cards.push({ head, rows: [] });
    }

    // Excelの物理的な1行を、そのままこの見出し語の「組」1件として追加する。
    // 同じ行にある列同士（例: 訳・発音）は自動的にその行の添字で対応付けられる
    const cardRow: Record<string, string> = {};
    bodyColumns.forEach((name, index) => {
      const value = cellValues[index + 1];
      if (value !== "") cardRow[name] = value;
    });
    if (Object.keys(cardRow).length > 0) {
      cards[groupIndex].rows.push(cardRow);
    }
  }

  // 見出し語のみで本文列が1件も無かったカードには、空の組を1件持たせておく
  // （表の表示・編集は常に1件以上のrowsがある前提のため）
  for (const card of cards) {
    if (card.rows.length === 0) card.rows.push({});
  }

  if (cards.length === 0) {
    throw new ExcelParseError("2行目以降にデータが見つかりませんでした。");
  }

  return { columns, rows: cards };
}
