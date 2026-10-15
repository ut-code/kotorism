"use client";

import { useMemo, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { buildAccentIndex, cycleAccent } from "@/lib/accent";

interface AccentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  // 入力する言語（HTML の lang 属性）
  lang?: string;
  // 例: フランス語なら [["e","é","è","ê","ë"], ...]、スペイン語なら [["a","á"], ...]
  accentCycles: string[][];
  // 入力欄の下に並べる、クリックで直接入力できるボタンの文字一覧
  toolbarChars: string[];
  // 入力欄の下に表示する操作ヒント（省略時はアクセント記号向けの既定文言）
  hintText?: ReactNode;
  // 2文字の組み合わせを1文字に置き換える。キー: 「直前の文字 + 押したキー」、値: 置換後の文字。
  // 例: { "u\\": "ü" } なら、u を打った直後に \ を打つと ü になる
  chordReplacements?: Record<string, string>;
}

export function AccentInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  autoFocus,
  className,
  lang,
  accentCycles,
  toolbarChars,
  hintText,
  chordReplacements,
}: AccentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 大文字・小文字を問わず、どの文字がどのサイクルの何番目かを引けるように索引化する
  const accentIndex = useMemo(() => buildAccentIndex(accentCycles), [accentCycles]);
  const nextAccentChar = (ch: string | undefined) => cycleAccent(accentIndex, ch, 1);
  const prevAccentChar = (ch: string | undefined) => cycleAccent(accentIndex, ch, -1);

  // カーソル直前の文字をサイクルさせる。切り替えられた場合はtrueを返す（呼び出し側でpreventDefaultするかどうかの判断に使う）
  const applyCycledChar = (getChar: (ch: string | undefined) => string | null): boolean => {
    const input = inputRef.current;
    if (!input) return false;
    const caret = input.selectionStart;
    // 選択範囲がある場合や先頭にいる場合は、通常のカーソル移動に任せる
    if (caret === null || caret !== input.selectionEnd || caret === 0) return false;

    const nextChar = getChar(value[caret - 1]);
    if (!nextChar) return false;

    onChange(value.slice(0, caret - 1) + nextChar + value.slice(caret));
    requestAnimationFrame(() => {
      input.setSelectionRange(caret, caret);
    });
    return true;
  };

  // カーソル直前の文字と押したキーの組み合わせが chordReplacements に一致すれば、
  // その2文字を置換後の文字に差し替える。差し替えた場合はtrueを返す
  const applyChordReplacement = (key: string): boolean => {
    if (!chordReplacements) return false;
    const input = inputRef.current;
    if (!input) return false;
    const caret = input.selectionStart;
    if (caret === null || caret !== input.selectionEnd || caret === 0) return false;

    const prev = value[caret - 1];
    const replacement = chordReplacements[prev + key];
    if (replacement === undefined) return false;

    onChange(value.slice(0, caret - 1) + replacement + value.slice(caret));
    const nextCaret = caret - 1 + replacement.length;
    requestAnimationFrame(() => {
      input.setSelectionRange(nextCaret, nextCaret);
    });
    return true;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit?.();
      return;
    }
    if (disabled) return;

    if (e.key.length === 1 && applyChordReplacement(e.key)) {
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowUp") {
      if (applyCycledChar(nextAccentChar)) e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      if (applyCycledChar(prevAccentChar)) e.preventDefault();
      return;
    }
  };

  const insertChar = (ch: string) => {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? value.length;
    onChange(value.slice(0, caret) + ch + value.slice(caret));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(caret + 1, caret + 1);
    });
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="text"
        lang={lang}
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={className}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {toolbarChars.map((ch) => (
          <button
            key={ch}
            type="button"
            tabIndex={-1}
            onClick={() => insertChar(ch)}
            disabled={disabled}
            className="h-8 w-8 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-600 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-tealblue-500 dark:hover:text-tealblue-400"
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {hintText ?? (
          <>
            ヒント: アルファベットを入力した直後に ↑キーを押すと、{accentCycles[0]?.join(" → ")}
            のようにアクセント記号付きの文字へ切り替えられます（↓キーで逆順）。上のボタンから直接入力することもできます。
          </>
        )}
      </div>
    </div>
  );
}
