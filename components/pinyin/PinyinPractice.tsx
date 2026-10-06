"use client";

import { useEffect, useMemo, useState } from "react";
import { AccentInput } from "@/components/verbs/AccentInput";
import { speak } from "@/lib/speech";
import type { HanziEntry } from "@/app/learn/chinese/03/characters";

// 母音ごとの声調サイクル。母音を入力した直後に ↑/↓ キーで
// 第1声→第2声→第3声→第4声（→軽声）と切り替えられる。
const TONE_CYCLES: string[][] = [
  ["a", "ā", "á", "ǎ", "à"],
  ["e", "ē", "é", "ě", "è"],
  ["i", "ī", "í", "ǐ", "ì"],
  ["o", "ō", "ó", "ǒ", "ò"],
  ["u", "ū", "ú", "ǔ", "ù"],
  ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
];

const TOOLBAR_CHARS = [
  "ü",
  "ā",
  "á",
  "ǎ",
  "à",
  "ē",
  "é",
  "ě",
  "è",
  "ī",
  "í",
  "ǐ",
  "ì",
  "ō",
  "ó",
  "ǒ",
  "ò",
  "ū",
  "ú",
  "ǔ",
  "ù",
  "ǖ",
  "ǘ",
  "ǚ",
  "ǜ",
];

// 声調記号付きの母音 → { 基本母音, 声調番号 }
const TONE_MARKS: Record<string, { base: string; tone: string }> = {
  ā: { base: "a", tone: "1" },
  á: { base: "a", tone: "2" },
  ǎ: { base: "a", tone: "3" },
  à: { base: "a", tone: "4" },
  ē: { base: "e", tone: "1" },
  é: { base: "e", tone: "2" },
  ě: { base: "e", tone: "3" },
  è: { base: "e", tone: "4" },
  ī: { base: "i", tone: "1" },
  í: { base: "i", tone: "2" },
  ǐ: { base: "i", tone: "3" },
  ì: { base: "i", tone: "4" },
  ō: { base: "o", tone: "1" },
  ó: { base: "o", tone: "2" },
  ǒ: { base: "o", tone: "3" },
  ò: { base: "o", tone: "4" },
  ū: { base: "u", tone: "1" },
  ú: { base: "u", tone: "2" },
  ǔ: { base: "u", tone: "3" },
  ù: { base: "u", tone: "4" },
  ǖ: { base: "ü", tone: "1" },
  ǘ: { base: "ü", tone: "2" },
  ǚ: { base: "ü", tone: "3" },
  ǜ: { base: "ü", tone: "4" },
};

// ピンインを「基本つづり + 声調番号」の正規形にそろえる。
// 声調記号（wǒ）・末尾の数字（wo3）どちらの入力でも同じ形になり、
// v / u: は ü として扱う。軽声・無声調は番号なし。
function canonicalPinyin(raw: string): string {
  let s = raw.normalize("NFC").trim().toLowerCase().replace(/\s+/g, "");
  s = s.replace(/u:/g, "ü").replace(/v/g, "ü");

  let tone = "";
  let base = "";
  for (const ch of s) {
    const mark = TONE_MARKS[ch];
    if (mark) {
      base += mark.base;
      tone = mark.tone;
    } else {
      base += ch;
    }
  }

  const trailing = base.match(/([0-5])$/);
  if (trailing) {
    base = base.slice(0, -1);
    const t = trailing[1];
    tone = t === "0" || t === "5" ? "" : t;
  }

  return base + tone;
}

interface Question {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

// 1ラウンドの問題数の選択肢。全問正解まで続けず、短い単位で区切って達成感を得られるようにする
const ROUND_SIZES = [5, 10, 20];
const DEFAULT_ROUND_SIZE = 10;

interface PinyinPracticeProps {
  characters: HanziEntry[];
}

export function PinyinPractice({ characters }: PinyinPracticeProps) {
  const [phase, setPhase] = useState<"settings" | "practice" | "result">("settings");
  const [roundSize, setRoundSize] = useState(DEFAULT_ROUND_SIZE);
  // このラウンドで間違えた漢字（結果画面で復習できるよう、重複なしで出題順に保持する）
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(characters.map((c) => c.id)),
  );
  const [audioEnabled, setAudioEnabled] = useState(true);

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const selectedCharacters = useMemo(
    () => characters.filter((c) => selectedIds.has(c.id)),
    [characters, selectedIds],
  );

