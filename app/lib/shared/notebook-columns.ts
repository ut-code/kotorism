// DBに保存されているcolumnsを、列名の配列に正規化する。
// 過去に一時的に「列ごとの設定を持つオブジェクト（{name, repeatable}）」の形式で
// 保存されたことがあるため、その形式が来た場合も名前だけを取り出して吸収する
export function normalizeColumns(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (entry && typeof entry === "object" && "name" in (entry as Record<string, unknown>)) {
      return String((entry as { name: unknown }).name);
    }
    return String(entry);
  });
}

// アプリ上で作った単語帳の、見出し語の列（1列目）の既定の名前
export const DEFAULT_HEAD_COLUMN = "見出し語";

// Excelの取り込みで、単語帳の列にExcelの1行目（imported）を合わせる。
// 見出し語の列は、名前が既定（見出し語）のままならExcelの1列目の名前に書き換える
// （1列目が空欄で「列1」と名付けられたときや、ほかの列と名前がぶつかるときは書き換えない）。
// 2列目以降は、単語帳に無い列だけを後ろに足す
export function mergeImportedColumns(existing: string[], imported: string[]): string[] {
  if (existing.length === 0) return [...imported];
  const columns = [...existing];
  for (const name of imported.slice(1)) {
    if (!columns.includes(name)) columns.push(name);
  }
  const importedHead = imported[0];
  if (
    columns[0] === DEFAULT_HEAD_COLUMN &&
    importedHead !== undefined &&
    importedHead !== "列1" &&
    !columns.includes(importedHead)
  ) {
    columns[0] = importedHead;
  }
  return columns;
}
