import { useEffect, useRef, useState, useCallback } from "react";
// 既定の export はブラウザ向けのビルドで関数として取り出せないので、名前付きの export を使う
import { pinyin } from "pinyin";

interface CustomSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface CustomSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: CustomSpeechRecognitionEvent) => void) | null;
    onerror: ((event: CustomSpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
interface PracticeProblem {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

const SAMPLE_PROBLEMS: PracticeProblem[] = [
  { id: "1", hanzi: "买", pinyin: "mǎi", meaning: "買う（第3声）" },
  { id: "2", hanzi: "卖", pinyin: "mài", meaning: "売る（第4声）" },
  { id: "3", hanzi: "你好", pinyin: "nǐ hǎo", meaning: "こんにちは" },
  { id: "4", hanzi: "谢谢", pinyin: "xiè xie", meaning: "ありがとう" },
];

function normalizeText(text: string): string {
  return text.replace(/[。、！？.!?\s ]/g, "").toLowerCase();
}

function removeToneMarks(pinyinStr: string): string {
  return pinyinStr
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function ChinesePronunciation() {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedProblem, setSelectedProblem] = useState<PracticeProblem>(SAMPLE_PROBLEMS[0]);
  const [customText, setCustomText] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [recognizedPinyin, setRecognizedPinyin] = useState("");
  const [isExactMatch, setIsExactMatch] = useState<boolean | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const latestTranscriptRef = useRef<string>("");

  const currentTargetText = mode === "preset" ? selectedProblem.hanzi : customText.trim();
  const currentTargetPinyin =
    mode === "preset"
      ? selectedProblem.pinyin
      : pinyin(currentTargetText, { style: pinyin.STYLE_TONE }).flat().join(" ");

  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      // イベントリスナーを解除して不要なコールバック発火を抑止
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.abort(); // マイク入力を即座に切断
      } catch {
        // すでに停止済みのエラーは無視
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    // ページ遷移やコンポーネント破棄時にマイクを強制解放
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  const playAudio = () => {
    if (!currentTargetText || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTargetText);
    utterance.lang = "zh-CN";
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartRecording = () => {
    if (!currentTargetText) {
      setError("練習する文章・単語を入力してください。");
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError("お使いのブラウザは音声認識に対応していません。（Chrome/Edge推奨）");
      return;
    }

    // 残っている既存セッションを破棄
    cleanupRecognition();

    latestTranscriptRef.current = "";
    setRecognizedText("");
    setRecognizedPinyin("");
    setIsExactMatch(null);
    setAlternatives([]);
    setError(null);

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    recognition.onresult = (event: CustomSpeechRecognitionEvent) => {
      const resultsArray = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
      const currentText = resultsArray.map((res) => res[0].transcript).join("");

      const lastResult = event.results[event.results.length - 1];
      const altList = Array.from({ length: lastResult.length }, (_, i) => lastResult[i].transcript);

      latestTranscriptRef.current = currentText;
      setRecognizedText(currentText);
      setAlternatives(altList);
    };

    recognition.onerror = (event: CustomSpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError("音声認識エラーが発生しました。もう一度お試しください。");
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      setError("音声認識の起動に失敗しました。マイクの権限を確認してください。");
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (!isRecording) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // 無視
      }
    }
    setIsRecording(false);

    const rawTranscript = latestTranscriptRef.current;
    const cleanRecognized = normalizeText(rawTranscript);
    const cleanTarget = normalizeText(currentTargetText);

    if (cleanRecognized) {
      // 停止時のみ 1 回だけ pinyin 変換を行いUI負荷を抑える
      const convertedPinyin = pinyin(rawTranscript, { style: pinyin.STYLE_TONE }).flat().join(" ");
      setRecognizedPinyin(convertedPinyin);

      let isPass = cleanRecognized === cleanTarget;

      if (!isPass) {
        const targetPinyinAlpha = removeToneMarks(currentTargetPinyin);
        if (cleanRecognized === targetPinyinAlpha) {
          isPass = true;
        }
      }

      if (!isPass && alternatives.length > 0) {
        isPass = alternatives.some((alt) => normalizeText(alt) === cleanTarget);
      }

      setIsExactMatch(isPass);
    } else {
      setError("音声が検出されませんでした。もう少しマイクに近づけてお試しください。");
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* モード切り替え */}
      <div className="flex gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => {
            setMode("preset");
            setError(null);
          }}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
            mode === "preset"
              ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
          }`}
        >
          例題から選ぶ
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("custom");
            setError(null);
          }}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
            mode === "custom"
              ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
          }`}
        >
          自由に入力する
        </button>
      </div>

      {/* 入力・問題選択エリア */}
      {mode === "preset" ? (
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500">練習する単語・フレーズ</label>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_PROBLEMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProblem(p)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedProblem.id === p.id
                    ? "border-tealblue-500 bg-tealblue-50/50 dark:bg-tealblue-900/20"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
                }`}
              >
                <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{p.hanzi}</div>
                <div className="text-xs text-tealblue-600 dark:text-tealblue-400">{p.pinyin}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500">中国語を入力</label>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="例: 我想吃中国菜"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tealblue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      {/* メインカード */}
      <div className="text-center">
        <div className="text-4xl font-black text-zinc-800 dark:text-zinc-100">
          {currentTargetText || (
            <span className="text-zinc-300 dark:text-zinc-600">（未入力）</span>
          )}
        </div>
        <div className="mt-1 min-h-[24px] text-base font-semibold text-tealblue-600 dark:text-tealblue-400">
          {currentTargetPinyin}
        </div>

        {/* コントロールボタン */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={playAudio}
            disabled={!currentTargetText || isRecording}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            お手本を聞く
          </button>

          {!isRecording ? (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={!currentTargetText}
              className="rounded-full bg-tealblue-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-tealblue-700 disabled:opacity-40"
            >
              録音開始
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopRecording}
              className="flex items-center gap-2 animate-pulse rounded-full bg-rose-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700"
            >
              <span className="h-2 w-2 rounded-full bg-white"></span>
              録音終了（判定する）
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-center text-xs font-medium text-rose-500">{error}</p>}

      {/* 判定・結果エリア */}
      {(recognizedText || isRecording || isExactMatch !== null) && (
        <div className="space-y-4 rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">認識結果</span>
            {isRecording ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                音声を聞き取り中...
              </span>
            ) : isExactMatch === true ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                合格（正解）
              </span>
            ) : isExactMatch === false ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                声調・発音のズレあり
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <div className="text-[10px] text-zinc-400">認識された漢字</div>
              <div className="text-xl font-bold text-zinc-800 dark:text-zinc-100 min-h-[28px]">
                {recognizedText || "-"}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <div className="text-[10px] text-zinc-400">変換ピンイン</div>
              <div className="text-sm font-bold text-tealblue-600 dark:text-tealblue-400 min-h-[20px]">
                {recognizedPinyin || "-"}
              </div>
            </div>
          </div>

          {!isRecording && alternatives.length > 1 && (
            <div className="pt-2">
              <div className="text-[10px] text-zinc-400">検知された類似候補:</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {alternatives.map((alt) => (
                  <span
                    key={alt}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
