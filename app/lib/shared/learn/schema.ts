import { z } from "zod";

import { LANGUAGES } from "./languages";
import { parseWith, type ParseResult } from "../validation";

const languageSlugs = LANGUAGES.map((language) => language.languageSlug) as [string, ...string[]];

// セクションの番号("01" など)。DB にそのまま保存されるので、数字だけに限る
const sectionKeyShape = {
  language: z.enum(languageSlugs),
  sectionSlug: z.string().regex(/^\d{1,3}$/),
};

const sectionKeySchema = z.object(sectionKeyShape);

// 進捗 API(POST)の本文。intent ごとに必要な項目が違う
const learnActionSchema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("quizAnswer"), ...sectionKeyShape, correct: z.boolean() }),
  z.object({ intent: z.literal("markReviewed"), ...sectionKeyShape }),
  z.object({ intent: z.literal("toggleManualTag"), ...sectionKeyShape }),
  z.object({ intent: z.literal("recordView"), ...sectionKeyShape }),
]);

export type LearnAction = z.infer<typeof learnActionSchema>;

export const parseSectionKey = (input: unknown): ParseResult<z.infer<typeof sectionKeySchema>> =>
  parseWith(sectionKeySchema, input);
export const parseLearnAction = (input: unknown): ParseResult<LearnAction> =>
  parseWith(learnActionSchema, input);
