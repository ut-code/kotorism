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
