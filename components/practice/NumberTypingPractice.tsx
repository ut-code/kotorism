"use client";

import { useMemo, useState } from "react";

import { loadNumberItems } from "@/components/practice/data";
import { ChoiceChips, SettingRow } from "@/components/practice/PracticeControls";
import { Quiz, QuizEmpty } from "@/components/practice/Quiz";
import { languageTypingMode } from "@/components/practice/typing-mode";
import { PRACTICE_LANGUAGES, type PracticeLanguageSlug } from "@/lib/practice-languages";

type NumberQuestion = { id: string; num: number; answer: string };

const inRange = (min: number, max: number) => (q: NumberQuestion) => q.num >= min && q.num <= max;

const SCOPES = [
  { value: "all", label: "全範囲", match: () => true },
  { value: "0-19", label: "0〜19", match: inRange(0, 19) },
  { value: "20-50", label: "20〜50", match: inRange(20, 50) },
  { value: "50-100", label: "50〜100", match: inRange(50, 100) },
];

// 数字タイピング演習。数字を見て、その言語のつづりを入力する。
// 出題データはその言語の全セクションの MDX にある「数字 | つづり」の表から集める
export default function NumberTypingPractice({ language }: { language: PracticeLanguageSlug }) {
  const lang = PRACTICE_LANGUAGES[language];
  const questions = useMemo(
    () =>
      loadNumberItems(language).map((item, i) => ({
        id: `${item.num}-${i}`,
        num: item.num,
        answer: item.spelling,
      })),
    [language],
  );
  const [scope, setScope] = useState("all");
  const pool = questions.filter(SCOPES.find((s) => s.value === scope)?.match ?? (() => true));

  if (questions.length === 0) return <QuizEmpty />;

  return (
    <Quiz
      pool={pool}
      settings={
        <SettingRow label="出題範囲">
          <ChoiceChips label="出題範囲" options={SCOPES} value={scope} onChange={setScope} />
        </SettingRow>
      }
      timer
      lang={lang.lang}
      mode={languageTypingMode(lang, "つづりを入力…")}
      instruction={`数字を${lang.label}のつづりで入力してください`}
      renderPrompt={(q) => (
        <div className="text-6xl font-black tracking-tight text-zinc-900 tabular-nums md:text-7xl dark:text-zinc-50">
          {q.num}
        </div>
      )}
      renderMistakePrompt={(q) => <span className="font-bold tabular-nums">{q.num}</span>}
    />
  );
}
