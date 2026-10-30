import { z } from "zod";

import { parseWith, type ParseResult } from "./validation";

// ヘッダーや「〜さんから共有」に出す名前の上限。長すぎるとヘッダーが崩れるため短めにする。
// フォームの maxLength とサーバー側の検証の両方で使う
export const DISPLAY_NAME_MAX_LENGTH = 30;

const displayNameSchema = z
  .string({ error: "名前を入力してください。" })
  .trim()
  .min(1, "名前を入力してください。")
  .max(DISPLAY_NAME_MAX_LENGTH, `名前は${DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください。`);

export const parseDisplayName = (input: unknown): ParseResult<string> =>
  parseWith(displayNameSchema, input);
