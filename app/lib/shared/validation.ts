import type { ZodType } from "zod";

// 検証の結果。失敗時は、画面にそのまま出せる最初のエラーメッセージを返す
export type ParseResult<T> = { success: true; data: T } | { success: false; error: string };

export function parseWith<T>(schema: ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues[0]?.message ?? "入力が正しくありません。" };
}
