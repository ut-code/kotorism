"use client";

import { useState } from "react";
import { auxiliaryVerbQuiz, type QuizQuestion } from "./quiz-data";

function pickRandomQuestion(list: QuizQuestion[]): QuizQuestion {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(() =>
    pickRandomQuestion(auxiliaryVerbQuiz),
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wrongList, setWrongList] = useState<QuizQuestion[]>([]);

  const isAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === currentQuestion.answerIndex;

  function handleSelect(index: number) {
    if (isAnswered) return;
    setSelectedIndex(index);

    const wasCorrect = index === currentQuestion.answerIndex;
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

  return (
    <div className="mt-8 w-full max-w-3xl">
      <div className="rounded-2xl border p-6">
        <p className="text-lg font-semibold">{currentQuestion.sentence}</p>

        <div className="mt-4 flex flex-col gap-2">
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              // 選んだ選択肢は色を変えて、どれを選んだか分かるようにする
              className={`rounded-xl border p-3 text-left transition-colors ${
                selectedIndex === index
                  ? "border-tealblue-500 bg-tealblue-50 text-tealblue-700 dark:border-tealblue-500 dark:bg-tealblue-900/30 dark:text-tealblue-300"
                  : "border-zinc-200 bg-white hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="mt-4">
            <p>{isCorrect ? "正解!" : "不正解..."}</p>
            <p className="text-sm text-zinc-600">{currentQuestion.explanation}</p>
            <button onClick={handleNext} className="mt-2 underline">
              次の問題へ
            </button>
          </div>
        )}
      </div>

      {wrongList.length > 0 && (
        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">間違えたものリスト</h2>
          <div className="mt-4 flex flex-col gap-4">
            {wrongList.map((q) => (
              <div key={q.id} className="border-t pt-4">
                <div className="flex items-start justify-between">
                  <p className="font-medium">{q.sentence}</p>
                  <button
                    onClick={() => handleRemoveFromWrongList(q.id)}
                    className="text-sm text-zinc-400 underline"
                  >
                    消す
                  </button>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{q.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
