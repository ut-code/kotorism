import { z } from "zod";

import { parseWith, type ParseResult } from "./validation";

// お祝いメッセージを閉じたときに送る節目(連続学習の日数)。FormData の値は文字列なので数値にして検証する
const acknowledgeStreakSchema = z.object({
  intent: z.literal("acknowledge"),
  milestone: z.coerce.number().int().positive(),
});

export type AcknowledgeStreak = z.infer<typeof acknowledgeStreakSchema>;

export const parseAcknowledgeStreak = (formData: FormData): ParseResult<AcknowledgeStreak> =>
  parseWith(acknowledgeStreakSchema, {
    intent: formData.get("intent"),
    milestone: formData.get("milestone"),
  });
