// 1枚のカード（見出し語1つ）が持つデータ構造。
// rows: 見出し語につく「組」の並び（Excelの1行に相当）。同じ添字の値同士が
// 列をまたいで対応する（例: rows[1].訳 と rows[1].発音 は同じ組＝対応する意味・発音）。
// 見出し語1件で複数の意味を持たせたいときは rows を複数件にする
export type CardData = {
  head: string;
  rows: Record<string, string>[];
};

// 列ごとに独立した配列（cells）を、添字を揃えて組（rows）に変換する。
// 添字がそのまま対応関係になるため、Excelから取り込んだ直後のように
// 各列の並び順が揃っている場合はそのまま正しく組み直される
function cellsToRows(cells: Record<string, string[]>): Record<string, string>[] {
  const rowCount = Math.max(0, ...Object.values(cells).map((values) => values.length));
  if (rowCount === 0) return [{}];

  const rows: Record<string, string>[] = [];
  for (let i = 0; i < rowCount; i += 1) {
    const row: Record<string, string> = {};
    for (const [key, values] of Object.entries(cells)) {
      const value = values[i];
      if (value) row[key] = value;
    }
    rows.push(row);
  }
  return rows;
}

function normalizeRow(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const row: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value !== "") row[key] = value;
  }
  return row;
}

// DBから読んだcard.dataを正規化する。
// 過去に存在した別形式（cells: 列名→値の配列で列同士が完全に独立した形式、
// さらに古いsingle+senses形式）で保存されたデータも rows 形式へ変換して読み込む
export function normalizeCardData(raw: unknown): CardData {
  const data = (raw ?? {}) as {
    head?: unknown;
    rows?: unknown;
    cells?: unknown;
    single?: unknown;
    senses?: unknown;
  };
  const head = typeof data.head === "string" ? data.head : "";

  // 最新形式: { head, rows }
  if (Array.isArray(data.rows)) {
    const rows = data.rows.map(normalizeRow);
    return { head, rows: rows.length > 0 ? rows : [{}] };
  }

  // 旧形式（cells: 列名→値の配列、列ごとに独立）からの変換。
  // 添字で突き合わせて組に変換する（元がExcel由来なら添字は本来の対応関係と一致する）
  if (data.cells && typeof data.cells === "object" && !Array.isArray(data.cells)) {
    const cells: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(data.cells as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        cells[key] = value.filter((v): v is string => typeof v === "string" && v !== "");
      }
    }
    return { head, rows: cellsToRows(cells) };
  }

  // さらに旧形式（single + senses）からの変換
  const cells: Record<string, string[]> = {};
  const single =
    data.single && typeof data.single === "object" && !Array.isArray(data.single)
      ? (data.single as Record<string, string>)
      : {};
  for (const [key, value] of Object.entries(single)) {
    if (value !== "") cells[key] = [value];
  }
  const senses = Array.isArray(data.senses) ? (data.senses as Record<string, string>[]) : [];
  for (const sense of senses) {
    for (const [key, value] of Object.entries(sense)) {
      if (value === "") continue;
      (cells[key] ??= []).push(value);
    }
  }

  return { head, rows: cellsToRows(cells) };
}
