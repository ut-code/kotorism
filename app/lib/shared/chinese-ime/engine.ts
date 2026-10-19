import { buildAccentIndex, cycleAccent } from "../accent";
import { PINYIN_TONE_CYCLES } from "../pinyin-tones";
import { lookupCandidates, type CandidateItem } from "./dictionary";
import { segmentPinyin, type PinyinSegment } from "./syllables";
import { rankCandidatesByTone } from "./tone-ranking";

// ピンイン入力では ü を v で打つので、v にも ü と同じ声調記号を付けられるようにする。
// 先に登録したサイクルが優先されるため、v のサイクルを先頭に置く（ǖ の次は ǘ、最後は v に戻る）
const TONE_INDEX = buildAccentIndex([["v", "ǖ", "ǘ", "ǚ", "ǜ"], ...PINYIN_TONE_CYCLES]);

const PINYIN_INPUT_CHAR = /^[a-z'üāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]$/;

export interface ImeState {
  // 未確定のピンイン入力バッファ（例: "nihao", "woshiribenren"）
  rawInput: string;
  // 分割された音節列
  segments: PinyinSegment[];
  // 現在の候補リスト
  candidates: CandidateItem[];
  // 選択中の候補インデックス（0-indexed）
  selectedIndex: number;
  // 確定して入力欄に挿入すべき文字列（キー操作によって発生した場合）
  committedText: string | null;
}

export type ImeKeyAction =
  | { type: "char"; char: string }
  | { type: "space" }
  | { type: "digit"; digit: number }
  // 選択中の候補を確定する（候補がなければピンインのまま）
  | { type: "enter" }
  // 入力中のピンインをそのまま確定する（Shift+Enter）
  | { type: "commit_raw" }
  | { type: "backspace" }
  | { type: "escape" }
  | { type: "arrow_left" }
  | { type: "arrow_right" }
  | { type: "arrow_up" }
  | { type: "arrow_down" }
  | { type: "select"; index: number }
  // 候補を1つ進める / 戻す。端まで行くと反対側に戻る（Tab / Shift+Tab）
  | { type: "next_candidate" }
  | { type: "prev_candidate" }
  // 入力バッファ末尾の母音の声調記号を切り替える（↑ = 1, ↓ = -1）
  | { type: "tone"; direction: 1 | -1 }
  // 最後の音節の声調を指定する（0 = 軽声で記号を外す）。スマホのキーパッドの声調ボタン
  | { type: "set_tone"; tone: 0 | 1 | 2 | 3 | 4 };

// 母音（声調なし）→ 声調ごとの形（[軽声, 第1声, …, 第4声]）。v は ü として扱う
const TONE_FORMS = new Map<string, string[]>([
  ...PINYIN_TONE_CYCLES.map((cycle) => [cycle[0], cycle] as const),
  ["v", PINYIN_TONE_CYCLES.find((cycle) => cycle[0] === "ü")!],
]);
// 声調記号付きの母音 → 声調なしの母音
const TONELESS_VOWEL = new Map(
  PINYIN_TONE_CYCLES.flatMap((cycle) => cycle.map((ch) => [ch, cycle[0]] as const)),
);
// 声調記号付きの母音 → 声調（1〜4）
const TONE_OF_VOWEL = new Map(
  PINYIN_TONE_CYCLES.flatMap((cycle) => cycle.slice(1).map((ch, i) => [ch, i + 1] as const)),
);

// 入力した音節の声調（声調記号を付けていなければ null）
function inputTone(rawSyllable: string): number | null {
  for (const ch of rawSyllable) {
    const tone = TONE_OF_VOWEL.get(ch);
    if (tone !== undefined) return tone;
  }
  return null;
}

/**
 * 音節（声調なし）の中で声調記号を付ける母音の位置。a・e があればそれ、ou なら o、それ以外は最後の母音。
 */
function toneMarkIndex(syllable: string): number {
  for (const vowel of ["a", "e"]) {
    if (syllable.includes(vowel)) return syllable.indexOf(vowel);
  }
  if (syllable.includes("ou")) return syllable.indexOf("ou");
  for (let i = syllable.length - 1; i >= 0; i--) {
    if (TONE_FORMS.has(syllable[i])) return i;
  }
  return -1;
}

function setLastSyllableTone(state: ImeState, tone: number): string | null {
  const last = state.segments.at(-1);
  if (!last) return null;
  const syllable = [...state.rawInput.slice(last.start, last.end)]
    .map((ch) => TONELESS_VOWEL.get(ch) ?? ch)
    .join("");
  const index = toneMarkIndex(syllable);
  if (index < 0) return null;
  const marked =
    syllable.slice(0, index) + TONE_FORMS.get(syllable[index])![tone] + syllable.slice(index + 1);
  return state.rawInput.slice(0, last.start) + marked + state.rawInput.slice(last.end);
}

export function createImeState(): ImeState {
  return {
    rawInput: "",
    segments: [],
    candidates: [],
    selectedIndex: 0,
    committedText: null,
  };
}

/**
 * rawInput から音節分割と候補リストを計算して状態を構築する。
 */
function updateStateFromRawInput(raw: string): Omit<ImeState, "committedText"> {
  if (!raw) {
    return {
      rawInput: "",
      segments: [],
      candidates: [],
      selectedIndex: 0,
    };
  }

  const segments = segmentPinyin(raw);
  if (!segments || segments.length === 0) {
    return {
      rawInput: raw,
      segments: [],
      candidates: [],
      selectedIndex: 0,
    };
  }

  // 完全な音節のみを抽出
  const completeSegments = segments.filter((s) => !s.partial);
  const completeSyllables = completeSegments.map((s) => s.text);

  let candidates: CandidateItem[] = [];
  if (completeSyllables.length > 0) {
    // 声調を付けた音節があれば、その声調で読む候補を前に出す
    candidates = rankCandidatesByTone(
      lookupCandidates(completeSyllables, raw),
      completeSyllables,
      completeSegments.map((s) => inputTone(raw.slice(s.start, s.end))),
    );
  }

  return {
    rawInput: raw,
    segments,
    candidates,
    selectedIndex: 0,
  };
}

/**
 * 候補を確定し、消費した音節の分だけバッファを進める。
 */
function commitCandidate(state: ImeState, candidate: CandidateItem): ImeState {
  const count = candidate.syllableCount;
  const segments = state.segments;

  let remainingRaw = "";
  if (count < segments.length) {
    // 消費した音節の終了インデックス以降の文字列を取り出す
    const lastConsumedSegment = segments[count - 1];
    let nextStart = lastConsumedSegment.end;
    if (state.rawInput[nextStart] === "'") {
      nextStart++;
    }
    remainingRaw = state.rawInput.slice(nextStart);
  }

  const nextBase = updateStateFromRawInput(remainingRaw);
  return {
    ...nextBase,
    committedText: candidate.text,
  };
}

/**
 * 入力バッファの末尾が母音（声調記号付きを含む）で、声調記号を切り替えられるか。
 * ↑ / ↓ キーを声調の切り替えに使うか、候補の選択に使うかの判定に使う。
 */
export function canCycleTone(state: ImeState): boolean {
  return cycleAccent(TONE_INDEX, state.rawInput.at(-1), 1) !== null;
}

/**
 * キーアクションを受け取り、次の IMEState を計算する純粋関数。
 */
export function handleImeAction(state: ImeState, action: ImeKeyAction): ImeState {
  switch (action.type) {
    case "char": {
      const char = action.char.toLowerCase();
      // ピンインに使える文字は英字 (a-z)・アポストロフィ (')・ü と声調記号付きの母音（ボタンから入力する）
      if (!PINYIN_INPUT_CHAR.test(char)) {
        return {
          ...state,
          committedText: null,
        };
      }
      const newRaw = state.rawInput + char;
      const nextBase = updateStateFromRawInput(newRaw);
      return {
        ...nextBase,
        committedText: null,
      };
    }

    case "space": {
      if (state.candidates.length > 0) {
        const candidate = state.candidates[state.selectedIndex] ?? state.candidates[0];
        return commitCandidate(state, candidate);
      }
      if (state.rawInput) {
        // 候補がない場合はアルファベットをそのまま確定
        return {
          ...createImeState(),
          committedText: state.rawInput + " ",
        };
      }
      return {
        ...state,
        committedText: " ",
      };
    }

    case "digit": {
      const index = action.digit - 1;
      if (index >= 0 && index < state.candidates.length) {
        return commitCandidate(state, state.candidates[index]);
      }
      return {
        ...state,
        committedText: null,
      };
    }

    case "select": {
      if (action.index >= 0 && action.index < state.candidates.length) {
        return commitCandidate(state, state.candidates[action.index]);
      }
      return {
        ...state,
        committedText: null,
      };
    }

    case "enter": {
      if (state.candidates.length > 0) {
        return commitCandidate(state, state.candidates[state.selectedIndex] ?? state.candidates[0]);
      }
      if (state.rawInput) {
        return {
          ...createImeState(),
          committedText: state.rawInput,
        };
      }
      return {
        ...state,
        committedText: "\n",
      };
    }

    case "commit_raw": {
      if (state.rawInput) {
        return {
          ...createImeState(),
          committedText: state.rawInput,
        };
      }
      return {
        ...state,
        committedText: "\n",
      };
    }

    case "backspace": {
      if (state.rawInput.length > 0) {
        const newRaw = state.rawInput.slice(0, -1);
        const nextBase = updateStateFromRawInput(newRaw);
        return {
          ...nextBase,
          committedText: null,
        };
      }
      return {
        ...state,
        committedText: null,
      };
    }

    case "escape": {
      return createImeState();
    }

    case "tone": {
      if (!canCycleTone(state)) return { ...state, committedText: null };
      // 最後の音節の声調を 軽声 → 1 → 2 → 3 → 4 → 軽声 と切り替え、記号は正しい母音に付ける（mai → mài）
      const last = state.segments.at(-1);
      const current = last ? (inputTone(state.rawInput.slice(last.start, last.end)) ?? 0) : 0;
      const nextRaw =
        setLastSyllableTone(state, (current + action.direction + 5) % 5) ??
        state.rawInput.slice(0, -1) +
          cycleAccent(TONE_INDEX, state.rawInput.at(-1), action.direction);
      const nextBase = updateStateFromRawInput(nextRaw);
      return {
        ...nextBase,
        committedText: null,
      };
    }

    case "set_tone": {
      const nextRaw = setLastSyllableTone(state, action.tone);
      if (nextRaw === null) return { ...state, committedText: null };
      return {
        ...updateStateFromRawInput(nextRaw),
        committedText: null,
      };
    }

    case "next_candidate":
    case "prev_candidate": {
      const count = state.candidates.length;
      if (count === 0) return { ...state, committedText: null };
      const step = action.type === "next_candidate" ? 1 : -1;
      return {
        ...state,
        selectedIndex: (state.selectedIndex + step + count) % count,
        committedText: null,
      };
    }

    case "arrow_left":
    case "arrow_up": {
      if (state.candidates.length === 0) return { ...state, committedText: null };
      return {
        ...state,
        selectedIndex: Math.max(0, state.selectedIndex - 1),
        committedText: null,
      };
    }

    case "arrow_right":
    case "arrow_down": {
      if (state.candidates.length === 0) return { ...state, committedText: null };
      return {
        ...state,
        selectedIndex: Math.min(state.candidates.length - 1, state.selectedIndex + 1),
        committedText: null,
      };
    }
  }
}

/**
 * 変換中のピンインを、選択中の候補（候補がなければピンインのまま）で最後まで確定した文字列。
 * スマホのキーパッドで句読点を押したときに、変換を確定してから句読点を続けるのに使う。
 */
export function commitAll(state: ImeState): string {
  let text = "";
  let current = state;
  while (current.rawInput) {
    current = handleImeAction(current, { type: current.candidates.length > 0 ? "space" : "enter" });
    text += current.committedText ?? "";
  }
  return text;
}
