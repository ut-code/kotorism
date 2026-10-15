"use client";

import { useState } from "react";

import { useIsClient } from "@/components/UseIsClient";
import { auxiliaryVerbQuiz, type QuizQuestion } from "./quiz-data";

function pickRandomQuestion(list: QuizQuestion[]): QuizQuestion {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

// 最初の問題はランダムに選ぶため、サーバーとブラウザで違う問題にならないよう、表示が確定してから出題する
export default function Quiz() {
  const isClient = useIsClient();
  if (!isClient) {
    return (
      <div className="mx-auto mt-8 flex min-h-96 w-full max-w-xl items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
        読み込み中…
      </div>
    );
  }
  return <QuizBody />;
}

function QuizBody() {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(() =>
    pickRandomQuestion(auxiliaryVerbQuiz),
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wrongList, setWrongList] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const isAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === currentQuestion.answerIndex;

  function handleSelect(index: number) {
    if (isAnswered) return;
    setSelectedIndex(index);

    const wasCorrect = index === currentQuestion.answerIndex;
    setScore((prev) => ({ correct: prev.correct + (wasCorrect ? 1 : 0), total: prev.total + 1 }));
    if (!wasCorrect) {
      setWrongList((prev) => {
        const alreadyIn = prev.some((q) => q.id === currentQuestion.id);
        if (alreadyIn) return prev;
        return [...prev, currentQuestion];
      });
    }
  }

  function handleNext() {
    setCurrentQuestion(pickRandomQuestion(auxiliaryVerbQuiz));
    setSelectedIndex(null);
  }

  function handleRemoveFromWrongList(id: string) {
    setWrongList((prev) => prev.filter((q) => q.id !== id));
  }

  // 回答後は、正解の選択肢を緑、間違って選んだ選択肢を赤にし、それ以外は薄くする
  function choiceClassName(index: number): string {
    if (!isAnswered) {
      return "border-zinc-200 hover:border-tealblue-300 hover:bg-tealblue-50 dark:border-zinc-700 dark:hover:border-tealblue-600 dark:hover:bg-tealblue-900/20";
    }
    if (index === currentQuestion.answerIndex) {
      return "border-green-500 bg-green-50 dark:bg-green-900/20";
    }
    if (index === selectedIndex) {
      return "border-red-500 bg-red-50 dark:bg-red-900/20";
    }
    return "border-zinc-200 opacity-60 dark:border-zinc-700";
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-xl space-y-6">
      <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
        正解: {score.correct} / {score.total}
      </div>

      <div>
        <div className="mb-2 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
          この文の意味は？
        </div>
        <p className="mb-6 text-center text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          {currentQuestion.sentence}
        </p>

        <div className="flex flex-col gap-2">
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
              className={`rounded-xl border-2 px-4 py-3 text-left text-base text-zinc-800 transition-colors dark:text-zinc-100 ${choiceClassName(index)}`}
            >
              {choice}
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="mt-5 flex flex-col items-center gap-2 text-center">
            {isCorrect ? (
              <div className="font-bold text-green-600 dark:text-green-400">正解！</div>
            ) : (
              <div className="font-bold text-red-600 dark:text-red-400">不正解</div>
            )}
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleNext}
            disabled={!isAnswered}
            className="rounded-full bg-tealblue-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            次の問題へ
          </button>
        </div>
      </div>

      {wrongList.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
            間違えたものリスト
          </h2>
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {wrongList.map((q) => (
              <li key={q.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">{q.sentence}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromWrongList(q.id)}
                    className="shrink-0 text-sm text-tealblue-600 hover:underline dark:text-tealblue-400"
                  >
                    消す
                  </button>
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {q.explanation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
