import { useState, useRef, useCallback } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { PinyinKeypad, type KeypadTone } from "@/components/chinese/PinyinKeypad";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import {
  canCycleTone,
  commitAll,
  createImeState,
  handleImeAction,
  type ImeState,
  type ImeKeyAction,
} from "@/lib/shared/chinese-ime/engine";
import type { CandidateItem } from "@/lib/shared/chinese-ime/dictionary";
import { PINYIN_TOOLBAR_CHARS } from "@/lib/shared/pinyin-tones";

export interface ChineseImeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  showImeToggle?: boolean;
  hintText?: ReactNode;
}

const PAGE_SIZE = 6;

// 変換中に出すキー操作の説明
const KEY_HINTS = [
  ["Space / Enter", "確定"],
  ["1-9", "番号で確定"],
  ["Tab / Shift+Tab", "候補を移動"],
  ["↑↓", "声調"],
  ["Shift+Enter", "英字のまま"],
  ["Esc", "取消"],
] as const;

export function ChineseImeInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  autoFocus,
  className,
  multiline = false,
  rows = 4,
  maxLength,
  showImeToggle = true,
  hintText,
}: ChineseImeInputProps) {
  const [imeEnabled, setImeEnabled] = useState(true);
  const [imeState, setImeState] = useState<ImeState>(createImeState);
  const [isFocused, setIsFocused] = useState(false);
  const [page, setPage] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isConverting = imeState.rawInput.length > 0;
  // スマホ（指で操作する端末）では、ピンイン入力のあいだ OS のキーボードの代わりにキーパッドを出す
  const useKeypad = useCoarsePointer() && imeEnabled;

  // 候補のページング
  const totalCandidates = imeState.candidates.length;
  const totalPages = Math.max(1, Math.ceil(totalCandidates / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedCandidates = imeState.candidates.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  // コミット処理（確定文字列を入力欄に追加し、残りのピンインがあれば継続）
  const applyAction = useCallback(
    (action: ImeKeyAction) => {
      setImeState((prev) => {
        const next = handleImeAction(prev, action);
        if (next.committedText) {
          onChange(value + next.committedText);
        }
        // 選択中の候補が見えるページに合わせる
        if (next.rawInput !== prev.rawInput || next.selectedIndex !== prev.selectedIndex) {
          setPage(Math.floor(next.selectedIndex / PAGE_SIZE));
        }
        return next;
      });
    },
    [onChange, value],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (disabled) return;

    // IME 切替ショートカット: Ctrl + Space または Shift + Space
    if (e.key === " " && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      toggleIme();
      return;
    }

    // 修飾キー（Ctrl, Alt, Meta）が押されている場合はブラウザ標準ショートカットに任せる
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (!imeEnabled) {
      if (e.key === "Enter" && !multiline) {
        onSubmit?.();
      }
      return;
    }

    // 変換中のキー操作
    if (isConverting) {
      if (e.key === " ") {
        e.preventDefault();
        applyAction({ type: "space" });
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const digitNumber = Number(e.key);
        // 現在のページ内でのインデックス
        const targetIndex = currentPage * PAGE_SIZE + (digitNumber - 1);
        applyAction({ type: "select", index: targetIndex });
        return;
      }
      // Enter は選択中の候補（漢字）を、Shift+Enter はピンインのまま確定する
      if (e.key === "Enter") {
        e.preventDefault();
        applyAction({ type: e.shiftKey ? "commit_raw" : "enter" });
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        applyAction({ type: e.shiftKey ? "prev_candidate" : "next_candidate" });
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        applyAction({ type: "backspace" });
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        applyAction({ type: "escape" });
        return;
      }
      // 母音の直後の ↑ / ↓ は声調記号の切り替え（漢字からピンインの練習と同じ操作）
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && canCycleTone(imeState)) {
        e.preventDefault();
        applyAction({ type: "tone", direction: e.key === "ArrowUp" ? 1 : -1 });
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        applyAction({ type: "arrow_left" });
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        applyAction({ type: "arrow_right" });
        return;
      }
      if (e.key === "PageDown" || e.key === "=") {
        e.preventDefault();
        setPage((p) => Math.min(totalPages - 1, p + 1));
        return;
      }
      if (e.key === "PageUp" || e.key === "-") {
        e.preventDefault();
        setPage((p) => Math.max(0, p - 1));
        return;
      }
      if (/^[a-zA-Z']$/.test(e.key)) {
        e.preventDefault();
        applyAction({ type: "char", char: e.key });
        return;
      }
      // その他のキーが押されたら一度変換を確定してから通す
      return;
    }

    // 待機中（isConverting === false）
    if (/^[a-zA-Z']$/.test(e.key)) {
      e.preventDefault();
      applyAction({ type: "char", char: e.key });
      return;
    }

    if (e.key === "Enter" && !multiline) {
      onSubmit?.();
    }
  };

  const toggleIme = () => {
    setImeEnabled((prev) => !prev);
    if (isConverting) setImeState(createImeState());
  };

  // 入力欄の下のボタン（ü・声調記号付きの母音）。ピンイン入力（中）では変換中のピンインに加え、
  // 英字入力ではカーソルの位置にそのまま入れる
  const insertToolbarChar = (ch: string) => {
    if (disabled) return;
    const el = multiline ? textareaRef.current : inputRef.current;
    if (imeEnabled) {
      applyAction({ type: "char", char: ch });
      el?.focus();
      return;
    }
    if (maxLength !== undefined && value.length >= maxLength) return;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    onChange(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  // キャレットの位置に文字列を入れる（変換中でないときのキーパッドの空白・改行・句読点）
  const insertAtCaret = (text: string) => {
    const el = multiline ? textareaRef.current : inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const next = value.slice(0, start) + text + value.slice(end);
    if (maxLength !== undefined && next.length > maxLength) return;
    onChange(next);
    requestAnimationFrame(() => el?.setSelectionRange(start + text.length, start + text.length));
  };

  const keypadBackspace = () => {
    if (isConverting) {
      applyAction({ type: "backspace" });
      return;
    }
    const el = multiline ? textareaRef.current : inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    onChange(value.slice(0, from) + value.slice(end));
    requestAnimationFrame(() => el?.setSelectionRange(from, from));
  };

  // 句読点は、変換中のピンインを確定してから続ける
  const keypadPunctuation = (p: string) => {
    if (!isConverting) {
      insertAtCaret(p);
      return;
    }
    onChange(value + commitAll(imeState) + p);
    setImeState(createImeState());
    setPage(0);
  };

  const keypadEnter = () => {
    if (isConverting) applyAction({ type: "enter" });
    else if (multiline) insertAtCaret("\n");
    else onSubmit?.();
  };

  const handleSelectCandidate = (indexInCurrentPage: number) => {
    const globalIndex = currentPage * PAGE_SIZE + indexInCurrentPage;
    applyAction({ type: "select", index: globalIndex });
    // 入力欄にフォーカスを戻す
    if (multiline) {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  };

  // 表示用テキスト（未確定ピンインをキャレット直後または末尾にアンダーライン表示）
  const displayValue = value;
  // 右上の「拼 中」ボタンに文字が隠れないよう、右側を空ける（Tailwind では pr が px より優先される）
  const inputClassName = showImeToggle ? `${className ?? ""} pr-20` : className;

  return (
    <div className="relative w-full">
      <div className="relative">
        {multiline ? (
          <textarea
            ref={textareaRef}
            rows={rows}
            maxLength={maxLength}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // 候補選択クリックを妨げないよう遅延
              setTimeout(() => setIsFocused(false), 200);
            }}
            disabled={disabled}
            placeholder={placeholder}
            autoFocus={autoFocus}
            lang="zh-CN"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode={useKeypad ? "none" : undefined}
            className={inputClassName}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            maxLength={maxLength}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 200);
            }}
            disabled={disabled}
            placeholder={placeholder}
            autoFocus={autoFocus}
            lang="zh-CN"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode={useKeypad ? "none" : undefined}
            className={inputClassName}
          />
        )}

        {/* IME モード表示・切替バッジ */}
        {showImeToggle && (
          <div className="absolute right-2 top-2 flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleIme}
              className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
                imeEnabled
                  ? "bg-tealblue-600 text-white dark:bg-tealblue-500"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
              title="クリックまたは Ctrl+Space / Shift+Space で切替"
            >
              拼 {imeEnabled ? "中" : "英"}
            </button>
          </div>
        )}
      </div>

      {/* 変換中候補ウィンドウ（ポップオーバー） */}
      {isConverting && isFocused && (
        <div
          role="region"
          aria-label="ピンイン変換候補"
          className="mt-1.5 w-full rounded-xl border border-tealblue-300 bg-white p-3 shadow-lg transition-all dark:border-tealblue-700 dark:bg-zinc-900"
        >
          {/* ピンイン音節区切り表示 */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 text-xs dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-tealblue-700 dark:text-tealblue-300">
              <span className="font-semibold text-zinc-400 dark:text-zinc-500">拼音:</span>
              {/* 声調記号が見えるよう、正規化した音節ではなく入力したままの文字で区切って出す */}
              <span
                lang="zh-Latn-pinyin"
                className="rounded bg-tealblue-50 px-1.5 py-0.5 font-bold dark:bg-tealblue-950/50"
              >
                {imeState.segments.map((s) => imeState.rawInput.slice(s.start, s.end)).join("'") ||
                  imeState.rawInput}
              </span>
            </div>
            {totalPages > 1 && (
              <div className="text-zinc-400 dark:text-zinc-500">
                {currentPage + 1} / {totalPages}
              </div>
            )}
          </div>

          {/* 候補一覧 */}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {pagedCandidates.length > 0 ? (
              pagedCandidates.map((c: CandidateItem, idx: number) => {
                const globalIdx = currentPage * PAGE_SIZE + idx;
                const isSelected = globalIdx === imeState.selectedIndex;
                return (
                  <button
                    key={`${c.text}-${idx}`}
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectCandidate(idx)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all ${
                      isSelected
                        ? "bg-tealblue-600 font-bold text-white shadow-sm ring-2 ring-tealblue-400 dark:bg-tealblue-500"
                        : "border border-zinc-200 bg-zinc-50 font-medium text-zinc-800 hover:border-tealblue-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-tealblue-500"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isSelected ? "text-tealblue-100" : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {idx + 1}.
                    </span>
                    <span lang="zh-CN" className="text-base tracking-wide">
                      {c.text}
                    </span>
                    {c.kind === "sentence" && (
                      <span
                        className={`rounded px-1 text-[10px] ${
                          isSelected
                            ? "bg-tealblue-700 text-tealblue-100"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        文
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                候補が見つかりません（Enterでアルファベットのまま確定）
              </span>
            )}
          </div>

          {/* 候補ナビゲーション & ショートカット説明 */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
            <div className={`flex-wrap gap-x-3 gap-y-1 ${useKeypad ? "hidden" : "flex"}`}>
              {KEY_HINTS.map(([keys, label]) => (
                <span key={label}>
                  <kbd className="rounded border bg-zinc-100 px-1 dark:border-zinc-700 dark:bg-zinc-800">
                    {keys}
                  </kbd>{" "}
                  {label}
                </span>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded px-1 text-xs hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                >
                  ◀
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded px-1 text-xs hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {useKeypad && isFocused && (
        <PinyinKeypad
          onChar={(ch) => applyAction({ type: "char", char: ch })}
          onTone={(tone: KeypadTone) => applyAction({ type: "set_tone", tone })}
          onPunctuation={keypadPunctuation}
          onBackspace={keypadBackspace}
          onSpace={() => (isConverting ? applyAction({ type: "space" }) : insertAtCaret(" "))}
          onEnter={keypadEnter}
          enterLabel={multiline ? "改行" : "決定"}
          disabled={disabled}
        />
      )}

      {/* ü・声調記号付きの母音のボタン。押しても入力欄のフォーカス（=ソフトウェアキーボード）が外れないよう
          mousedown の既定動作を止める。キーパッドを出しているあいだはキーパッドで入力する */}
      <div className={`mt-3 flex-wrap justify-center gap-1.5 ${useKeypad ? "hidden" : "flex"}`}>
        {PINYIN_TOOLBAR_CHARS.map((ch) => (
          <button
            key={ch}
            type="button"
            tabIndex={-1}
            lang="zh-Latn-pinyin"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertToolbarChar(ch)}
            disabled={disabled}
            className="h-10 w-10 rounded-xl border border-zinc-300 bg-white text-base font-semibold text-zinc-700 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 active:scale-95 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-tealblue-500 dark:hover:text-tealblue-300"
          >
            {ch}
          </button>
        ))}
      </div>

      {/* ガイドテキスト */}
      {hintText && !isConverting && (
        <div className="mt-2 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {hintText}
        </div>
      )}
    </div>
  );
}
