import { useCallback, useEffect, useRef, useState } from "react";

// 出題データアイテムの型定義
export type FrenchNumberItem = {
  num: string;
  french: string;
};

// アルファベット基本文字とアクセント付き特殊文字の対応マップ
const ACCENT_MAP: Record<string, string[]> = {
  a: ["a", "à", "â"],
  e: ["e", "é", "è", "ê", "ë"],
  i: ["i", "î", "ï"],
  o: ["o", "ô"],
  u: ["u", "ù", "û", "ü"],
  y: ["y", "ÿ"],
  c: ["c", "ç"],
  A: ["A", "À", "Â"],
  E: ["E", "É", "È", "Ê", "Ë"],
  I: ["I", "Î", "Ï"],
  O: ["O", "Ô"],
  U: ["U", "Ù", "Û", "Ü"],
  Y: ["Y", "Ÿ"],
  C: ["C", "Ç"],
};

// 逆引きルックアップ用（アクセント文字から基本文字グループのキーを引くためのオブジェクト）
const ACCENT_GROUP_KEY: Record<string, string> = {};
for (const [base, list] of Object.entries(ACCENT_MAP)) {
  for (const char of list) {
    ACCENT_GROUP_KEY[char] = base;
  }
}

/**
 * 上下キー操作により、指定された文字をアクセントバリエーション内で順次サイクル切り替えする関数。
 * @param char 対象の文字
 * @param direction "up" (ArrowUp) の場合は次のバリエーション、"down" (ArrowDown) の場合は前のバリエーションへ
 */
function cycleChar(char: string, direction: "up" | "down"): string {
  const groupKey = ACCENT_GROUP_KEY[char];
  if (!groupKey) return char;
  const list = ACCENT_MAP[groupKey];
  if (!list) return char;
  const currentIndex = list.indexOf(char);
  if (currentIndex === -1) return char;

  // Modulo演算を用いて配列内を巡回する
  const delta = direction === "up" ? 1 : -1;
  const nextIndex = (currentIndex + delta + list.length) % list.length;
  return list[nextIndex];
}

// 画面上にボタンとして配置するフランス語特殊文字のリスト
const SPECIAL_KEYS = ["à", "â", "é", "è", "ê", "ë", "î", "ï", "ô", "ù", "û", "ü", "ç", "œ"];

// 出題範囲のプリセット型定義
export type RangePreset = "all" | "0-19" | "20-50" | "50-100";

// 出題数の選択肢型定義
export type CountOption = "5" | "10" | "20" | "all";

// 制限時間の選択肢型定義（秒単位、"off"は無制限）
export type TimerOption = "off" | "15" | "30" | "45";

/**
 * 選択された出題範囲プリセットに基づき、全問題の中から対象数値をフィルタリングする関数
 */
function filterItemsByRange(items: FrenchNumberItem[], range: RangePreset): FrenchNumberItem[] {
  return items.filter((item) => {
    const val = parseInt(item.num, 10);
    if (isNaN(val)) return true;
    if (range === "0-19") return val >= 0 && val <= 19;
    if (range === "20-50") return val >= 20 && val <= 50;
    if (range === "50-100") return val >= 50 && val <= 100;
    return true;
  });
}

