import { useState } from "react";

import { CollapsibleChoice } from "@/components/practice/PracticeControls";
import { apiPost } from "@/lib/shared/api-client";
import CompareCard, { Glyph } from "./CompareCard";
import { compareList, type CharacterCompare } from "./compare-data";

// 簡体字⇄日本語の漢字の選択クイズ（PC向け）

type Direction = "toJapanese" | "toSimplified";

type Question = {
  item: CharacterCompare;
  // 選択肢（正解を含む、表示順にシャッフル済み）
  choices: CharacterCompare[];
};

const CHOICE_COUNT = 4;
const ROUND_SIZES = [10, 20, 0]; // 0は「全問」

const DIRECTION_LABELS: Record<Direction, { title: string; prompt: string }> = {
  toJapanese: { title: "簡体字 → 日本語", prompt: "この簡体字にあたる日本語の漢字は？" },
  toSimplified: { title: "日本語 → 簡体字", prompt: "この漢字の簡体字は？" },
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildQuestions(items: CharacterCompare[], roundSize: number): Question[] {
  const picked = shuffle(items).slice(0, roundSize > 0 ? roundSize : items.length);
  return picked.map((item) => {
    // 誤答の選択肢は、出題中の字以外の全ペアからランダムに選ぶ
    const wrong = shuffle(compareList.filter((other) => other.id !== item.id)).slice(
      0,
      CHOICE_COUNT - 1,
    );
    return { item, choices: shuffle([item, ...wrong]) };
  });
}

// 回答をセクションの苦手管理に反映する（未ログインならサーバー側で何もしない）
function recordAnswer(correct: boolean) {
  apiPost("/api/learn", {
    intent: "quizAnswer",
    language: "chinese",
    sectionSlug: "06",
    correct,
  }).catch(() => {});
}

export default function HanziQuiz() {
  const [phase, setPhase] = useState<"settings" | "quiz" | "result">("settings");
  const [direction, setDirection] = useState<Direction>("toJapanese");
  const [roundSize, setRoundSize] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<CharacterCompare[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  function start(items: CharacterCompare[], size: number) {
    setQuestions(buildQuestions(items, size));
    setIndex(0);
    setSelectedId(null);
    setMistakes([]);
    setCorrectCount(0);
    setPhase("quiz");
  }

  if (phase === "settings") {
    return (
      <div className="space-y-8 rounded-2xl border border-tealblue-200 bg-white p-6 text-center dark:border-tealblue-900/40 dark:bg-zinc-950">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => start(compareList, roundSize)}
            className="rounded-full bg-tealblue-600 px-10 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700"
          >
            クイズを始める
          </button>
        </div>
        <div className="space-y-6">
          <CollapsibleChoice
            title="出題の向き"
            options={(Object.keys(DIRECTION_LABELS) as Direction[]).map((value) => ({
              value,
              label: DIRECTION_LABELS[value].title,
            }))}
            value={direction}
            onChange={setDirection}
          />
          <CollapsibleChoice
            title="問題数"
            options={ROUND_SIZES.map((size) => ({
              value: String(size),
              label: size === 0 ? `全問（${compareList.length}問）` : `${size}問`,
            }))}
            value={String(roundSize)}
            onChange={(value) => setRoundSize(Number(value))}
          />
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const percent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-tealblue-200 bg-white p-6 text-center dark:border-tealblue-900/40 dark:bg-zinc-950">
        <div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">結果</div>
          <div className="mt-1 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {correctCount} / {questions.length}
          </div>
          <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">正答率 {percent}%</div>
        </div>
        {mistakes.length > 0 && (
          <div className="w-full">
            <div className="mb-3 text-sm font-bold text-zinc-800 dark:text-zinc-100">
              間違えた字（{mistakes.length}字）
            </div>
            <ul className="flex flex-wrap justify-center gap-2">
              {mistakes.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <Glyph char={item.japanese} kind="japanese" className="text-2xl" />
                  <span className="text-zinc-400">→</span>
                  <Glyph
                    char={item.simplified}
                    kind="simplified"
                    className="text-2xl text-tealblue-700 dark:text-tealblue-300"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          {mistakes.length > 0 && (
            <button
              type="button"
              onClick={() => start(mistakes, 0)}
              className="rounded-full bg-tealblue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-tealblue-700"
            >
              間違えた字だけもう一度
            </button>
          )}
          <button
            type="button"
            onClick={() => setPhase("settings")}
            className="rounded-full border border-tealblue-300 px-6 py-2.5 text-sm font-bold text-tealblue-700 hover:bg-tealblue-50 dark:border-tealblue-800 dark:text-tealblue-300 dark:hover:bg-tealblue-950/40"
          >
            設定に戻る
          </button>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const answered = selectedId !== null;
  const isLast = index + 1 >= questions.length;
  const promptKind = direction === "toJapanese" ? "simplified" : "japanese";
  const choiceKind = direction === "toJapanese" ? "japanese" : "simplified";
  const charOf = (item: CharacterCompare) =>
    choiceKind === "japanese" ? item.japanese : item.simplified;

  function choose(choice: CharacterCompare) {
    if (answered) return;
    setSelectedId(choice.id);
    const correct = choice.id === question.item.id;
    if (correct) setCorrectCount((count) => count + 1);
    else setMistakes((prev) => [...prev, question.item]);
    recordAnswer(correct);
  }

  function next() {
    if (isLast) {
      setPhase("result");
    } else {
      setIndex((i) => i + 1);
      setSelectedId(null);
    }
  }

  // 回答後は、正解の選択肢を緑、間違って選んだ選択肢を赤にし、それ以外は薄くする
  function choiceClass(choice: CharacterCompare): string {
    if (!answered) {
      return "border-zinc-200 hover:-translate-y-0.5 hover:border-tealblue-300 hover:bg-tealblue-50 dark:border-zinc-700 dark:hover:border-tealblue-600 dark:hover:bg-tealblue-900/20";
    }
    if (choice.id === question.item.id) return "border-green-500 bg-green-50 dark:bg-green-900/20";
    if (choice.id === selectedId) return "border-red-500 bg-red-50 dark:bg-red-900/20";
    return "border-zinc-200 opacity-50 dark:border-zinc-700";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          {index + 1} / {questions.length} 問
        </span>
        <span>正解：{correctCount}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-tealblue-500 transition-all"
          style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border border-tealblue-200 bg-white p-6 text-center dark:border-tealblue-900/40 dark:bg-zinc-950">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {DIRECTION_LABELS[direction].prompt}
        </div>
        <div className="mt-4 mb-8 text-zinc-900 dark:text-zinc-50">
          <Glyph
            char={promptKind === "japanese" ? question.item.japanese : question.item.simplified}
            kind={promptKind}
            className="text-8xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {question.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice)}
              disabled={answered}
              className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-zinc-900 transition-all dark:text-zinc-50 ${choiceClass(choice)}`}
            >
              <Glyph char={charOf(choice)} kind={choiceKind} className="text-5xl" />
            </button>
          ))}
        </div>
      </div>

      {answered && (
        <div className="space-y-4">
          <p
            className={`text-center text-lg font-bold ${
              selectedId === question.item.id
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
            role="status"
          >
            {selectedId === question.item.id ? "正解！" : "残念…"}
          </p>
          <CompareCard item={question.item} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={next}
              autoFocus
              className="rounded-full bg-tealblue-600 px-10 py-3 font-bold text-white shadow-md transition-all hover:bg-tealblue-700"
            >
              {isLast ? "結果を見る" : "次の問題へ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
