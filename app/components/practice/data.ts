import { listMdxSources, readMdxSource } from "@/lib/shared/mdx-source";
import {
  parseFillInItems,
  parseGrammarTables,
  parseNumberItems,
  parseTimeItems,
  type FillInItem,
  type GrammarTable,
  type NumberItem,
  type TimeItem,
} from "@/lib/shared/practice-data";
import type { PracticeLanguageSlug } from "@/lib/shared/practice-languages";

// 表完成・穴埋め・数字・時間表現の出題データは、教材の MDX に書いた（非表示の）表から読み取る。
// 教材ファイルを唯一のデータソースにして、データを二重に持たないようにするため

export type {
  FillInItem,
  GrammarTable,
  GrammarTableCell,
  GrammarTableRow,
  NumberItem,
  TimeItem,
} from "@/lib/shared/practice-data";

// 表完成: 教材 MDX の表から演習用データを作る
export function loadGrammarTables(language: PracticeLanguageSlug, section: string): GrammarTable[] {
  return parseGrammarTables(readMdxSource(language, section));
}

// 穴埋め: 教材 MDX の表から演習用データを作る
export function loadFillInItems(language: PracticeLanguageSlug, section: string): FillInItem[] {
  return parseFillInItems(readMdxSource(language, section));
}

// 数字・時間表現（数字）: その言語の全セクションから演習用データを作る
export function loadNumberItems(language: PracticeLanguageSlug): NumberItem[] {
  return parseNumberItems(listMdxSources(language).map(({ content }) => content));
}

// 数字・時間表現（時刻）: そのセクションの MDX の「時刻 | 言い方 | 補足」の表から作る
export function loadTimeItems(language: PracticeLanguageSlug, section: string): TimeItem[] {
  return parseTimeItems(readMdxSource(language, section));
}
