import { z } from "zod";

import { parseWith, type ParseResult } from "../validation";

// 満点の選択肢や、原文・訳文の長さのような「中身」の検証は、画面に出す文言と合わせて action 側で行う。
// ここでは、JSON として届いた値が想定した型の形をしているかだけを確かめる
// （型が違うまま action に渡すと、.trim() などで落ちて 500 になる）
const submitTranslationSchema = z.object({
  language: z.string({ error: "言語が正しくありません。" }),
  problemSource: z.enum(["preset", "custom"], { error: "題材の指定方法が正しくありません。" }),
  // preset のとき使う(app/lib/shared/translation/problems.ts の id)
  problemId: z.string({ error: "問題が正しくありません。" }).optional(),
  // custom のとき使う、設定画面で先に選ばせた訳す方向
  direction: z
    .enum(["fromJapanese", "toJapanese"], { error: "訳す方向が正しくありません。" })
    .optional(),
  // custom のとき使う、ユーザーが自由に入力した原文
  customSourceText: z.string({ error: "原文を入力してください。" }).optional(),
  content: z.string({ error: "訳文を入力してください。" }),
  // 満点(TRANSLATION_SCORE_OPTIONS のいずれか)
  scoreMax: z.number({ error: "満点の指定が正しくありません。" }),
});

export type SubmitTranslationInput = z.infer<typeof submitTranslationSchema>;

export const parseSubmitTranslationInput = (input: unknown): ParseResult<SubmitTranslationInput> =>
  parseWith(submitTranslationSchema, input);
