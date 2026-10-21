import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, ReactNode } from "react";

import { PinyinKeypad } from "@/components/chinese/PinyinKeypad";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import {
  buildAccentIndex,
  cycleCharBeforeCaret,
  insertAtSelection,
  type TextEdit,
} from "@/lib/shared/accent";
import {
  canCycleTone,
  commitAll,
  createImeState,
  handleImeAction,
  type ImeKeyAction,
  type ImeState,
} from "@/lib/shared/chinese-ime/engine";
import { imeKeyResult } from "@/lib/shared/chinese-ime/key-actions";
import {
  INPUT_ASSIST_LABELS,
  assistModeChoices,
  assistModeFor,
  type InputAssistMode,
  type NotebookLanguage,
} from "@/lib/shared/notebook-language";
import { PINYIN_TONE_CYCLES, PINYIN_TOOLBAR_CHARS } from "@/lib/shared/pinyin-tones";
import { PRACTICE_LANGUAGES } from "@/lib/shared/practice-languages";

// 表の入力欄に付ける属性。どの列の欄か・どの補助を使うかを、キー操作を受ける InputAssist に伝える
type AssistFieldProps = {
  lang?: string;
  inputMode?: "none";
  "data-assist-column"?: string;
  "data-assist-index"?: number;
  "data-assist-mode"?: InputAssistMode;
};

const AssistContext = createContext<(columnIndex: number, column: string) => AssistFieldProps>(
  () => ({}),
);

// 表の入力欄（＋の入力行・表全体の編集中の欄）に付ける属性を返す関数。InputAssist の中で使う
export function useAssistField() {
  return useContext(AssistContext);
}

const PAGE_SIZE = 6;
const PINYIN_INDEX = buildAccentIndex(PINYIN_TONE_CYCLES);

// 列ごとに選んだ補助は、見る人ごとの好みとしてブラウザに残す
const storageKey = (notebookId: string) => `kotorism:input-assist:${notebookId}`;
// サーバー側では読めないので空にする（初めの描画では表の入力欄を出さないので、描画は食い違わない）
function loadSavedModes(notebookId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey(notebookId)) ?? "{}");
    return saved && typeof saved === "object" ? (saved as Record<string, string>) : {};
  } catch {
    return {};
  }
}

const isAssistInput = (target: EventTarget | null): target is HTMLInputElement =>
  target instanceof HTMLInputElement && target.dataset.assistMode !== undefined;

// 入力欄の値を書き換える。値を state で持つ欄（onChange）も持たない欄（defaultValue）もあるため、
// DOM の値を直接変えて input イベントを送る（React の onChange も呼ばれる）。上限を超えるなら変えない
function writeInput(input: HTMLInputElement, edit: TextEdit) {
  if (input.maxLength >= 0 && edit.value.length > input.maxLength) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
    input,
    edit.value,
  );
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.setSelectionRange(edit.caret, edit.caret);
}

// カーソルの位置（選択範囲があれば置き換え）に文字を入れる
function insertText(input: HTMLInputElement, text: string) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  writeInput(input, insertAtSelection(input.value, start, end, text));
}

type Focused = { input: HTMLInputElement; column: string; index: number };

