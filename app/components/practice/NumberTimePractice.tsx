import { useMemo, useState } from "react";

import { loadNumberItems, loadTimeItems } from "@/components/practice/data";
import { CollapsibleChoice, type ChoiceOption } from "@/components/practice/PracticeControls";
import { Quiz, QuizEmpty } from "@/components/practice/Quiz";
import { languageTypingMode } from "@/components/practice/typing-mode";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import {
  buildNumberPracticeItems,
  matchesAnyAnswer,
  pickDistractors,
  type NumberPracticeItem,
} from "@/lib/shared/number-practice";
import { PRACTICE_LANGUAGES, type PracticeLanguageSlug } from "@/lib/shared/practice-languages";

type AnswerMode = "choice" | "typing";

const ANSWER_MODE_OPTIONS: ChoiceOption<AnswerMode>[] = [
  { value: "choice", label: "4択" },
  { value: "typing", label: "筆記" },
];

const inRange = (min: number, max: number) => (q: NumberPracticeItem) =>
  q.kind === "number" && q.value >= min && q.value <= max;

const SCOPES = [
  { value: "all", label: "すべて", match: () => true },
  { value: "0-19", label: "数字 0〜19", match: inRange(0, 19) },
  { value: "20-50", label: "数字 20〜50", match: inRange(20, 50) },
  { value: "50-100", label: "数字 50〜100", match: inRange(50, 100) },
  { value: "time", label: "時刻", match: (q: NumberPracticeItem) => q.kind === "time" },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 数字・時間表現の演習。数字（21）や時刻（7:30）を見て、その言語の言い方を4択で選ぶか入力する。
// 数字はその言語の全セクションの MDX にある「数字 | つづり」の表から、
// 時刻はこのセクションの MDX にある「時刻 | 言い方 | 補足」の表から集める
export default function NumberTimePractice({
  language,
  section,
}: {
  language: PracticeLanguageSlug;
  section: string;
}) {
  const lang = PRACTICE_LANGUAGES[language];
  const items = useMemo(
    () => buildNumberPracticeItems(loadNumberItems(language), loadTimeItems(language, section)),
    [language, section],
  );
  // 選択肢の並びは問題ごとに一度だけ決める（描き直すたびに並びが変わらないように）
  const choicesById = useMemo(
    () =>
      new Map(
        items.map((item) => [item.id, shuffle([item.answer, ...pickDistractors(item, items, 3)])]),
      ),
    [items],
  );
  const [scope, setScope] = useState("all");
  // 選ぶまでは、スマホ（指で操作する端末）では4択、PC では入力にする
  const coarsePointer = useCoarsePointer();
  const [chosenMode, setChosenMode] = useState<AnswerMode | null>(null);
  const answerMode = chosenMode ?? (coarsePointer ? "choice" : "typing");

  // 時刻は「halb acht / sieben Uhr dreißig」のように言い方が複数あり、どれでも正解にする
  const typingMode = languageTypingMode(lang, "言い方を入力…", matchesAnyAnswer);
  const pool = items.filter(SCOPES.find((s) => s.value === scope)?.match ?? (() => true));
  const what = (item: NumberPracticeItem) => (item.kind === "time" ? "時刻" : "数字");

  if (items.length === 0) return <QuizEmpty />;

  return (
    <Quiz
      pool={pool}
      settings={
        <>
          <CollapsibleChoice
            title="答え方"
            options={ANSWER_MODE_OPTIONS}
            value={answerMode}
            onChange={setChosenMode}
          />
          <CollapsibleChoice title="出題範囲" options={SCOPES} value={scope} onChange={setScope} />
        </>
      }
      timer
      // 入力は選ぶより時間がかかるので、筆記の初期値は長めにする
      defaultTimer={answerMode === "typing" ? "30" : "15"}
      lang={lang.lang}
      mode={
        answerMode === "choice"
          ? { kind: "choice", choices: (q) => choicesById.get(q.id) ?? [q.answer] }
          : typingMode
      }
      instruction={(item) =>
        answerMode === "choice"
          ? `この${what(item)}の言い方を選んでください`
          : `この${what(item)}を${lang.label}で入力してください`
      }
      renderPrompt={(item) => (
        <>
          <div className="text-6xl font-black tracking-tight text-zinc-900 tabular-nums md:text-7xl dark:text-zinc-50">
            {item.prompt}
          </div>
          {item.note && (
            <p className="mt-3 text-base text-zinc-600 md:text-lg dark:text-zinc-400">
              {item.note}
            </p>
          )}
        </>
      )}
      renderMistakePrompt={(item) => (
        <span className="font-bold tabular-nums">
          {item.prompt}
          {item.note && (
            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              {item.note}
            </span>
          )}
        </span>
      )}
    />
  );
}
