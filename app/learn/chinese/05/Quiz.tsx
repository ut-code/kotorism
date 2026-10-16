"use client";

import { Quiz as PracticeQuiz } from "@/components/practice/Quiz";
import { auxiliaryVerbQuiz, type QuizQuestion } from "./quiz-data";

type Question = QuizQuestion & { answer: string };

const questions: Question[] = auxiliaryVerbQuiz.map((q) => ({
  ...q,
  answer: q.choices[q.answerIndex],
}));

// 助動詞の否定表現クイズ。中国語の文を見て、意味に合う日本語訳を選ぶ。
// 出題順は「練習を始める」を押したときに決めるので、サーバーとブラウザで表示が食い違わない
export default function Quiz() {
  return (
    <PracticeQuiz
      pool={questions}
      countOptions={["all"]}
      lang="ja"
      mode={{ kind: "choice", choices: (q) => q.choices }}
      instruction="この文の意味は？"
      renderPrompt={(q) => (
        <p lang="zh-CN" className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {q.sentence}
        </p>
      )}
      renderMistakePrompt={(q) => (
        <span lang="zh-CN" className="font-semibold">
          {q.sentence}
        </span>
      )}
    />
  );
}
