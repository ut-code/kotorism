"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  ChoiceChips,
  EmptyPractice,
  PracticeButton,
  SettingRow,
  type ChoiceOption,
} from "@/components/practice/PracticeControls";
import {
  AnswerFeedback,
  QuizProgress,
  QuizResult,
  type QuizOutcome,
} from "@/components/practice/QuizParts";
import { AccentKeyHint } from "@/components/practice/SpecialCharPalette";
import { AccentInput } from "@/components/verbs/AccentInput";
import type { PracticeLanguage } from "@/lib/practice-languages";

// 1問ずつ表示して答えを入力する演習（穴埋め・数字タイピング）の共通部品。
// 「設定 → 練習を始める → 出題中 → 結果」の流れと、制限時間・パス・間違えた問題の再挑戦を受け持つ

export type TypingQuestion = {
  id: string;
  answer: string;
  explanation?: string;
};

// 出題範囲の選択肢。先頭が既定（全範囲）
export type QuizScope<Q> = { value: string; label: string; match: (item: Q) => boolean };

type CountOption = "5" | "10" | "20" | "all";
type TimerOption = "off" | "15" | "30" | "45";

const COUNT_OPTIONS: ChoiceOption<CountOption>[] = [
  { value: "5", label: "5問" },
  { value: "10", label: "10問" },
  { value: "20", label: "20問" },
  { value: "all", label: "全問" },
];

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

const normalize = (s: string) => s.trim().toLowerCase();

export function TypingQuiz<Q extends TypingQuestion>({
  language,
  items,
  scopes,
  instruction,
  renderPrompt,
  renderMistakePrompt,
  placeholder,
}: {
  language: PracticeLanguage;
  items: Q[];
  scopes: QuizScope<Q>[];
  // 問題の上に出す小さな指示文
  instruction: string;
  // 出題中の大きな問題
  renderPrompt: (item: Q) => ReactNode;
  // 結果画面の「間違えた問題」に出す短い問題の表記
  renderMistakePrompt: (item: Q) => ReactNode;
  placeholder: string;
}) {
  const [phase, setPhase] = useState<"settings" | "playing" | "result">("settings");
  const [scope, setScope] = useState(scopes[0]?.value ?? "");
  const [count, setCount] = useState<CountOption>("10");
  const [timer, setTimer] = useState<TimerOption>("15");

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

  const timeLimit = timer === "off" ? null : Number(timer);
  const pool = items.filter(scopes.find((s) => s.value === scope)?.match ?? (() => true));
  const question = questions[index];
  // 今の問題の答え合わせの結果（未回答なら undefined）
  const current = records[index];
  const correctCount = records.filter((r) => r.outcome === "correct").length;

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
    setQuestions(list);
    setIndex(0);
    changeAnswer("");
    setRecords([]);
    setTimeLeft(timeLimit);
    setPhase("playing");
    scrollToTop();
  };

  const startNew = () => {
    const shuffled = shuffle(pool);
    start(count === "all" ? shuffled : shuffled.slice(0, Number(count)));
  };

  const retryMistakes = () => {
    start(shuffle(records.filter((r) => r.outcome !== "correct").map((r) => r.item)));
  };

  const backToSettings = () => {
    setPhase("settings");
    scrollToTop();
  };

  const record = (outcome: QuizOutcome, given: string | null) => {
    if (!question) return;
    setRecords((prev) =>
      prev.length > index ? prev : [...prev, { item: question, given, outcome }],
    );
  };

  const goNext = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      changeAnswer("");
      setTimeLeft(timeLimit);
    } else {
      setPhase("result");
      scrollToTop();
    }
  };

  const submit = () => {
    if (current) {
      goNext();
      return;
    }
    if (!question || !answer.trim()) return;
    record(normalize(answer) === normalize(question.answer) ? "correct" : "wrong", answer.trim());
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

  // 答え合わせ中は、入力欄からフォーカスが外れていても Enter で次へ進めるようにする
  // （入力欄・ボタン上の Enter はそれぞれの操作に任せる）
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.isComposing) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (items.length === 0) {
    return <EmptyPractice>出題データが見つかりませんでした。</EmptyPractice>;
  }

  return (
    <div ref={rootRef} className="scroll-mt-24">
      {phase === "settings" && (
        <div>
          <div className="space-y-5">
            <SettingRow label="出題範囲">
              <ChoiceChips
                label="出題範囲"
                options={scopes.map(({ value, label }) => ({ value, label }))}
                value={scope}
                onChange={setScope}
              />
            </SettingRow>
            <SettingRow label="問題数">
              <ChoiceChips
                label="問題数"
                options={COUNT_OPTIONS}
                value={count}
                onChange={setCount}
              />
            </SettingRow>
            <SettingRow label="制限時間">
              <ChoiceChips
                label="1問あたりの制限時間"
                options={TIMER_OPTIONS}
                value={timer}
                onChange={setTimer}
              />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">1問あたりの時間です。</p>
            </SettingRow>
          </div>
          <div className="mt-10 flex flex-col items-center gap-3">
            <PracticeButton onClick={startNew} disabled={pool.length === 0}>
              練習を始める
            </PracticeButton>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {pool.length === 0
                ? "この範囲には問題がありません。"
                : `${pool.length} 問から ${count === "all" ? pool.length : Math.min(Number(count), pool.length)} 問を出題します`}
            </p>
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
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{instruction}</p>
            <div className="mt-4">{renderPrompt(question)}</div>
          </div>

          <div className="mt-8">
            <AccentInput
              // 問題ごとに作り直し、新しい問題で入力欄に自動でフォーカスする
              key={`${question.id}-${index}`}
              value={answer}
              onChange={changeAnswer}
              onSubmit={submit}
              disabled={!!current}
              autoFocus
              lang={language.lang}
              placeholder={placeholder}
              accentCycles={language.accentCycles}
              toolbarChars={language.specialChars}
              hintText={<AccentKeyHint language={language} />}
              className="w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-center text-2xl font-semibold text-zinc-900 outline-none transition-colors read-only:bg-zinc-100 focus:border-tealblue-500 focus:ring-4 focus:ring-tealblue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:read-only:bg-zinc-800 dark:focus:border-tealblue-400"
            />
          </div>

          {current && (
            <div className="mt-6">
              <AnswerFeedback
                outcome={current.outcome}
                answer={question.answer}
                lang={language.lang}
                explanation={question.explanation}
              />
            </div>
          )}

          <div className="mt-8 flex justify-center gap-3">
            {current ? (
              <PracticeButton onClick={goNext}>
                {index + 1 < questions.length ? "次の問題へ" : "結果を見る"}
              </PracticeButton>
            ) : (
              <>
                <PracticeButton onClick={submit} disabled={!answer.trim()}>
                  答え合わせ
                </PracticeButton>
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
          lang={language.lang}
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
