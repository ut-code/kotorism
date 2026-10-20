import { useState } from "react";

import { CheckboxPicker } from "@/components/practice/CheckboxPicker";
import { Quiz as PracticeQuiz } from "@/components/practice/Quiz";
import {
  BLANK,
  filterByUnits,
  type ChoiceFocus,
  type GrammarQuestion,
  type GrammarUnitDef,
} from "@/lib/shared/learn/grammar-quiz";

const instructions = (languageLabel: string): Record<ChoiceFocus, string> => ({
  meaning: "意味　この文の意味は？",
  form: `形　日本語に合う${languageLabel}は？`,
  context: "文脈　会話の流れに合う表現は？",
  blank: "穴埋め　空欄に入る語は？",
});

// 空欄入りの学ぶ言語の文。空欄は下線で示し、答え合わせ後は正解を埋めて見せる
function BlankSentence({ text, filled }: { text: string; filled?: string }) {
  const [before, after] = text.split(BLANK);
  return (
    <>
      {before}
      <span className="mx-1 inline-block min-w-[3em] border-b-2 border-current text-tealblue-600 dark:text-tealblue-400">
        {filled ?? "　"}
      </span>
      {after}
    </>
  );
}

function Prompt({ q, answered, lang }: { q: GrammarQuestion; answered: boolean; lang: string }) {
  if (q.focus === "form") {
    return <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{q.prompt}</p>;
  }
  return (
    <div className="space-y-3">
      <div lang={lang} className="space-y-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {q.prompt.split("\n").map((line) => (
          <p key={line}>
            {line.includes(BLANK) ? (
              <BlankSentence text={line} filled={answered ? q.answer : undefined} />
            ) : (
              line
            )}
          </p>
        ))}
      </div>
      {q.note && <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.note}</p>}
    </div>
  );
}

// 文法クイズ。選んだ単元の問題を、「意味」「形」「文脈」「穴埋め」の4観点の4択で出題する。
// 出題順は「練習を始める」を押したときに決めるので、サーバーとブラウザで表示が食い違わない。
// lang は学ぶ言語の BCP 47 タグ（zh-CN など）、languageLabel は「中国語」などの表示名
export function GrammarQuiz({
  units: unitDefs,
  questions,
  lang,
  languageLabel,
}: {
  units: readonly GrammarUnitDef[];
  questions: GrammarQuestion[];
  lang: string;
  languageLabel: string;
}) {
  const [units, setUnits] = useState<Set<string>>(() => new Set(unitDefs.map((u) => u.id)));
  const unitItems = unitDefs.map((u) => ({ id: u.id, label: u.label, sub: u.sub }));
  const instruction = instructions(languageLabel);

  return (
    <PracticeQuiz
      pool={filterByUnits(questions, units)}
      settings={
        <CheckboxPicker
          title="出題する単元"
          unit="単元"
          items={unitItems}
          selected={units}
          onChange={setUnits}
          variant="chip"
        />
      }
      emptyMessage="出題する単元を1つ以上選んでください。"
      countOptions={["10", "all"]}
      defaultCount="10"
      lang="ja"
      mode={{ kind: "choice", choices: (q) => q.choices }}
      instruction={(q) => instruction[q.focus]}
      renderPrompt={(q, answered) => <Prompt q={q} answered={answered} lang={lang} />}
      renderMistakePrompt={(q) => (
        <span lang={q.focus === "form" ? "ja" : lang} className="font-semibold">
          {q.prompt.replace("\n", " ")}
        </span>
      )}
    />
  );
}
