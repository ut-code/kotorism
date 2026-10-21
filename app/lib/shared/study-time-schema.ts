import { z } from "zod";

import { parseWith, type ParseResult } from "./validation";
import type { StudyTimeReport } from "./study-time";

// ブラウザ側が付ける識別子。DB のキーにそのまま使うので、使える文字と長さを絞る
const clientIdSchema = z.string().regex(/^[\w-]{1,64}$/);

const activitySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("deck"),
    deckId: z.string(),
    mode: z.enum(["study", "review", "quiz"]),
  }),
  z.object({ kind: z.literal("section"), language: z.string(), sectionSlug: z.string() }),
]);

// 秒数は有限の正の数だけ通す。上限の丸めは recordStudyTime が行う
const studyTimeReportSchema = z.object({
  clientId: clientIdSchema,
  activity: activitySchema,
  seconds: z.number().positive().finite(),
});

export const parseStudyTimeReport = (input: unknown): ParseResult<StudyTimeReport> =>
  parseWith(studyTimeReportSchema, input);