// 単語帳の表で単語を入力するときの補助。単語帳の言語（指定なしなら何もしない）と列から、欄ごとに
// アクセント記号（↑ / ↓・ボタン）、ピンインの声調記号、ピンインからの簡体字の変換を付ける。
// 表の中の欄のキー操作を先に（capture で）受け、補助で使ったキーは表の行の移動・追加に渡さない。
// ↑ / ↓ は、カーソルの直前の文字を切り替えられるなら、上下の欄への移動より切り替えを優先する
// 入力中の欄の補助の切り替えと特殊文字のボタンは、表の下（画面の下に貼り付く）の帯にまとめて出す
export default function InputAssist({
  notebookId,
  language,
  children,
}: {
  notebookId: string;
  language: NotebookLanguage | null;
  children: ReactNode;
}) {
  const coarsePointer = useCoarsePointer();
  const [savedModes, setSavedModes] = useState(() => loadSavedModes(notebookId));
  // 別の単語帳へ移ったら、その単語帳で選んだ補助を読み直す
  const [prevNotebookId, setPrevNotebookId] = useState(notebookId);
  if (notebookId !== prevNotebookId) {
    setPrevNotebookId(notebookId);
    setSavedModes(loadSavedModes(notebookId));
  }

  const [focused, setFocused] = useState<Focused | null>(null);
  // ピンインの変換中の状態。キーを続けて押しても最新の状態から計算できるよう ref でも持つ
  const [ime, setIme] = useState<ImeState>(createImeState);
  const imeRef = useRef(ime);
  const [page, setPage] = useState(0);
  // 候補の窓を出す位置（入力中の欄のすぐ下。外枠を基準にする）
  const [candidatePosition, setCandidatePosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  const practiceLanguage =
    language && language !== "chinese" ? PRACTICE_LANGUAGES[language] : undefined;
  const accentIndex = useMemo(
    () => buildAccentIndex(practiceLanguage?.accentCycles ?? []),
    [practiceLanguage],
  );

  const fieldProps = useMemo(
    () =>
      (columnIndex: number, column: string): AssistFieldProps => {
        if (language === null) return {};
        const mode = assistModeFor(language, columnIndex, column, savedModes[column]);
        return {
          lang:
            mode === "accent"
              ? practiceLanguage?.lang
              : mode === "pinyin"
                ? "zh-Latn-pinyin"
                : mode === "hanzi"
                  ? "zh-CN"
                  : undefined,
          // スマホでは簡体字の入力のあいだ、OS のキーボードの代わりにキーパッドを出す
          inputMode: mode === "hanzi" && coarsePointer ? "none" : undefined,
          "data-assist-column": column,
          "data-assist-index": columnIndex,
          "data-assist-mode": mode,
        };
      },
    [language, savedModes, practiceLanguage, coarsePointer],
  );

  const converting = ime.rawInput.length > 0;
  const totalPages = Math.max(1, Math.ceil(ime.candidates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);

  function setImeState(next: ImeState) {
    imeRef.current = next;
    setIme(next);
  }

  function applyIme(input: HTMLInputElement, action: ImeKeyAction) {
    const prev = imeRef.current;
    const next = handleImeAction(prev, action);
    if (next.committedText) insertText(input, next.committedText);
    setImeState(next);
    const wrapper = wrapperRef.current;
    if (next.rawInput && wrapper) {
      const rect = input.getBoundingClientRect();
      const origin = wrapper.getBoundingClientRect();
      setCandidatePosition({
        top: rect.bottom - origin.top + 4,
        left: Math.max(0, rect.left - origin.left),
      });
    }
    // 選択中の候補が見えるページに合わせる
    if (next.rawInput !== prev.rawInput || next.selectedIndex !== prev.selectedIndex) {
      setPage(Math.floor(next.selectedIndex / PAGE_SIZE));
    }
  }

  // 変換中のピンインを確定する（raw ならピンインのまま、そうでなければ選択中の候補で）
  function commitPending(input: HTMLInputElement, raw: boolean) {
    const state = imeRef.current;
    if (!state.rawInput) return;
    insertText(input, raw ? state.rawInput : commitAll(state));
    setImeState(createImeState());
    setPage(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const input = event.target;
    if (!isAssistInput(input) || event.nativeEvent.isComposing) return;
    const mode = input.dataset.assistMode as InputAssistMode;

    if (mode === "hanzi") {
      const state = imeRef.current;
      const result = imeKeyResult(event, {
        converting: state.rawInput.length > 0,
        canCycleTone: canCycleTone(state),
        pageStart: currentPage * PAGE_SIZE,
      });
      if (!result) return;
      if (result.kind === "commitThenPass") {
        commitPending(input, false);
        return;
      }
      // 変換に使ったキーは、表の行の追加・移動に渡さない
      event.preventDefault();
      event.stopPropagation();
      if (result.kind === "page") {
        setPage(Math.min(totalPages - 1, Math.max(0, currentPage + result.delta)));
      } else {
        applyIme(input, result.action);
      }
      return;
    }
    if (mode === "off") return;

    if (
      (event.key === "ArrowUp" || event.key === "ArrowDown") &&
      input.selectionStart === input.selectionEnd
    ) {
      const edit = cycleCharBeforeCaret(
        mode === "pinyin" ? PINYIN_INDEX : accentIndex,
        input.value,
        input.selectionStart ?? 0,
        event.key === "ArrowUp" ? 1 : -1,
      );
      if (edit) {
        event.preventDefault();
        event.stopPropagation();
        writeInput(input, edit);
      }
    }
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    const input = event.target;
    if (!isAssistInput(input)) return;
    setFocused({
      input,
      column: input.dataset.assistColumn ?? "",
      index: Number(input.dataset.assistIndex),
    });
  }

  // 欄を離れるときは、変換中のピンインをピンインのまま確定する（打った文字を消さない）
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const input = event.target;
    if (!isAssistInput(input)) return;
    commitPending(input, true);
    setFocused((current) => (current?.input === input ? null : current));
  }

  const active = focused && focused.input.isConnected ? focused : null;
  const activeMode = active
    ? assistModeFor(language, active.index, active.column, savedModes[active.column])
    : "off";

  function chooseMode(mode: InputAssistMode) {
    if (!active) return;
    commitPending(active.input, true);
    const next = { ...savedModes, [active.column]: mode };
    setSavedModes(next);
    try {
      localStorage.setItem(storageKey(notebookId), JSON.stringify(next));
    } catch {
      // 保存できなくても、この画面の中では選んだ補助を使う
    }
  }

  // 帯のボタンで文字を入れる。簡体字の入力中は変換中のピンインに足す
  function insertChar(char: string) {
    if (!active) return;
    if (activeMode === "hanzi") {
      applyIme(active.input, { type: "char", char });
    } else {
      insertText(active.input, char);
    }
  }

  const keypadBackspace = (input: HTMLInputElement) => {
    if (imeRef.current.rawInput) {
      applyIme(input, { type: "backspace" });
      return;
    }
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (start === end && start === 0) return;
    writeInput(input, insertAtSelection(input.value, start === end ? start - 1 : start, end, ""));
  };

  const showKeypad = activeMode === "hanzi" && coarsePointer;
  const chars =
    activeMode === "accent"
      ? (practiceLanguage?.specialChars ?? [])
      : activeMode === "pinyin" || (activeMode === "hanzi" && !showKeypad)
        ? PINYIN_TOOLBAR_CHARS
        : [];
  const charLang = activeMode === "accent" ? practiceLanguage?.lang : "zh-Latn-pinyin";

  return (
    <AssistContext.Provider value={fieldProps}>
      <div
        ref={wrapperRef}
        className="relative"
        onKeyDownCapture={handleKeyDown}
        onFocusCapture={handleFocus}
        onBlurCapture={handleBlur}
      >
        {children}

        {active && converting && candidatePosition && (
          <div
            role="region"
            aria-label="ピンイン変換候補"
            style={candidatePosition}
            onMouseDown={(event) => event.preventDefault()}
            className="absolute z-40 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-tealblue-300 bg-white p-2.5 shadow-lg dark:border-tealblue-700 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5 text-xs dark:border-zinc-800">
              <span
                lang="zh-Latn-pinyin"
                className="rounded bg-tealblue-50 px-1.5 py-0.5 font-bold text-tealblue-700 dark:bg-tealblue-950/50 dark:text-tealblue-300"
              >
                {ime.segments.map((s) => ime.rawInput.slice(s.start, s.end)).join("'") ||
                  ime.rawInput}
              </span>
              {totalPages > 1 && (
                <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="前の候補"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                    className="rounded px-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  >
                    ◀
                  </button>
                  {currentPage + 1} / {totalPages}
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="次の候補"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setPage(currentPage + 1)}
                    className="rounded px-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  >
                    ▶
                  </button>
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ime.candidates.length > 0 ? (
                ime.candidates
                  .slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
                  .map((candidate, i) => {
                    const index = currentPage * PAGE_SIZE + i;
                    const selected = index === ime.selectedIndex;
                    return (
                      <button
                        key={`${candidate.text}-${index}`}
                        type="button"
                        tabIndex={-1}
                        onClick={() => applyIme(active.input, { type: "select", index })}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm ${
                          selected
                            ? "bg-tealblue-600 font-bold text-white dark:bg-tealblue-500"
                            : "border border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-tealblue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        <span
                          className={`text-xs ${selected ? "text-tealblue-100" : "text-zinc-400 dark:text-zinc-500"}`}
                        >
                          {i + 1}.
                        </span>
                        <span lang="zh-CN">{candidate.text}</span>
                      </button>
                    );
                  })
              ) : (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  候補が見つかりません（Enter でピンインのまま確定）
                </span>
              )}
            </div>
          </div>
        )}

        {active && (
          // 押しても入力欄のフォーカス（=ソフトウェアキーボード）が外れないよう、mousedown の既定動作を止める
          <div
            role="toolbar"
            aria-label="入力補助"
            onMouseDown={(event) => event.preventDefault()}
            className="sticky bottom-0 z-30 mt-2 rounded-xl border border-black/[.08] bg-[var(--background)]/95 p-2 backdrop-blur dark:border-white/[.145]"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">「{active.column}」の入力</span>
              <div
                role="radiogroup"
                aria-label={`「${active.column}」の入力補助`}
                className="flex overflow-hidden rounded-full border border-black/[.1] dark:border-white/[.15]"
              >
                {assistModeChoices(language).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={mode === activeMode}
                    tabIndex={-1}
                    onClick={() => chooseMode(mode)}
                    className={`px-3 py-1 transition-colors ${
                      mode === activeMode
                        ? "bg-coral-500 text-white"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {INPUT_ASSIST_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>
            {chars.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {chars.map((char) => (
                  <button
                    key={char}
                    type="button"
                    tabIndex={-1}
                    lang={charLang}
                    onClick={() => insertChar(char)}
                    className="h-9 w-9 shrink-0 rounded-lg border border-zinc-300 bg-white text-base font-semibold text-zinc-700 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-tealblue-500 dark:hover:text-tealblue-300"
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}
            {showKeypad && (
              <PinyinKeypad
                onChar={(char) => applyIme(active.input, { type: "char", char })}
                onTone={(tone) => applyIme(active.input, { type: "set_tone", tone })}
                onPunctuation={(p) => {
                  commitPending(active.input, false);
                  insertText(active.input, p);
                }}
                onBackspace={() => keypadBackspace(active.input)}
                onSpace={() =>
                  imeRef.current.rawInput
                    ? applyIme(active.input, { type: "space" })
                    : insertText(active.input, " ")
                }
                onEnter={() =>
                  imeRef.current.rawInput
                    ? applyIme(active.input, { type: "enter" })
                    : // 変換中でなければ、欄で Enter を押したときと同じ（単語の追加など）
                      active.input.dispatchEvent(
                        new globalThis.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
                      )
                }
                enterLabel="決定"
              />
            )}
            <p className="mt-1.5 hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
              {activeMode === "accent" &&
                practiceLanguage &&
                `カーソルの直前の文字を ↑ / ↓ キーで${practiceLanguage.accentName}に切り替えられます（切り替えられない文字のときは上下の欄へ移ります）。`}
              {activeMode === "pinyin" &&
                "カーソルの直前の母音を ↑ / ↓ キーで声調記号付きの母音（ā á ǎ à）に切り替えられます（母音でないときは上下の欄へ移ります）。"}
              {activeMode === "hanzi" &&
                "ピンインを入力すると候補が出ます。Space / Enter で確定、数字で候補を選び、Shift+Enter でピンインのまま確定します。"}
              {activeMode === "off" && "この列は補助なしで入力します。"}
            </p>
          </div>
        )}
      </div>
    </AssistContext.Provider>
  );
}
