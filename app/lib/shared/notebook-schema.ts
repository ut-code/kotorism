import { z } from "zod";

import { parseWith, type ParseResult } from "./validation";

// 単語帳まわりの入力の上限。フォームの maxLength と、サーバー側の検証の両方で使う
export const NOTEBOOK_TITLE_MAX_LENGTH = 100;
export const COLUMN_NAME_MAX_LENGTH = 50;
export const CARD_HEAD_MAX_LENGTH = 200;
export const CARD_VALUE_MAX_LENGTH = 1000;
// ★の回数の上限。手動で回数を書き換えるときに、極端に大きな値が入らないようにする
export const MAX_STAR_COUNT = 999;

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label}を入力してください。` })
    .trim()
    .min(1, `${label}を入力してください。`)
    .max(max, `${label}は${max}文字以内で入力してください。`);

const notebookTitleSchema = requiredText("単語帳のタイトル", NOTEBOOK_TITLE_MAX_LENGTH);
const columnNameSchema = requiredText("列名", COLUMN_NAME_MAX_LENGTH);
const cardHeadSchema = requiredText("見出し語", CARD_HEAD_MAX_LENGTH);
// 見出し語以外の欄は未入力でもよい(空文字は保存しない)
const cardValueSchema = z
  .string()
  .trim()
  .max(CARD_VALUE_MAX_LENGTH, `1つの欄は${CARD_VALUE_MAX_LENGTH}文字以内で入力してください。`);

export const parseNotebookTitle = (input: unknown): ParseResult<string> =>
  parseWith(notebookTitleSchema, input);
// 一覧の「新しい単語帳」で作るときは、まず空の単語帳を開き、タイトルは開いたページで付ける。
// タイトルが空のまま作るときは、この名前にしておく
export const DEFAULT_NOTEBOOK_TITLE = "無題の単語帳";
export const parseNewNotebookTitle = (input: unknown): ParseResult<string> =>
  typeof input !== "string" || input.trim() === ""
    ? { success: true, data: DEFAULT_NOTEBOOK_TITLE }
    : parseNotebookTitle(input);
// 単語帳のタイトルが自分の別の単語帳と重なったときの選び方。このまま・番号を付ける・今日の日付を付ける。
// 選んでいない（初めて保存しようとした）ときは undefined で、重なっていれば候補を返して選んでもらう
const duplicateChoiceSchema = z
  .enum(["keep", "number", "date"], { error: "名前の付け方が正しくありません。" })
  .optional();
export type DuplicateChoice = z.infer<typeof duplicateChoiceSchema>;
export const parseDuplicateChoice = (input: unknown): ParseResult<DuplicateChoice> =>
  parseWith(duplicateChoiceSchema, input ?? undefined);
export const parseColumnName = (input: unknown): ParseResult<string> =>
  parseWith(columnNameSchema, input);
export const parseCardHead = (input: unknown): ParseResult<string> =>
  parseWith(cardHeadSchema, input);
export const parseCardValue = (input: unknown): ParseResult<string> =>
  parseWith(cardValueSchema, input);

// ★の回数。整数に丸め、0 以上 MAX_STAR_COUNT 以下に収める。数値でなければ 0
export function parseStarCount(input: unknown): number {
  const value = Number(input);
  if (input === null || input === undefined || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), MAX_STAR_COUNT);
}
