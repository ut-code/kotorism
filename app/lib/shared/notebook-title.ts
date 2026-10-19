import type { FormState } from "./form-state";
import { NOTEBOOK_TITLE_MAX_LENGTH } from "./notebook-schema";

// 単語帳のタイトルが自分の別の単語帳と重なったときに選べる、重ならない名前の作り方

// 名前の後ろに suffix を付ける。タイトルの上限を超えるときは、名前の末尾を削って収める
function withSuffix(title: string, suffix: string): string {
  return `${title.slice(0, NOTEBOOK_TITLE_MAX_LENGTH - suffix.length)}${suffix}`;
}

// 名前の後ろに、1から順に空いている番号を付ける（例: 「フランス語 1」）
export function numberedTitle(title: string, existing: readonly string[]): string {
  const taken = new Set(existing);
  for (let n = 1; ; n += 1) {
    const candidate = withSuffix(title, ` ${n}`);
    if (!taken.has(candidate)) return candidate;
  }
}

// 名前の後ろに、今日の日付（日本時間の "YYYY-MM-DD"）を付ける。それもすでにあれば、さらに番号を付ける
export function datedTitle(title: string, day: string, existing: readonly string[]): string {
  const dated = withSuffix(title, ` ${day}`);
  return existing.includes(dated) ? numberedTitle(dated, existing) : dated;
}

// タイトルを変えようとしたら自分の別の単語帳と重なったときに、画面へ返す候補
export type DuplicateTitle = { title: string; numbered: string; dated: string };
export type RenameNotebookState = FormState & { duplicate?: DuplicateTitle };
