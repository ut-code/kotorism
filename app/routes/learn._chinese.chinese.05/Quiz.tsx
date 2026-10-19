import { Quiz as PracticeQuiz, type QuizAnswerMode } from "@/components/practice/Quiz";
import {
  BLANK,
  isFillInCorrect,
  type AuxVerbQuestion,
  type ChoiceFocus,
} from "@/lib/shared/learn/aux-verb-quiz";

import { auxiliaryVerbQuiz } from "./quiz-data";

type Item = {
  id: string;
  // 答え合わせ・結果画面に出す正解（穴埋めはピンインも添える）
  answer: string;
  explanation: string;
  question: AuxVerbQuestion;
};

const items: Item[] = auxiliaryVerbQuiz.map((q) => ({
  id: q.id,
  answer: q.kind === "fill" ? `${q.answer}（${q.pinyin}）` : q.answer,
  explanation: q.explanation,
  question: q,
}));

const INSTRUCTIONS: Record<ChoiceFocus | "fill", string> = {
  meaning: "意味　この文の意味は？",
  form: "形　日本語に合う中国語は？",
  context: "文脈　会話の流れに合う表現は？",
  fill: "穴埋め　空欄に入る否定表現を入力しよう",
};

const fillMode: QuizAnswerMode<Item> = {
  kind: "typing",
  accentCycles: [],
  toolbarChars: [],
  hint: "漢字（日本語入力で「ふよう」→「不用」など）か、ピンイン（声調記号は省略可）で入力できます。",
  placeholder: "例: 不用 / buyong",
  isCorrect: (given, item) =>
    item.question.kind === "fill" && isFillInCorrect(given, item.question),
};

// 空欄入りの中国語文。空欄は下線で示し、答え合わせ後は正解を埋めて見せる
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

function Prompt({ q, answered }: { q: AuxVerbQuestion; answered: boolean }) {
  if (q.kind === "fill") {
    return (
      <div className="space-y-3">
        <p lang="zh-CN" className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          <BlankSentence text={q.sentence} filled={answered ? q.answer : undefined} />
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.translation}</p>
      </div>
    );
  }
  if (q.focus === "form") {
    return <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{q.prompt}</p>;
  }
  return (
    <div className="space-y-3">
      <div lang="zh-CN" className="space-y-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
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

// 助動詞の否定表現クイズ。「意味」「形」「文脈」の3観点の4択と、穴埋め（入力）を混ぜて出題する。
// 出題順は「練習を始める」を押したときに決めるので、サーバーとブラウザで表示が食い違わない
export default function Quiz() {
  return (
    <PracticeQuiz
      pool={items}
      countOptions={["10", "all"]}
      defaultCount="10"
      lang="ja"
      mode={(item) =>
        item.question.kind === "fill"
          ? fillMode
          : {
              kind: "choice",
              choices: (i) => (i.question.kind === "choice" ? i.question.choices : []),
            }
      }
      instruction={(item) =>
        INSTRUCTIONS[item.question.kind === "fill" ? "fill" : item.question.focus]
      }
      renderPrompt={(item, answered) => <Prompt q={item.question} answered={answered} />}
      renderMistakePrompt={(item) => {
        const q = item.question;
        return (
          <span
            lang={q.kind === "choice" && q.focus === "form" ? "ja" : "zh-CN"}
            className="font-semibold"
          >
            {(q.kind === "fill" ? q.sentence : q.prompt).replace("\n", " ")}
          </span>
        );
      }}
    />
  );
}
