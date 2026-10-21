import { unescapeMarkdown } from "./mdx-source";

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
  // 4択のときの誤答（表の5列目に「 / 」区切りで書く）。無ければ空
  distractors: string[];
};

export type NumberItem = { num: number; spelling: string };

// 時刻の言い方。answers の先頭が正解、残りは別の言い方
export type TimeItem = { time: string; answers: string[]; note: string };

// "| a | b |" の行をセルの配列にする。表の行でなければ null
function tableCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed
    .split("|")
    .slice(1, -1)
    .map((cell) => unescapeMarkdown(cell.trim()));
}

// 区切り行（| --- | :---: |）
function isSeparatorRow(cells: string[]): boolean {
  return cells.every((cell) => /^[-:\s]+$/.test(cell));
}

// 見出し（### …）なら見出しの文字列
function heading3(line: string): string | null {
  const trimmed = line.trim();
  return trimmed.startsWith("###") ? trimmed.replace(/^###\s*/, "").trim() : null;
}

// 同じ値が横に続くセルは1つにまとめる（「男性・女性で同じ形」などの結合セル）
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
export function parseGrammarTables(source: string): GrammarTable[] {
  const tables: GrammarTable[] = [];
  let current: GrammarTable = { title: "文法表", headers: [], rows: [] };
  const flush = () => {
    if (current.headers.length > 0 && current.rows.length > 0) tables.push(current);
  };

  for (const line of source.split("\n")) {
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
export function parseFillInItems(source: string): FillInItem[] {
  const items: FillInItem[] = [];
  let category = "文法問題";

  for (const line of source.split("\n")) {
    const title = heading3(line);
    if (title !== null) {
      category = title;
      continue;
    }
    const cells = tableCells(line);
    if (!cells || cells.length < 3 || isSeparatorRow(cells)) continue;
    if (cells[0] === "例文 (問題文)" || cells[2] === "正解") continue;
    items.push({
      id: `q-${items.length + 1}`,
      category,
      sentence: cells[0],
      translation: cells[1],
      answer: cells[2],
      explanation: cells[3] || undefined,
      distractors: cells[4] ? cells[4].split(" / ").map((d) => d.trim()) : [],
    });
  }
  return items;
}

// 数字・時間表現: 複数のセクション本文から「数字 | つづり」の行を集める
export function parseNumberItems(sources: string[]): NumberItem[] {
  const items: NumberItem[] = [];
  for (const source of sources) {
    for (const line of source.split("\n")) {
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

// 時刻: 「時刻 | 言い方 | 補足」の行を集める。言い方が複数あれば「 / 」で区切る
export function parseTimeItems(source: string): TimeItem[] {
  const items: TimeItem[] = [];
  for (const line of source.split("\n")) {
    const cells = tableCells(line);
    if (!cells || cells.length < 2 || !/^\d{1,2}:\d{2}$/.test(cells[0])) continue;
    const answers = cells[1]
      .split(" / ")
      .map((a) => a.trim())
      .filter(Boolean);
    if (answers.length > 0) items.push({ time: cells[0], answers, note: cells[2] ?? "" });
  }
  return items;
}
