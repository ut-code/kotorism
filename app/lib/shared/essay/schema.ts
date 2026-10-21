import { z } from "zod";

import { parseWith, type ParseResult } from "../validation";
import { ESSAY_CRITERIA, type EssayCriterionKey } from "./types";

// 配点の範囲や、お題・本文の長さのような「中身」の検証は、画面に出す文言と合わせて action 側で行う。
// ここでは、JSON として届いた値が想定した型の形をしているかだけを確かめる
// （型が違うまま action に渡すと、.trim() などで落ちて 500 になる）
const criteriaMaxSchema = z.object(
  Object.fromEntries(
    ESSAY_CRITERIA.map(({ key }) => [key, z.number({ error: "配点が正しくありません。" })]),
  ) as Record<EssayCriterionKey, z.ZodNumber>,
  { error: "配点が正しくありません。" },
);

const submitEssaySchema = z.object({
  language: z.string({ error: "言語が正しくありません。" }),
  topicSource: z.enum(["preset", "custom"], { error: "お題の指定方法が正しくありません。" }),
  // preset のとき使う(app/lib/shared/essay/topics.ts の id)
  topicId: z.string({ error: "お題が正しくありません。" }).optional(),
  // custom のとき使う、ユーザーが自由に入力したお題文
  customTopicPrompt: z.string({ error: "お題が正しくありません。" }).optional(),
  // custom のとき使う(ESSAY_LENGTH_OPTIONS のいずれか)
  customTargetWordCount: z.number({ error: "分量目安が正しくありません。" }).optional(),
  content: z.string({ error: "作文を入力してください。" }),
  criteriaMax: criteriaMaxSchema,
});

export type SubmitEssayInput = z.infer<typeof submitEssaySchema>;

export const parseSubmitEssayInput = (input: unknown): ParseResult<SubmitEssayInput> =>
  parseWith(submitEssaySchema, input);
