import { listMdxSources, readMdxSource, unescapeMarkdown } from "@/lib/shared/mdx-source";
import type { PracticeLanguageSlug } from "@/lib/shared/practice-languages";

// 表完成・穴埋め・数字タイピングの出題データは、教材の MDX に書いた（非表示の）表から読み取る。
// 教材ファイルを唯一のデータソースにして、データを二重に持たないようにするため

export type GrammarTableCell = { value: string; colSpan: number };
export type GrammarTableRow = { label: string; cells: GrammarTableCell[] };
export type GrammarTable = { title: string; headers: string[]; rows: GrammarTableRow[] };

export type FillInItem = {
  id: string;
  category: string;
  sentence: string;
  translation: string;
  answer: string;
  explanation?: string;
};

export type NumberItem = { num: number; spelling: string };

// "| a | b |" の行をセルの配列にする。表の行でなければ null
function tableCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed
    .split("|")
    .slice(1, -1)
    .map((c) => unescapeMarkdown(c.trim()));
}

// 区切り行（| --- | :---: |）
function isSeparatorRow(cells: string[]): boolean {
  return cells.every((c) => /^[-:\s]+$/.test(c));
}

// 見出し（### …）なら見出しの文字列
function heading3(line: string): string | null {
  const trimmed = line.trim();
  return trimmed.startsWith("###") ? trimmed.replace(/^###\s*/, "").trim() : null;
}

// 同じ値が横に続くセルは1つにまとめる（「男性・女性で同じ形」などを結合セルで見せるため）
function mergeAdjacentCells(cells: string[]): GrammarTableCell[] {
  const merged: GrammarTableCell[] = [];
  for (const value of cells) {
    const previous = merged.at(-1);
    if (previous?.value === value) previous.colSpan += 1;
    else merged.push({ value, colSpan: 1 });
  }
  return merged;
}

// 表完成: 見出し（###）ごとに1つの表。表の1行目が列見出し、各行の1列目が行見出し
export function loadGrammarTables(language: PracticeLanguageSlug, section: string): GrammarTable[] {
  const tables: GrammarTable[] = [];
  let current: GrammarTable = { title: "文法表", headers: [], rows: [] };
  const flush = () => {
    if (current.headers.length > 0 && current.rows.length > 0) tables.push(current);
  };

  for (const line of readMdxSource(language, section).split("\n")) {
    const title = heading3(line);
    if (title !== null) {
      flush();
      current = { title, headers: [], rows: [] };
      continue;
    }
    const cells = tableCells(line);
    if (!cells || cells.length < 2 || isSeparatorRow(cells)) continue;
    if (current.headers.length === 0) current.headers = cells;
    else current.rows.push({ label: cells[0], cells: mergeAdjacentCells(cells.slice(1)) });
  }
  flush();
  return tables;
}

// 穴埋め: 見出し（###）がカテゴリ。各行は「問題文 | 訳・ヒント | 正解 | 解説（任意）」
export function loadFillInItems(language: PracticeLanguageSlug, section: string): FillInItem[] {
  const items: FillInItem[] = [];
  let category = "文法問題";

  for (const line of readMdxSource(language, section).split("\n")) {
    const title = heading3(line);
    if (title !== null) {
      category = title;
      continue;
    }
    const cells = tableCells(line);
    if (!cells || cells.length < 3 || isSeparatorRow(cells)) continue;
    // 列見出しの行
    if (cells[0] === "例文 (問題文)" || cells[2] === "正解") continue;
    items.push({
      id: `q-${items.length + 1}`,
      category,
      sentence: cells[0],
      translation: cells[1],
      answer: cells[2],
      explanation: cells[3] || undefined,
    });
  }
  return items;
}

// 数字タイピング: その言語の全セクションから「数字 | つづり」の行を集める
export function loadNumberItems(language: PracticeLanguageSlug): NumberItem[] {
  const items: NumberItem[] = [];
  for (const { content } of listMdxSources(language)) {
    for (const line of content.split("\n")) {
      const cells = tableCells(line);
      if (!cells || cells.length < 2) continue;
      const [num, spelling] = cells;
      if (/^\d+$/.test(num) && spelling && spelling !== "-") {
        items.push({ num: Number(num), spelling });
      }
    }
  }
  return items;
}
