import { useEffect, useState } from "react";

import type { HanziEntry } from "@/routes/learn._chinese.chinese.03/characters";
import { CheckboxPicker } from "@/components/practice/CheckboxPicker";
import {
  AUDIO_OPTIONS,
  ChoiceChips,
  SettingRow,
  SpeakButton,
} from "@/components/practice/PracticeControls";
import { Quiz, QuizEmpty } from "@/components/practice/Quiz";
import { speak } from "@/lib/shared/speech";

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

type Question = HanziEntry & { answer: string };

interface PinyinPracticeProps {
  characters: HanziEntry[];
}

// 漢字からピンインの練習。漢字1字を見て、声調記号付き（または数字で声調）のピンインを入力する
export function PinyinPractice({ characters }: PinyinPracticeProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(characters.map((c) => c.id)),
  );
  const [audio, setAudio] = useState<"on" | "off">("on");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const pool: Question[] = characters
    .filter((c) => selectedIds.has(c.id))
    .map((c) => ({ ...c, answer: c.pinyin }));

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const speakHanzi = (hanzi: string) => {
    const started = speak(hanzi, "zh-CN", {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    if (started) setSpeaking(true);
  };

  if (characters.length === 0) return <QuizEmpty />;

  return (
    <Quiz
      pool={pool}
      emptyMessage="漢字を1つ以上選んでください。"
      countOptions={["5", "10", "20"]}
      lang="zh-Latn-pinyin"
      settings={
        <>
          <CheckboxPicker
            title="出題する漢字"
            unit="字"
            items={characters.map((c) => ({
              id: c.id,
              label: c.hanzi,
              sub: c.meaning,
              search: `${c.hanzi} ${c.pinyin} ${canonicalPinyin(c.pinyin)} ${c.meaning}`,
            }))}
            selected={selectedIds}
            onChange={setSelectedIds}
            searchPlaceholder="漢字を検索（漢字・ピンイン・意味）"
            labelLang="zh-CN"
            labelClassName="text-lg font-medium"
            columnsClassName="grid-cols-3 sm:grid-cols-4"
          />
          <SettingRow label="音声">
            <ChoiceChips
              label="音声読み上げ"
              options={AUDIO_OPTIONS}
              value={audio}
              onChange={setAudio}
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              答え合わせのときに、漢字の発音を読み上げます。
            </p>
          </SettingRow>
        </>
      }
      mode={{
        kind: "typing",
        accentCycles: TONE_CYCLES,
        toolbarChars: TOOLBAR_CHARS,
        chordReplacements: { "u\\": "ü" },
        isCorrect: (given, q) => canonicalPinyin(given) === canonicalPinyin(q.pinyin),
        placeholder: "ピンインを入力…",
        hint: (
          <>
            母音（a e i o u ü）を入力した直後に <strong>↑ / ↓ キー</strong>
            を押すと、a → ā → á → ǎ → à のように四声の記号を付けられます。ü は u に続けて \
            を打つと入力できます。数字での声調入力（例: hao3）も正解になります。
          </>
        ),
      }}
      instruction="この漢字のピンインは？"
      renderPrompt={(q, answered) => (
        <>
          <p lang="zh-CN" className="text-7xl font-bold text-zinc-900 dark:text-zinc-50">
            {q.hanzi}
          </p>
          {/* 意味は答えのヒントになるので、答え合わせのあとに出す */}
          <p className="mt-2 h-5 text-sm text-zinc-500 dark:text-zinc-400">
            {answered ? q.meaning : ""}
          </p>
        </>
      )}
      renderMistakePrompt={(q) => (
        <>
          <span lang="zh-CN" className="text-2xl font-bold">
            {q.hanzi}
          </span>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{q.meaning}</span>
        </>
      )}
      renderFeedbackExtra={(q) => (
        <SpeakButton speaking={speaking} onClick={() => speakHanzi(q.hanzi)} />
      )}
      onAnswered={(q) => {
        if (audio === "on") speakHanzi(q.hanzi);
      }}
      onLeaveQuestion={stopSpeaking}
    />
  );
}
