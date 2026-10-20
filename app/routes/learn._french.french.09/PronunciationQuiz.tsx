import { useEffect, useState } from "react";

import { CheckboxPicker } from "@/components/practice/CheckboxPicker";
import { Quiz } from "@/components/practice/Quiz";
import { BLANK, filterByUnits } from "@/lib/shared/learn/grammar-quiz";
import {
  PRONUNCIATION_KINDS,
  speechForChoice,
  type PronunciationKind,
  type PronunciationQuestion,
} from "@/lib/shared/learn/pronunciation-quiz";
import { speak } from "@/lib/shared/speech";

import { pronunciationQuiz, pronunciationUnits } from "./quiz-data";

const LANG = "fr-FR";

const unitItems = pronunciationUnits.map((u) => ({ id: u.id, label: u.label, sub: u.sub }));

const INSTRUCTIONS: Record<PronunciationKind, string> = {
  listening: "聞き取り　読み上げられた語の空欄に入るつづりは？",
  rule: "ルール　発音のルールについて答えましょう",
  reading: "読み方　選択肢を押して聞き比べ、正しい発音を選びましょう",
};

const stopSpeaking = () => window.speechSynthesis?.cancel();

// 聞き取りの問題文。出題したときに語を読み上げ、「もう一度聞く」で何度でも聞ける。
// 答え合わせ後は空欄に正解を埋め、語の意味を出す
function ListeningPrompt({ q, answered }: { q: PronunciationQuestion; answered: boolean }) {
  const play = () => q.speech && speak(q.speech, LANG);
  // 問題が変わるたびに読み上げる（「練習を始める」「次の問題へ」の操作の直後なので自動再生が許される）
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void play(), [q.id]);

  const [before, after] = q.prompt.split(BLANK);
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={play}
        className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-semibold text-zinc-600 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-tealblue-500 dark:hover:text-tealblue-300"
      >
        もう一度聞く
      </button>
      <p lang="fr" className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {before}
        <span className="mx-1 inline-block min-w-[2em] border-b-2 border-current text-tealblue-600 dark:text-tealblue-400">
          {answered ? q.answer : "　"}
        </span>
        {after}
      </p>
      {answered && q.note && <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.note}</p>}
    </div>
  );
}

function Prompt({ q, answered }: { q: PronunciationQuestion; answered: boolean }) {
  if (q.kind === "listening") return <ListeningPrompt q={q} answered={answered} />;
  if (q.kind === "rule") {
    return <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{q.prompt}</p>;
  }
  return (
    <div className="space-y-3">
      <p lang="fr" className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {q.prompt}
      </p>
      {q.note && <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.note}</p>}
    </div>
  );
}

// フランス語の発音クイズ。「聞き取り」「ルール」「読み方」の3つの形式の4択で、選んだ単元・形式の問題を出題する。
// 読み方の問題は、選択肢を押すとその発音を読み上げ、「答え合わせ」で確定する。発音記号は答え合わせのあとに出す
export default function PronunciationQuiz() {
  const [units, setUnits] = useState<Set<string>>(
    () => new Set(pronunciationUnits.map((u) => u.id)),
  );
  const [kinds, setKinds] = useState<Set<string>>(
    () => new Set(PRONUNCIATION_KINDS.map((k) => k.id)),
  );
  useEffect(() => stopSpeaking, []);

  const pool = filterByUnits(pronunciationQuiz, units).filter((q) => kinds.has(q.kind));

  return (
    <Quiz
      pool={pool}
      settings={
        <>
          <CheckboxPicker
            title="出題する単元"
            unit="単元"
            items={unitItems}
            selected={units}
            onChange={setUnits}
            variant="chip"
          />
          <CheckboxPicker
            title="出題する形式"
            unit="形式"
            items={PRONUNCIATION_KINDS}
            selected={kinds}
            onChange={setKinds}
            variant="chip"
          />
        </>
      }
      emptyMessage="出題する単元と形式を1つ以上選んでください。"
      countOptions={["10", "all"]}
      defaultCount="10"
      lang="fr"
      mode={(q) =>
        q.kind === "reading"
          ? {
              kind: "choice",
              choices: () => q.choices,
              preview: (choice) => {
                const text = speechForChoice(q, choice);
                if (text) speak(text, LANG);
              },
              // 発音記号を見ると音を聞かずに答えられてしまうので、答え合わせまでは番号だけを出す
              label: (choice, index, answered) =>
                answered ? <span lang="fr">{choice}</span> : `発音 ${index + 1}`,
            }
          : { kind: "choice", choices: () => q.choices }
      }
      instruction={(q) => INSTRUCTIONS[q.kind]}
      renderPrompt={(q, answered) => <Prompt q={q} answered={answered} />}
      renderMistakePrompt={(q) => (
        <span lang={q.kind === "rule" ? "ja" : "fr"} className="font-semibold">
          {q.kind === "listening" ? q.speech : q.prompt}
        </span>
      )}
      onLeaveQuestion={stopSpeaking}
    />
  );
}
