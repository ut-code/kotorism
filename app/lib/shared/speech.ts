// 学習用途のため、ブラウザ標準（1.0）よりゆっくり読み上げる
export const SPEECH_RATE = 0.8;

// ブラウザ起動直後はgetVoices()が空配列を返すことがあるため、
// モジュール読み込み時に一度呼んで音声リストの取得を早めに促す
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
}

// 既定の音声（OS標準の合成音声など）は抑揚が乏しく聞き取りにくいことがあるため、
// Google/Natural/Neural系などの高品質な音声があればそちらを優先的に選ぶ
const PREFERRED_VOICE_KEYWORDS = ["google", "natural", "neural", "enhanced", "premium"];

function pickVoice(langPrefix: string): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;

  const matching = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (matching.length === 0) return undefined;

  const preferred = matching.find((v) =>
    PREFERRED_VOICE_KEYWORDS.some((keyword) => v.name.toLowerCase().includes(keyword)),
  );

  return preferred ?? matching[0];
}

// langは"fr-FR"や"es-ES"のようなBCP47タグ。音声選択は先頭の言語部分（"fr"/"es"）で照合する
export function createUtterance(text: string, lang: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = SPEECH_RATE;

  const voice = pickVoice(lang.split("-")[0].toLowerCase());
  if (voice) utterance.voice = voice;

  return utterance;
}

// ChromeはSpeechSynthesisUtteranceへの参照が無いと、再生開始前にガベージコレクトされ
// エラーも出さずに無音のまま再生が失敗することがある。モジュール変数に保持して防ぐ
let activeUtterance: SpeechSynthesisUtterance | null = null;

// 指定した言語での読み上げを開始する。開始できた場合はtrueを返す
export function speak(
  text: string,
  lang: string,
  handlers: { onEnd?: () => void; onError?: () => void } = {},
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  window.speechSynthesis.cancel();

  const utterance = createUtterance(text, lang);
  activeUtterance = utterance;

  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
    handlers.onEnd?.();
  };
  utterance.onerror = () => {
    if (activeUtterance === utterance) activeUtterance = null;
    handlers.onError?.();
  };

  // Chromeはcancel()の直後に同期でspeak()すると、cancel処理と競合して新しい発話も
  // 開始直後に打ち切られてしまうことがある（「再生中」表示が一瞬で消える不具合の原因）。
  // cancel()の処理が完了するのを待つため、少し遅らせてからspeak()を呼ぶ
  setTimeout(() => {
    if (activeUtterance === utterance) window.speechSynthesis.speak(utterance);
  }, 50);

  return true;
}