/**
 * Fisher-Yatesシャッフルアルゴリズムを用いて配列をランダムに並び替える関数
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function FrenchNumberPractice({ items }: { items: FrenchNumberItem[] }) {
  // ユーザーが選択した設定状態（出題範囲・問題数・制限時間）
  const [selectedRange, setSelectedRange] = useState<RangePreset>("all");
  const [selectedCount, setSelectedCount] = useState<CountOption>("10");
  const [selectedTimer, setSelectedTimer] = useState<TimerOption>("15");

  // タイマー用の残り時間（秒）
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // 選択条件（出題範囲・出題数）に基づきランダムシャッフルされた問題リストを構築するヘルパー
  const buildQuestions = useCallback(
    (itemsList: FrenchNumberItem[], range: RangePreset, count: CountOption) => {
      const filtered = filterItemsByRange(itemsList, range);
      const shuffled = shuffleArray(filtered);
      const countNum = count === "all" ? shuffled.length : parseInt(count, 10);
      return shuffled.slice(0, countNum);
    },
    [],
  );

  // 初回マウントフラグ
  const isMountedRef = useRef(false);

  // 初期状態は仮の配列（マウント後に決定）
  const [questions, setQuestions] = useState<FrenchNumberItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // 入力欄の参照
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 範囲選択や出題数・タイマー設定が変更された際、または再挑戦時に問題をリセットする処理
   */
  const resetQuiz = useCallback(
    (range: RangePreset, count: CountOption, timer: TimerOption = selectedTimer) => {
      const newQuestions = buildQuestions(items, range, count);
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setScore(0);
      setIsFinished(false);
      setIsAnswered(false);
      setUserAnswer("");
      setIsCorrect(null);
      setIsTimeOut(false);
      if (timer !== "off") {
        setTimeLeft(parseInt(timer, 10));
      } else {
        setTimeLeft(null);
      }
    },
    [items, buildQuestions, selectedTimer],
  );

  // クライアントサイドでのマウント時に初回問題を生成
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      resetQuiz("all", "10", "15");
    }
  }, [resetQuiz]);

  /**
   * 次の問題に進むか、全問題終了画面へ移行する処理
   */
  const goNext = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setIsAnswered(false);
      setIsCorrect(null);
      setIsTimeOut(false);
      if (selectedTimer !== "off") {
        setTimeLeft(parseInt(selectedTimer, 10));
      } else {
        setTimeLeft(null);
      }
    } else {
      setIsFinished(true);
      setTimeLeft(null);
    }
  }, [currentIndex, questions.length, selectedTimer]);

  // タイムアウト時の自動解答処理
  const handleTimeOut = useCallback(() => {
    if (isAnswered || isFinished) return;
    setIsTimeOut(true);
    setIsCorrect(false);
    setIsAnswered(true);
  }, [isAnswered, isFinished]);

  // 各問題の開始時、またはタイマー設定に応じたカウントダウン制御
  useEffect(() => {
    if (isFinished || isAnswered || selectedTimer === "off" || questions.length === 0) {
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerId);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [currentIndex, isAnswered, isFinished, selectedTimer, questions.length, handleTimeOut]);

  // 新しい問題が表示された際、入力欄へ自動フォーカスをあてる
  useEffect(() => {
    if (!isFinished && !isAnswered && questions.length > 0) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isFinished, isAnswered, questions.length]);

  const currentQuestion = questions[currentIndex];

  // 出題範囲変更ハンドラ
  const handleRangeChange = (range: RangePreset) => {
    setSelectedRange(range);
    resetQuiz(range, selectedCount, selectedTimer);
  };

  // 出題数変更ハンドラ
  const handleCountChange = (count: CountOption) => {
    setSelectedCount(count);
    resetQuiz(selectedRange, count, selectedTimer);
  };

  // タイマー設定変更ハンドラ
  const handleTimerChange = (timer: TimerOption) => {
    setSelectedTimer(timer);
    resetQuiz(selectedRange, selectedCount, timer);
  };

  /**
   * 解答の送信処理または結果確認状態からの次問題へ進む処理
   */
  const handleSubmit = useCallback(() => {
    if (isAnswered) {
      goNext();
      return;
    }

    if (!userAnswer.trim() || !currentQuestion) return;

    // 前後の空白を除去し、小文字に正規化して正誤判定
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedTarget = currentQuestion.french.trim().toLowerCase();
    const correct = normalizedUser === normalizedTarget;

    setIsCorrect(correct);
    setIsAnswered(true);
    if (correct) {
      setScore((s) => s + 1);
    }
  }, [isAnswered, goNext, userAnswer, currentQuestion]);

  // 結果表示状態でフォーカスが外れていてもEnterキーを押せば次へ進むキーボードリスナー
  useEffect(() => {
    if (!isAnswered || isFinished) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        // IME変換確定時などのEnterキーイベントを無視
        if (e.isComposing) return;
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isAnswered, isFinished, goNext]);

  // パス（スキップ）処理
  const handleSkip = () => {
    goNext();
  };

  /**
   * 入力欄でのキーボード入力ハンドラ。
   * ↑ / ↓ 矢印キーで文字のアクセント記号切り替えを行い、Enterキーで解答送信する。
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const input = inputRef.current;
      if (!input || !userAnswer) return;

      const selStart = input.selectionStart ?? userAnswer.length;

      // カーソル位置の直前から前方へ向け、変換可能な文字を検索
      let targetIdx = -1;
      for (let i = Math.min(selStart - 1, userAnswer.length - 1); i >= 0; i--) {
        if (ACCENT_GROUP_KEY[userAnswer[i]]) {
          targetIdx = i;
          break;
        }
      }

      // 前方で見つからなかった場合、カーソル位置より後ろを検索
      if (targetIdx === -1) {
        for (let i = selStart; i < userAnswer.length; i++) {
          if (ACCENT_GROUP_KEY[userAnswer[i]]) {
            targetIdx = i;
            break;
          }
        }
      }

      // 変換対象文字が存在する場合、アクセント記号を切り替えて更新
      if (targetIdx !== -1) {
        const charToCycle = userAnswer[targetIdx];
        const newChar = cycleChar(charToCycle, e.key === "ArrowUp" ? "up" : "down");
        const newVal = userAnswer.slice(0, targetIdx) + newChar + userAnswer.slice(targetIdx + 1);
        setUserAnswer(newVal);

        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(selStart, selStart);
          }
        });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  /**
   * 画面上の特殊文字ボタンをクリックした際、カーソル位置へ文字を挿入する処理
   */
  const handleInsertSpecialChar = (char: string) => {
    const input = inputRef.current;
    const selStart = input?.selectionStart ?? userAnswer.length;
    const selEnd = input?.selectionEnd ?? userAnswer.length;

    const newVal = userAnswer.slice(0, selStart) + char + userAnswer.slice(selEnd);
    setUserAnswer(newVal);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = selStart + char.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  if (!items || items.length === 0) {
    return (
      <div className="my-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-base text-zinc-500 dark:text-zinc-400">
          問題データが見つかりませんでした。
        </p>
      </div>
    );
  }

  // 制限時間バーの計算
  const maxTimerSeconds = selectedTimer !== "off" ? parseInt(selectedTimer, 10) : 1;
  const timerPercentage =
    timeLeft !== null && selectedTimer !== "off"
      ? Math.max(0, Math.min(100, (timeLeft / maxTimerSeconds) * 100))
      : 100;

  return (
    <div className="my-8 rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* 設定パネル（出題範囲・問題数・制限時間のカスタマイズ） */}
      <div className="mb-8 rounded-xl border border-zinc-100 bg-zinc-50/90 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* 出題範囲選択 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              出題範囲:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "全範囲", value: "all" },
                { label: "0〜19", value: "0-19" },
                { label: "20〜50", value: "20-50" },
                { label: "50〜100", value: "50-100" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRangeChange(opt.value as RangePreset)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    selectedRange === opt.value
                      ? "bg-tealblue-600 text-white shadow-sm dark:bg-tealblue-500"
                      : "bg-white text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 問題数選択 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">問題数:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "5問", value: "5" },
                { label: "10問", value: "10" },
                { label: "20問", value: "20" },
                { label: "全問", value: "all" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleCountChange(opt.value as CountOption)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    selectedCount === opt.value
                      ? "bg-tealblue-600 text-white shadow-sm dark:bg-tealblue-500"
                      : "bg-white text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 制限時間選択 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              制限時間:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "なし", value: "off" },
                { label: "15秒", value: "15" },
                { label: "30秒", value: "30" },
                { label: "45秒", value: "45" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTimerChange(opt.value as TimerOption)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    selectedTimer === opt.value
                      ? "bg-tealblue-600 text-white shadow-sm dark:bg-tealblue-500"
                      : "bg-white text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isFinished ? (
        /* 全問題完了時のスコア結果画面 */
        <div className="py-10 text-center">
          <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">演習終了！</h3>
          <p className="mt-4 text-xl text-zinc-700 dark:text-zinc-300">
            スコア:{" "}
            <span className="font-bold text-tealblue-600 dark:text-tealblue-400 text-2xl">
              {score}
            </span>{" "}
            / {questions.length} (
            {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%)
          </p>
          <button
            type="button"
            onClick={() => resetQuiz(selectedRange, selectedCount, selectedTimer)}
            className="mt-8 inline-flex items-center rounded-xl bg-tealblue-600 px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-tealblue-700 dark:bg-tealblue-500 dark:hover:bg-tealblue-600"
          >
            もう一度挑戦する
          </button>
        </div>
      ) : (
        /* 演習中画面 */
        <>
          {/* 進捗・現在スコア・タイマー表示 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm font-bold text-zinc-600 dark:text-zinc-400">
            <span>
              問題{" "}
              <strong className="text-base text-zinc-900 dark:text-zinc-100">
                {currentIndex + 1}
              </strong>{" "}
              / {questions.length}
            </span>

            {/* 制限時間カウントダウンバッジ */}
            {selectedTimer !== "off" && (
              <div className="flex items-center gap-2">
                <span>⏱️ 残り時間:</span>
                <span
                  className={`text-base font-extrabold px-2.5 py-0.5 rounded-md ${
                    timeLeft !== null && timeLeft <= 3
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 animate-pulse"
                      : "bg-tealblue-50 text-tealblue-700 dark:bg-tealblue-950 dark:text-tealblue-300"
                  }`}
                >
                  {timeLeft !== null ? `${timeLeft}秒` : "-"}
                </span>
              </div>
            )}

            <span>
              正解数:{" "}
              <strong className="text-base text-tealblue-600 dark:text-tealblue-400">
                {score}
              </strong>
            </span>
          </div>

          {/* 制限時間のプログレスバー */}
          {selectedTimer !== "off" && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeLeft !== null && timeLeft <= 3 ? "bg-rose-500" : "bg-tealblue-500"
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          )}

          {/* 出題表示 */}
          <div className="mt-8 text-center">
            <span className="text-sm font-bold tracking-wider text-tealblue-600 dark:text-tealblue-400 uppercase">
              数字に対応するフランス語のスペルを入力してください
            </span>
            <div className="mt-4 text-6xl md:text-7xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {currentQuestion?.num}
            </div>
          </div>

          {/* 解答入力エリア */}
          <div className="mt-8 flex flex-col items-center">
            <div className="w-full max-w-lg">
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                disabled={isAnswered}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="スペルを入力..."
                className="w-full rounded-2xl border-2 border-zinc-300 bg-white px-5 py-4 text-center text-2xl font-semibold text-zinc-900 outline-none transition-colors focus:border-tealblue-500 focus:ring-4 focus:ring-tealblue-500/20 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-tealblue-400 dark:disabled:bg-zinc-800"
              />

              {/* 特殊文字ボタンキーボード */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {SPECIAL_KEYS.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleInsertSpecialChar(char)}
                    disabled={isAnswered}
                    className="h-11 w-11 rounded-xl border border-zinc-300 bg-zinc-50 text-lg font-bold text-zinc-800 shadow-sm transition-transform active:scale-95 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                  >
                    {char}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-center text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                💡 <strong>↑ / ↓ 矢印キー</strong> で文字にアクセント記号（é, è, ê, à, ç, œ
                など）を付与・切替できます。
              </p>
            </div>

            {/* 判定結果バッジ */}
            {isAnswered && (
              <div
                className={`mt-6 w-full max-w-lg rounded-2xl p-5 text-center font-medium shadow-sm transition-all ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
                }`}
              >
                {isCorrect ? (
                  <div>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ✨ 正解です！
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                      {isTimeOut ? "⏰ 時間切れです！" : "❌ 不正解です"}
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      正解:{" "}
                      <span className="font-bold underline underline-offset-4 decoration-rose-400">
                        {currentQuestion?.french}
                      </span>
                    </p>
                  </div>
                )}
                <p className="mt-3 text-xs font-semibold opacity-75">
                  [Enter] キーを押すと次に進みます
                </p>
              </div>
            )}

            {/* 操作ボタン */}
            <div className="mt-8 flex items-center gap-4">
              {isAnswered ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-2xl bg-tealblue-600 px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-tealblue-700 dark:bg-tealblue-500 dark:hover:bg-tealblue-600"
                >
                  {currentIndex + 1 < questions.length ? "次の問題へ" : "結果を見る"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-2xl bg-tealblue-600 px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-tealblue-700 dark:bg-tealblue-500 dark:hover:bg-tealblue-600"
                  >
                    回答する
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="rounded-2xl border-2 border-zinc-200 px-6 py-3.5 text-base font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    パス
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