  const toggleCharacter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setAll = (on: boolean) =>
    setSelectedIds(on ? new Set(characters.map((c) => c.id)) : new Set());

  const speakHanzi = (hanzi: string) => {
    const started = speak(hanzi, "zh-CN", {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    if (started) setSpeaking(true);
  };

  const generateQuestion = (pool = selectedCharacters, history = recentIds) => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    if (pool.length === 0) return;

    let candidates = pool.filter((c) => !history.includes(c.id));
    if (candidates.length === 0) candidates = pool;

    const next = candidates[Math.floor(Math.random() * candidates.length)];
    // 直近の出題を避ける。ただし少なくとも1つは候補が残るよう、選択数-1 を上限にする
    setRecentIds((prev) => [next.id, ...prev].slice(0, Math.max(0, Math.min(8, pool.length - 1))));
    setQuestion({ id: next.id, hanzi: next.hanzi, pinyin: next.pinyin, meaning: next.meaning });
    setAnswer("");
    setSubmitted(false);
    setIsCorrect(false);
  };

  const startPractice = () => {
    setScore({ correct: 0, total: 0 });
    setMistakes([]);
    setRecentIds([]);
    setPhase("practice");
    generateQuestion(selectedCharacters, []);
  };

  const handleSubmit = () => {
    if (!question) return;
    if (!submitted) {
      const correct = canonicalPinyin(answer) === canonicalPinyin(question.pinyin);
      setIsCorrect(correct);
      setSubmitted(true);
      setScore((prev) => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
      if (!correct) {
        setMistakes((prev) =>
          prev.some((m) => m.id === question.id) ? prev : [...prev, question],
        );
      }
      if (audioEnabled) speakHanzi(question.hanzi);
    } else if (score.total >= roundSize) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      setPhase("result");
    } else {
      generateQuestion();
    }
  };

  if (phase === "settings") {
    const canStart = selectedIds.size > 0;
    return (
      <div className="space-y-10">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-bold text-zinc-800 dark:text-zinc-100">出題する漢字</div>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={() => setAll(true)}
                className="text-tealblue-600 hover:underline dark:text-tealblue-400"
              >
                全て選択
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className="text-tealblue-600 hover:underline dark:text-tealblue-400"
              >
                全て解除
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {characters.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm transition-colors hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-tealblue-600"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleCharacter(c.id)}
                  className="h-4 w-4 accent-tealblue-600"
                />
                <span>
                  <span className="text-lg font-medium text-zinc-800 dark:text-zinc-100">
                    {c.hanzi}
                  </span>
                  <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">{c.meaning}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 text-base font-bold text-zinc-800 dark:text-zinc-100">
            1ラウンドの問題数
          </div>
          <div className="flex gap-2">
            {ROUND_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setRoundSize(size)}
                aria-pressed={roundSize === size}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                  roundSize === size
                    ? "bg-tealblue-600 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {size}問
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div>
              <div className="font-bold text-zinc-800 dark:text-zinc-100">音声読み上げ</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                答え合わせのときに、漢字の発音を自動で読み上げます。
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAudioEnabled((prev) => !prev)}
              aria-pressed={audioEnabled}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                audioEnabled
                  ? "bg-tealblue-600 text-white hover:bg-tealblue-700"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {audioEnabled ? "🔊 音声オン" : "🔇 音声オフ"}
            </button>
          </div>
        </section>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={startPractice}
            disabled={!canStart}
            className="rounded-full bg-tealblue-600 px-10 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            練習を始める
          </button>
        </div>
        {!canStart && (
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            漢字を1つ以上選んでください。
          </div>
        )}
      </div>
    );
  }

  if (phase === "result") {
    const percent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-zinc-900/50">
          <div className="text-sm font-medium text-zinc-400 dark:text-zinc-500">ラウンド完了！</div>
          <div className="mt-2 text-5xl font-bold text-zinc-800 dark:text-zinc-100">
            {score.correct} / {score.total}
          </div>
          <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">正答率 {percent}%</div>

          {mistakes.length > 0 ? (
            <div className="mt-6 text-left">
              <div className="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                間違えた漢字
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {mistakes.map((m) => (
                  <li key={m.id} className="flex items-baseline gap-3 py-2">
                    <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      {m.hanzi}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-200">{m.pinyin}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{m.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 font-bold text-green-600 dark:text-green-400">全問正解です！</div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={startPractice}
              className="rounded-full bg-tealblue-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700"
            >
              もう一度
            </button>
            <button
              type="button"
              onClick={() => setPhase("settings")}
              className="rounded-full border border-zinc-200 px-8 py-3 font-bold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              設定に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="py-16 text-center text-zinc-500 dark:text-zinc-400">
        <div>出題できる漢字がありません。設定を見直してください。</div>
        <button
          type="button"
          onClick={() => setPhase("settings")}
          className="mt-4 text-tealblue-600 hover:underline dark:text-tealblue-400"
        >
          設定に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <button
          type="button"
          onClick={() => setPhase("settings")}
          className="text-tealblue-600 hover:underline dark:text-tealblue-400"
        >
          設定に戻る
        </button>
        <span>
          {Math.min(score.total + (submitted ? 0 : 1), roundSize)} / {roundSize}問目 ・ 正解:{" "}
          {score.correct}
        </span>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900/50">
        <div className="mb-2 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
          この漢字のピンインは？
        </div>
        <div className="mb-6 text-center">
          <div className="text-7xl font-bold text-zinc-800 dark:text-zinc-100">
            {question.hanzi}
          </div>
          {submitted && (
            <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{question.meaning}</div>
          )}
        </div>

        <AccentInput
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          disabled={submitted}
          autoFocus
          placeholder="ピンインを入力..."
          accentCycles={TONE_CYCLES}
          toolbarChars={TOOLBAR_CHARS}
          chordReplacements={{ "u\\": "ü" }}
          hintText={
            <>
              ヒント: 母音（a e i o u ü）を入力した直後に ↑キーを押すと、a → ā → á → ǎ → à
              のように四声の記号を付けられます（↓キーで逆順）。ü は u に続けて \
              を打つと入力できます。 ü や記号は下のボタンからも入力できます。数字での声調入力（例:
              hao3）も正解になります。
            </>
          }
          className={`w-full rounded-xl border-2 px-4 py-3 text-center text-xl font-medium text-zinc-800 outline-none transition-colors dark:text-zinc-100 ${
            !submitted
              ? "border-zinc-200 bg-white focus:border-tealblue-400 dark:border-zinc-700 dark:bg-zinc-800"
              : isCorrect
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-red-500 bg-red-50 dark:bg-red-900/20"
          }`}
        />

        {submitted && (
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            {isCorrect ? (
              <div className="font-bold text-green-600 dark:text-green-400">
                正解！（{question.pinyin}）
              </div>
            ) : (
              <div className="font-bold text-red-600 dark:text-red-400">
                不正解 — 正解は「{question.pinyin}」
              </div>
            )}
            <button
              type="button"
              onClick={() => speakHanzi(question.hanzi)}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-tealblue-500 dark:hover:text-tealblue-400"
            >
              {speaking ? "🔊 再生中…" : "🔊 発音を聞く"}
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-tealblue-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700"
          >
            {submitted ? (score.total >= roundSize ? "結果を見る" : "次の問題へ") : "答え合わせ"}
          </button>
        </div>
      </div>
    </div>
  );
}
