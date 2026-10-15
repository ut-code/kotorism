import { readMdxSource } from "@/lib/shared/mdx-source";
import GermanTablePractice, {
  type GrammarTableCell,
  type GrammarTableData,
  type GrammarTableRow,
} from "./GermanTablePractice";

function mergeAdjacentCells(cells: string[]): GrammarTableCell[] {
  const mergedCells: GrammarTableCell[] = [];

  for (const value of cells) {
    const previousCell = mergedCells.at(-1);
    if (previousCell?.value === value) {
      previousCell.colSpan += 1;
    } else {
      mergedCells.push({ value, colSpan: 1 });
    }
  }

  return mergedCells;
}

/**
 * MDX教材ファイル（app/routes/learn._german.german.04/content.mdx）から
 * 人称代名詞・所有冠詞・冠詞・指示詞の各文法表データを動的に抽出する関数。
 * データのベタ打ちを排除し、教材ファイルを唯一のデータソースとして使用する。
 */
function getGrammarTablesFromMdx(): GrammarTableData[] {
  const tables: GrammarTableData[] = [];

  try {
    const content = readMdxSource("german", "04");
    const lines = content.split("\n");

    let currentCategory = "文法表";
    let currentHeaders: string[] = [];
    let currentRows: GrammarTableRow[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // 見出し3（###）でカテゴリ切り替え
      if (trimmed.startsWith("###")) {
        if (currentHeaders.length > 0 && currentRows.length > 0) {
          tables.push({
            categoryKey: currentCategory.toLowerCase(),
            categoryTitle: currentCategory,
            headers: currentHeaders,
            rows: currentRows,
          });
        }
        currentCategory = trimmed.replace(/^###\s*/, "").trim();
        currentHeaders = [];
        currentRows = [];
      } else if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        if (cells.length >= 2) {
          // 区切り行（| --- | --- |）は無視
          if (cells.every((c) => /^[-:\s]+$/.test(c))) {
            continue;
          }

          // 最初のデータ行をヘッダーとして取得
          if (currentHeaders.length === 0) {
            currentHeaders = cells;
          } else {
            const label = cells[0];
            const rowCells = mergeAdjacentCells(cells.slice(1));
            currentRows.push({ label, cells: rowCells });
          }
        }
      }
    }

    // 最後のテーブルを追加
    if (currentHeaders.length > 0 && currentRows.length > 0) {
      tables.push({
        categoryKey: currentCategory.toLowerCase(),
        categoryTitle: currentCategory,
        headers: currentHeaders,
        rows: currentRows,
      });
    }
  } catch {
    // 読込エラー時は空配列を返す
  }

  return tables;
}

/**
 * サーバー側でMDXから文法表データを読み込み、
 * 表完成演習コンポーネント（GermanTablePractice）へ受け渡すServer Component。
 */
export default function GermanTablePracticeLoader() {
  const tables = getGrammarTablesFromMdx();
  return <GermanTablePractice tables={tables} />;
}
