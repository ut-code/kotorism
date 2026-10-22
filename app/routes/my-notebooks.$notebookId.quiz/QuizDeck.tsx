import { useState } from "react";
import { useFetcher } from "react-router";

import { AUDIO_OPTIONS, SpeakButton } from "@/components/practice/PracticeControls";
import { useStarColors } from "@/hooks/useStarColors";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import type { NotebookLanguage } from "@/lib/shared/notebook-language";
import {
  quizHint,
  quizSupport,
  quizTargetCards,
  toggleQuizStar,
  type QuizStar,
  type QuizTarget,
} from "@/lib/shared/notebook-quiz";
import { speak } from "@/lib/shared/speech";
import { starColorFor } from "@/lib/shared/star-colors";

type QuizCard = {
  id: string;
  head: string;
  // 見出し語1件につく「組」の並び。同じ添字の値同士が列をまたいで対応する
  rows: Record<string, string>[];
  // 自分がこの単語に★をつけているか・★をつけた累計回数
  starred: boolean;
  starCount: number;
};

type Question = {
  // 出題元の単語（Card.id）。回答を学習カレンダーに記録するのに使う
  cardId: string;
  // 出題する見出し語
  head: string;
  // 正解（選んだ列の値）
  answer: string;
  // 正解と同じ組の、ヒントの列の値（中国語のテンプレートで拼音を答えるときの意味）。無ければ空文字
  hint: string;
  // 正解と同じ組の、見出し語の上に出す列の値（中国語のテンプレートで意味を答えるときの拼音）。無ければ空文字
  ruby: string;
  // 正解を含む選択肢（表示順にシャッフル済み）
  choices: string[];
};

const CHOICE_COUNT = 4;
const ROUND_SIZES = [5, 10, 20, 0]; // 0は「全問」

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// targets の見出し語1件につき、選んだ列に値のある組を1問ずつ出題の元にする（同じ見出し語・同じ正解は1問にまとめる）。
// 誤答の選択肢は、出題しない単語も含めた単語帳全体（cards）から選ぶ
function buildQuestions(
  cards: QuizCard[],
  targets: QuizCard[],
  column: string,
  roundSize: number,
  hintColumn: string | null,
  rubyColumn: string | null,
): Question[] {
  const pairs: Omit<Question, "choices">[] = [];
  for (const card of targets) {
    const answers = new Set(card.rows.map((row) => row[column]).filter(Boolean));
    for (const answer of answers) {
      const hint = hintColumn ? quizHint(card.rows, column, answer, hintColumn) : "";
      const ruby = rubyColumn ? quizHint(card.rows, column, answer, rubyColumn) : "";
      pairs.push({ cardId: card.id, head: card.head, answer, hint, ruby });
    }
  }
  const allAnswers = [
    ...new Set(cards.flatMap((card) => card.rows.map((row) => row[column])).filter(Boolean)),
  ];

  const picked = shuffle(pairs).slice(0, roundSize > 0 ? roundSize : pairs.length);
  return picked.map((pair) => {
    // 誤答の選択肢は、正解とは別の値の中からランダムに選ぶ
    const wrong = shuffle(allAnswers.filter((value) => value !== pair.answer)).slice(
      0,
      CHOICE_COUNT - 1,
    );
    return { ...pair, choices: shuffle([pair.answer, ...wrong]) };
  });
}

