import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  CollapsibleChoice,
  EmptyPractice,
  PracticeButton,
  type ChoiceOption,
} from "@/components/practice/PracticeControls";
import {
  AnswerFeedback,
  QuizProgress,
  QuizResult,
  type QuizOutcome,
} from "@/components/practice/QuizParts";
import { AccentInput } from "@/components/verbs/AccentInput";

// 1問ずつ出題する演習（穴埋め・数字・時間表現・動詞の活用・ピンイン・選択クイズ）の共通部品。
// 「設定 → 練習を始める → 出題中 → 結果」の流れと、問題数・制限時間・パス・間違えた問題の再挑戦を受け持つ。
// 出題対象の選び方など演習ごとの設定は呼び出し側が settings に描き、選ばれた問題を pool で渡す

export type QuizQuestion = {
  id: string;
  // 正解（選択式では正解の選択肢の文）
  answer: string;
  explanation?: string;
};

// 答え方。入力式は特殊文字の入力補助付きの入力欄、選択式は選択肢のボタン
export type QuizAnswerMode<Q> =
  | {
      kind: "typing";
      accentCycles: string[][];
      toolbarChars: string[];
      hint: ReactNode;
      placeholder: string;
      // 2文字の組み合わせを1文字に置き換える（AccentInput を参照）
      chordReplacements?: Record<string, string>;
      // 正誤の判定。省略時は前後の空白・大文字小文字・連続する空白を無視して比べる
      isCorrect?: (given: string, question: Q) => boolean;
    }
  | {
      kind: "choice";
      choices: (question: Q) => string[];
      // 指定すると、選択肢を押してもすぐには答え合わせせず、preview を呼んで（選択肢の読み上げなど）選択状態にする。
      // 「答え合わせ」で選んだ選択肢を確定する。答え合わせのあとも、押すたびに preview を呼ぶ
      preview?: (choice: string, question: Q) => void;
      // 選択肢の表示。省略時は選択肢の文をそのまま出す（答え合わせまで中身を伏せる、など）
      label?: (choice: string, index: number, answered: boolean) => ReactNode;
    };

// 問題ごとに変えられる設定（固定の値か、問題から決める関数）
type PerQuestion<Q, T> = T | ((question: Q) => T);

export type CountOption = "5" | "10" | "20" | "all";
export type TimerOption = "off" | "15" | "30" | "45";

const COUNT_LABELS: Record<CountOption, string> = {
  "5": "5問",
  "10": "10問",
  "20": "20問",
  all: "全問",
};

const TIMER_OPTIONS: ChoiceOption<TimerOption>[] = [
  { value: "off", label: "なし" },
  { value: "15", label: "15秒" },
  { value: "30", label: "30秒" },
  { value: "45", label: "45秒" },
];

// 残りがこの秒数以下になったら残り時間を強調する
const URGENT_SECONDS = 5;

