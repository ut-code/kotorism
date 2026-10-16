"use client";

import { useMemo, useState } from "react";

import { loadFillInItems } from "@/components/practice/data";
import { ChoiceChips, SettingRow } from "@/components/practice/PracticeControls";
import { Quiz, QuizEmpty } from "@/components/practice/Quiz";
import { languageTypingMode } from "@/components/practice/typing-mode";
import { PRACTICE_LANGUAGES, type PracticeLanguageSlug } from "@/lib/practice-languages";

// 穴埋め演習。例文の空欄（_）に入る語形を入力する。
// 出題データはこのセクションの MDX にある表から読み取り、表の上の見出し（###）を出題範囲にする
export default function FillInPractice({
  language,
  section,
}: {
  language: PracticeLanguageSlug;
  section: string;
}) {
  const lang = PRACTICE_LANGUAGES[language];
  const items = useMemo(() => loadFillInItems(language, section), [language, section]);
  const categories = useMemo(() => [...new Set(items.map((item) => item.category))], [items]);
  const [scope, setScope] = useState("all");
  const pool = scope === "all" ? items : items.filter((item) => item.category === scope);

  if (items.length === 0) return <QuizEmpty />;

  return (
    <Quiz
      pool={pool}
      settings={
        <SettingRow label="出題範囲">
          <ChoiceChips
            label="出題範囲"
            options={[
              { value: "all", label: "すべて" },
              ...categories.map((category) => ({ value: category, label: category })),
            ]}
            value={scope}
            onChange={setScope}
          />
        </SettingRow>
      }
      timer
      lang={lang.lang}
      mode={languageTypingMode(lang, "語形を入力…")}
      instruction="空欄に入る語形を入力してください"
      renderPrompt={(item) => (
        <>
          <span className="inline-block rounded-full bg-tealblue-50 px-3 py-1 text-xs font-bold text-tealblue-700 dark:bg-tealblue-950/50 dark:text-tealblue-300">
            {item.category}
          </span>
          <p
            lang={lang.lang}
            className="mt-4 text-3xl font-bold leading-snug tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
          >
            {item.sentence}
          </p>
          <p className="mt-3 text-base text-zinc-600 md:text-lg dark:text-zinc-400">
            {item.translation}
          </p>
        </>
      )}
      renderMistakePrompt={(item) => (
        <>
          <span lang={lang.lang} className="font-semibold">
            {item.sentence}
          </span>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{item.translation}</span>
        </>
      )}
    />
  );
}