export default function QuizDeck({
  notebookId,
  language,
  columns,
  cards,
}: {
  notebookId: string;
  language: NotebookLanguage | null;
  columns: string[];
  cards: QuizCard[];
}) {
  // 回答の記録（学習カレンダー用）。結果を画面に反映する必要は無いので、送りっぱなしにする
  const answerFetcher = useFetcher();
  const headColumn = columns[0] ?? "";
  const bodyColumns = columns.slice(1);

  // 選択肢を作るには、その列に異なる値が2種類以上必要。出題できる列だけを選択肢にする
  const quizColumns = bodyColumns.filter((column) => {
    const values = new Set(
      cards.flatMap((card) => card.rows.map((row) => row[column])).filter(Boolean),
    );
    return values.size >= 2;
  });

  const [phase, setPhase] = useState<"settings" | "quiz" | "result">("settings");
  const [column, setColumn] = useState(quizColumns[0] ?? "");
  const [roundSize, setRoundSize] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [audio, setAudio] = useState<"on" | "off">("on");
  const [target, setTarget] = useState<QuizTarget>("all");
  // ★はクイズ中に付け外ししても、サーバーの往復を待たずに切り替える。
  // ページを開いている間はここが正で、付け外しはそのつど toggleStar で保存する
  const starFetcher = useFetcher();
  const [stars, setStars] = useState<Record<string, QuizStar>>(() =>
    Object.fromEntries(
      cards.map((card) => [card.id, { starred: card.starred, starCount: card.starCount }]),
    ),
  );
  const { colors: starColors } = useStarColors();
  const starredCount = quizTargetCards(cards, "starred", stars).length;
  // ★つきの単語が無くなったら、★つきのみは選べないので「すべて」に戻す
  const effectiveTarget: QuizTarget = starredCount > 0 ? target : "all";
  // テンプレートの列のまま意味・拼音を答えるときだけ、見出し語を読み上げる
  // （意味では単語を出したとき、拼音では答え合わせで。中国語では、意味なら拼音を、拼音なら意味を出す）
  const support = quizSupport(columns, column, language);
  // 読み上げは、補助の付く列を答えていて、設定で「読み上げる」を選んだときだけ
  const speech = audio === "on" ? support : null;

  const speakHead = (head: string) => {
    if (!speech) return;
    const started = speak(head, speech.speechLang, {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(started);
  };

  // 意味を答えるときは、単語を出したとき（選択肢を選ぶ前）に読み上げる
  const showQuestion = (question: Question | undefined) => {
    if (question && speech?.speakOn === "question") speakHead(question.head);
  };

  // 問題に答えている間（設定画面・結果画面以外）の学習時間を記録する
  useStudyTimer(phase === "quiz" ? { kind: "deck", deckId: notebookId, mode: "quiz" } : null);

  const start = (list: Question[]) => {
    setQuestions(list);
    setIndex(0);
    setSelected(null);
    setMistakes([]);
    setCorrectCount(0);
    setPhase("quiz");
    showQuestion(list[0]);
  };

  if (quizColumns.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        クイズには、見出し語以外の列に異なる値が入った単語が2つ以上必要です。単語を追加してから挑戦してください。
      </p>
    );
  }

  if (phase === "settings") {
    return (
      <div className="flex flex-col items-center gap-8">
        <section className="w-full">
          <div className="mb-2 text-sm font-bold text-zinc-800 dark:text-zinc-100">答える列</div>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            「{headColumn}」を見て、選んだ列の内容を4択で答えます。
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {quizColumns.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setColumn(name)}
                aria-pressed={column === name}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  column === name
                    ? "bg-coral-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <section className="w-full">
          <div className="mb-3 text-sm font-bold text-zinc-800 dark:text-zinc-100">
            出題する単語
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {(["all", "starred"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTarget(value)}
                disabled={value === "starred" && starredCount === 0}
                aria-pressed={effectiveTarget === value}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  effectiveTarget === value
                    ? "bg-coral-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {value === "all" ? "すべて" : `★つきのみ（${starredCount}語）`}
              </button>
            ))}
          </div>
        </section>

        <section className="w-full">
          <div className="mb-3 text-sm font-bold text-zinc-800 dark:text-zinc-100">問題数</div>
          <div className="flex flex-wrap justify-center gap-2">
            {ROUND_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setRoundSize(size)}
                aria-pressed={roundSize === size}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  roundSize === size
                    ? "bg-coral-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {size === 0 ? "全問" : `${size}問`}
              </button>
            ))}
          </div>
        </section>

        {/* 読み上げが起こりうる（テンプレートの単語帳で意味・拼音を答える）ときだけ選べる */}
        {support && (
          <section className="w-full">
            <div className="mb-3 text-sm font-bold text-zinc-800 dark:text-zinc-100">
              {support.speakOn === "question" ? "出題時の読み上げ" : "答え合わせの読み上げ"}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {AUDIO_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAudio(option.value)}
                  aria-pressed={audio === option.value}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                    audio === option.value
                      ? "bg-coral-500 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={() =>
            start(
              buildQuestions(
                cards,
                quizTargetCards(cards, effectiveTarget, stars),
                column,
                roundSize,
                support?.hintColumn ?? null,
                support?.rubyColumn ?? null,
              ),
            )
          }
          className="rounded-full bg-coral-500 px-10 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-coral-600"
        >
          クイズを始める
        </button>
      </div>
    );
  }

  if (phase === "result") {
    const percent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">結果</div>
        <div className="mt-2 text-5xl font-bold text-zinc-800 dark:text-zinc-100">
          {correctCount} / {questions.length}
        </div>
        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">正答率 {percent}%</div>

        {mistakes.length > 0 ? (
          <div className="mt-6 text-left">
            <div className="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
              間違えた単語
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {mistakes.map((m) => (
                <li key={`${m.head}:${m.answer}`} className="flex items-baseline gap-3 py-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{m.head}</span>
                  <span className="text-zinc-600 dark:text-zinc-300">{m.answer}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 font-bold text-green-600 dark:text-green-400">全問正解です！</div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {mistakes.length > 0 && (
            <button
              type="button"
              onClick={() => start(shuffle(mistakes))}
              className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-coral-600"
            >
              間違えた単語だけもう一度
            </button>
          )}
          <button
            type="button"
            onClick={() => setPhase("settings")}
            className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            設定に戻る
          </button>
        </div>
      </div>
    );
  }

  const question = questions[index];
  if (!question) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">出題できる単語がありません。</p>;
  }
  const answered = selected !== null;
  const isLast = index + 1 >= questions.length;

  const choose = (choice: string) => {
    if (answered) return;
    setSelected(choice);
    if (speech?.speakOn === "answer") speakHead(question.head);
    answerFetcher.submit(
      { intent: "recordQuizAnswer", cardId: question.cardId },
      { method: "post", action: `/my-notebooks/${notebookId}` },
    );
    if (choice === question.answer) setCorrectCount((count) => count + 1);
    else setMistakes((prev) => [...prev, question]);
  };

  const star = stars[question.cardId] ?? { starred: false, starCount: 0 };
  const starColor = starColorFor(star.starCount, starColors);
  const toggleStar = () => {
    setStars((prev) => ({ ...prev, [question.cardId]: toggleQuizStar(star) }));
    starFetcher.submit(
      { intent: "toggleStar", cardId: question.cardId },
      { method: "post", action: `/my-notebooks/${notebookId}` },
    );
  };

  const next = () => {
    if (isLast) {
      setPhase("result");
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      showQuestion(questions[index + 1]);
    }
  };

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          {index + 1} / {questions.length}問目
        </span>
        <span>正解: {correctCount}</span>
      </div>

      <div className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
        {headColumn} → {column}
      </div>
      {question.ruby && (
        <div data-quiz-ruby className="mt-1 text-base text-zinc-500 dark:text-zinc-400">
          {question.ruby}
        </div>
      )}
      <div data-quiz-head className="mt-1 text-3xl font-bold text-zinc-800 dark:text-zinc-100">
        {question.head}
      </div>
      {speech?.speakOn === "question" && (
        <div className="mt-3">
          <SpeakButton speaking={speaking} onClick={() => speakHead(question.head)} />
        </div>
      )}
      {support?.hintColumn && question.hint && (
        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {support.hintColumn}：{question.hint}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {question.choices.map((choice) => {
          const isAnswer = choice === question.answer;
          const isSelected = choice === selected;
          const stateClass = !answered
            ? "border-zinc-200 hover:border-coral-300 hover:bg-coral-50 dark:border-zinc-700 dark:hover:border-coral-700 dark:hover:bg-coral-950/20"
            : isAnswer
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : isSelected
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-zinc-200 opacity-60 dark:border-zinc-700";
          return (
            <button
              key={choice}
              type="button"
              onClick={() => choose(choice)}
              disabled={answered}
              className={`rounded-xl border-2 px-4 py-3 text-left text-base text-zinc-800 transition-colors dark:text-zinc-100 ${stateClass}`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 flex flex-col items-center gap-3">
          {selected === question.answer ? (
            <div className="font-bold text-green-600 dark:text-green-400">正解！</div>
          ) : (
            <div className="font-bold text-red-600 dark:text-red-400">
              不正解 — 正解は「{question.answer}」
            </div>
          )}
          {speech?.speakOn === "answer" && (
            <SpeakButton speaking={speaking} onClick={() => speakHead(question.head)} />
          )}
          <div className="flex items-center gap-3">
            {/* 覚えにくい単語に★をつけておき、あとで★つきの単語だけを出題できるようにする。
                色は暗記学習モードの★と同じく、★をつけた回数で変える */}
            <button
              type="button"
              onClick={toggleStar}
              aria-label={star.starred ? "★を外す" : "★をつける"}
              aria-pressed={star.starred}
              style={starColor ? { color: starColor } : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-2xl transition-colors dark:border-zinc-700 ${
                starColor
                  ? "hover:opacity-75"
                  : "text-zinc-300 hover:text-zinc-400 dark:text-zinc-600 dark:hover:text-zinc-500"
              }`}
            >
              {star.starred ? "★" : "☆"}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-coral-500 px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-coral-600"
            >
              {isLast ? "結果を見る" : "次の問題へ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