type AnswerRecord<Q> = { item: Q; given: string | null; outcome: QuizOutcome };

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function Quiz<Q extends QuizQuestion>({
  pool,
  settings,
  emptyMessage = "この範囲には問題がありません。",
  countOptions = ["5", "10", "20", "all"],
  defaultCount = "10",
  timer = false,
  defaultTimer = "15",
  lang,
  mode: modeOption,
  instruction,
  renderPrompt,
  renderMistakePrompt,
  renderFeedbackExtra,
  onAnswered,
  onLeaveQuestion,
}: {
  // 今の設定で出題できる問題
  pool: Q[];
  // 演習ごとの設定（出題範囲・出題対象など）。「練習を始める」の下、問題数・制限時間の上に表示する
  settings?: ReactNode;
  // 出題できる問題が無いときの案内
  emptyMessage?: string;
  // 問題数の選択肢。1つだけなら問題数の設定は出さない
  countOptions?: CountOption[];
  defaultCount?: CountOption;
  // 1問ごとの制限時間を選べるようにするか
  timer?: boolean;
  // 制限時間の初期値。選ぶまでは、これが変わると制限時間も変わる（答え方に合わせる、など）
  defaultTimer?: TimerOption;
  // 答えの言語（HTML の lang 属性）
  lang: string;
  // 答え方。関数にすると問題ごとに答え方を変えられる（選択式と入力式を混ぜる、など）
  mode: PerQuestion<Q, QuizAnswerMode<Q>>;
  // 問題の上に出す小さな指示文
  instruction: PerQuestion<Q, ReactNode>;
  // 出題中の大きな問題。answered は答え合わせ後かどうか（答え合わせ後にだけ意味を出す、など）
  renderPrompt: (question: Q, answered: boolean) => ReactNode;
  // 結果画面の「間違えた問題」に出す短い問題の表記
  renderMistakePrompt: (question: Q) => ReactNode;
  // 答え合わせの表示の下に足すもの（発音を聞くボタンなど）
  renderFeedbackExtra?: (question: Q) => ReactNode;
  // 答え合わせしたとき（パス・時間切れを含む）。音声の再生や学習記録に使う
  onAnswered?: (question: Q, correct: boolean) => void;
  // 今の問題から離れるとき（次の問題・設定に戻る）。音声を止めるのに使う
  onLeaveQuestion?: () => void;
}) {
  const [phase, setPhase] = useState<"settings" | "playing" | "result">("settings");
  const [count, setCount] = useState<CountOption>(
    countOptions.includes(defaultCount) ? defaultCount : countOptions[0],
  );
  const [chosenTimer, setChosenTimer] = useState<TimerOption | null>(null);
  const timerOption = timer ? (chosenTimer ?? defaultTimer) : "off";

  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [records, setRecords] = useState<AnswerRecord<Q>[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  // 時間切れのときに、その時点の入力を記録するため（入力のたびにカウントダウンをやり直さないよう ref で持つ）
  const answerRef = useRef("");
  const changeAnswer = (value: string) => {
    answerRef.current = value;
    setAnswer(value);
  };

  const timeLimit = timerOption === "off" ? null : Number(timerOption);
  const question = questions[index];
  // 今の問題の答え方（出題前は問題が無いので、関数のときは選択式として扱う）
  const mode: QuizAnswerMode<Q> =
    typeof modeOption === "function"
      ? question
        ? modeOption(question)
        : { kind: "choice", choices: () => [] }
      : modeOption;
  // 今の問題の答え合わせの結果（未回答なら undefined）
  const current = records[index];
  const correctCount = records.filter((r) => r.outcome === "correct").length;
  const roundSize = count === "all" ? pool.length : Math.min(Number(count), pool.length);

  // 画面が切り替わって高さが変わったときに、演習の先頭が画面外に出ていれば戻す
  const scrollToTop = () => {
    requestAnimationFrame(() => {
      const root = rootRef.current;
      if (root && root.getBoundingClientRect().top < 0) {
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const start = (list: Q[]) => {
    onLeaveQuestion?.();
    setQuestions(list);
    setIndex(0);
    changeAnswer("");
    setRecords([]);
    setTimeLeft(timeLimit);
    setPhase("playing");
    scrollToTop();
  };

  const startNew = () => start(shuffle(pool).slice(0, roundSize));

  const retryMistakes = () => {
    start(shuffle(records.filter((r) => r.outcome !== "correct").map((r) => r.item)));
  };

  const backToSettings = () => {
    onLeaveQuestion?.();
    setPhase("settings");
    scrollToTop();
  };

  const record = (outcome: QuizOutcome, given: string | null) => {
    if (!question || current) return;
    setRecords((prev) =>
      prev.length > index ? prev : [...prev, { item: question, given, outcome }],
    );
    onAnswered?.(question, outcome === "correct");
  };

  const goNext = () => {
    onLeaveQuestion?.();
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      changeAnswer("");
      setTimeLeft(timeLimit);
    } else {
      setPhase("result");
      scrollToTop();
    }
  };

  const judge = (given: string) => {
    if (!question) return false;
    if (mode.kind === "typing" && mode.isCorrect) return mode.isCorrect(given, question);
    return normalize(given) === normalize(question.answer);
  };

  const submitTyping = () => {
    if (current) {
      goNext();
      return;
    }
    if (!question || !answer.trim()) return;
    record(judge(answer) ? "correct" : "wrong", answer.trim());
  };

  const choose = (choice: string) => record(judge(choice) ? "correct" : "wrong", choice);

  // 選んでから確定する選択式（mode.preview あり）では、選択肢を押すと preview して選択状態にするだけ
  const preview = mode.kind === "choice" ? mode.preview : undefined;
  const pickChoice = (choice: string) => {
    if (!question) return;
    if (!preview) {
      choose(choice);
      return;
    }
    preview(choice, question);
    if (!current) changeAnswer(choice);
  };
  const submitChoice = () => {
    if (!current && answer) choose(answer);
  };

  // 制限時間のカウントダウン（答え合わせ中・結果画面では止める）
  useEffect(() => {
    if (phase !== "playing" || current || timeLeft === null) return;
    const id = setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        record("timeout", answerRef.current.trim() || null);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(id);
    // 1秒ごとに timeLeft が変わるたびに次の1秒を待つ。入力（answer）の変化ではやり直さない
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, timeLeft]);

  // キーボード操作: 答え合わせ後は入力欄の外でも Enter で次へ。選択式は 1〜9 キーで選択肢を選ぶ
  // （選んでから確定する選択式では、Enter で選んだ選択肢を確定する）
  // （入力欄・ボタン上の Enter はそれぞれの操作に任せる）
  useEffect(() => {
    if (phase !== "playing" || !question) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.target instanceof HTMLInputElement) return;
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) {
        if (current) {
          e.preventDefault();
          goNext();
        } else if (preview && answer) {
          e.preventDefault();
          submitChoice();
        }
      } else if (mode.kind === "choice" && (!current || preview) && /^[1-9]$/.test(e.key)) {
        const choice = mode.choices(question)[Number(e.key) - 1];
        if (choice !== undefined) pickChoice(choice);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div ref={rootRef} className="scroll-mt-24">
      {phase === "settings" && (
        <div className="space-y-10">
          <div className="flex flex-col items-center gap-3">
            <PracticeButton onClick={startNew} disabled={pool.length === 0}>
              練習を始める
            </PracticeButton>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {pool.length === 0
                ? emptyMessage
                : roundSize === pool.length
                  ? `${pool.length} 問を出題します`
                  : `${pool.length} 問から ${roundSize} 問を出題します`}
            </p>
          </div>
          <div className="space-y-6">
            {settings}
            {countOptions.length > 1 && (
              <CollapsibleChoice
                title="問題数"
                options={countOptions.map((value) => ({ value, label: COUNT_LABELS[value] }))}
                value={count}
                onChange={setCount}
              />
            )}
            {timer && (
              <CollapsibleChoice
                title="制限時間"
                options={TIMER_OPTIONS}
                value={timerOption}
                onChange={setChosenTimer}
                note="1問あたりの時間です。"
              />
            )}
          </div>
        </div>
      )}

      {phase === "playing" && question && (
        <div className="mx-auto max-w-xl">
          <QuizProgress
            current={index + 1}
            total={questions.length}
            correct={correctCount}
            timeLeft={timeLeft}
            urgentSeconds={URGENT_SECONDS}
            onBack={backToSettings}
          />

          <div className="mt-10 text-center">
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {typeof instruction === "function" ? instruction(question) : instruction}
            </p>
            <div className="mt-4">{renderPrompt(question, !!current)}</div>
          </div>

          <div className="mt-8">
            {mode.kind === "typing" ? (
              <AccentInput
                // 問題ごとに作り直し、新しい問題で入力欄に自動でフォーカスする
                key={`${question.id}-${index}`}
                value={answer}
                onChange={changeAnswer}
                onSubmit={submitTyping}
                disabled={!!current}
                autoFocus
                lang={lang}
                placeholder={mode.placeholder}
                accentCycles={mode.accentCycles}
                toolbarChars={mode.toolbarChars}
                chordReplacements={mode.chordReplacements}
                hintText={mode.hint}
                className={`w-full rounded-xl border-2 px-4 py-3 text-center text-2xl font-semibold text-zinc-900 outline-none transition-colors dark:text-zinc-50 ${
                  !current
                    ? "border-zinc-300 bg-white focus:border-tealblue-500 focus:ring-4 focus:ring-tealblue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-tealblue-400"
                    : current.outcome === "correct"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                      : "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                }`}
              />
            ) : (
              <ChoiceList
                choices={mode.choices(question)}
                answer={question.answer}
                chosen={current ? current.given : undefined}
                selected={preview && !current ? answer : undefined}
                previewable={!!preview}
                label={mode.label}
                onChoose={pickChoice}
              />
            )}
          </div>

          {current && (
            <div className="mt-6 space-y-4">
              <AnswerFeedback
                outcome={current.outcome}
                answer={question.answer}
                // 選択式は正解の選択肢を色で示しているので、正解の文は繰り返さない
                showAnswer={mode.kind === "typing"}
                lang={lang}
                explanation={question.explanation}
              />
              {renderFeedbackExtra?.(question)}
            </div>
          )}

          <div className="mt-8 flex justify-center gap-3">
            {current ? (
              <PracticeButton onClick={goNext}>
                {index + 1 < questions.length ? "次の問題へ" : "結果を見る"}
              </PracticeButton>
            ) : (
              <>
                {mode.kind === "typing" && (
                  <PracticeButton onClick={submitTyping} disabled={!answer.trim()}>
                    答え合わせ
                  </PracticeButton>
                )}
                {preview && (
                  <PracticeButton onClick={submitChoice} disabled={!answer}>
                    答え合わせ
                  </PracticeButton>
                )}
                <PracticeButton variant="secondary" onClick={() => record("skipped", null)}>
                  パス
                </PracticeButton>
              </>
            )}
          </div>
        </div>
      )}

      {phase === "result" && (
        <QuizResult
          correct={correctCount}
          total={records.length}
          lang={lang}
          mistakes={records
            .filter((r) => r.outcome !== "correct")
            .map((r, i) => ({
              key: `${r.item.id}-${i}`,
              prompt: renderMistakePrompt(r.item),
              given: r.given,
              outcome: r.outcome,
              answer: r.item.answer,
            }))}
          onRetryMistakes={retryMistakes}
          onRetry={startNew}
          onBack={backToSettings}
        />
      )}
    </div>
  );
}

// 選択式の選択肢。答え合わせ後は正解を緑、選んだ不正解を赤にし、記号でも示す。
// previewable のときは、答え合わせの前に選んだ選択肢（selected）を示し、答え合わせ後も押せる（聞き比べ用）
function ChoiceList({
  choices,
  answer,
  chosen,
  selected,
  previewable = false,
  label,
  onChoose,
}: {
  choices: string[];
  answer: string;
  // 答え合わせ後に選んだ選択肢（パス・時間切れは null）。未回答なら undefined
  chosen: string | null | undefined;
  // 答え合わせ前に選んでいる選択肢（選んでから確定する選択式のみ）
  selected?: string;
  previewable?: boolean;
  label?: (choice: string, index: number, answered: boolean) => ReactNode;
  onChoose: (choice: string) => void;
}) {
  const answered = chosen !== undefined;
  return (
    <div className="flex flex-col gap-2">
      {choices.map((choice, i) => {
        const isAnswer = choice === answer;
        const isWrongPick = answered && choice === chosen && !isAnswer;
        return (
          <button
            key={choice}
            type="button"
            onClick={() => onChoose(choice)}
            disabled={answered && !previewable}
            aria-pressed={previewable && !answered ? choice === selected : undefined}
            className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-base text-zinc-800 transition-colors dark:text-zinc-100 ${
              !answered && choice === selected
                ? "border-tealblue-500 bg-tealblue-50 dark:border-tealblue-400 dark:bg-tealblue-950/40"
                : !answered
                  ? "border-zinc-200 hover:border-tealblue-300 hover:bg-tealblue-50 dark:border-zinc-700 dark:hover:border-tealblue-600 dark:hover:bg-tealblue-950/30"
                  : isAnswer
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                    : isWrongPick
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                      : "border-zinc-200 opacity-60 dark:border-zinc-700"
            }`}
          >
            <span className="w-5 shrink-0 font-bold text-zinc-400 dark:text-zinc-500">
              {answered && isAnswer ? (
                <span className="text-emerald-600 dark:text-emerald-400">○</span>
              ) : isWrongPick ? (
                <span className="text-rose-600 dark:text-rose-400">✕</span>
              ) : (
                i + 1
              )}
            </span>
            <span className="flex-1">{label ? label(choice, i, answered) : choice}</span>
            {previewable && <SpeakerIcon />}
          </button>
        );
      })}
    </div>
  );
}

// 押すと読み上げる選択肢に付けるスピーカーの印
function SpeakerIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
    >
      <path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor" />
      <path
        d="M13 7.5a3.5 3.5 0 0 1 0 5M15 5.5a6.5 6.5 0 0 1 0 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 出題データが無いときの表示（演習の部品から使う）
export function QuizEmpty() {
  return <EmptyPractice>出題データが見つかりませんでした。</EmptyPractice>;
}
