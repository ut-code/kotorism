import { useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { AccentKeyHint } from "@/components/practice/SpecialCharPalette";
import { buildAccentIndex, cycleCharBeforeCaret, insertAtSelection } from "@/lib/shared/accent";
import type { TextEdit } from "@/lib/shared/accent";
import type { PracticeLanguage } from "@/lib/shared/practice-languages";

interface AccentTextareaProps {
  value: string;
  onChange: (value: string) => void;
  // 特殊文字の入力補助を付ける言語。省略すると普通の入力欄になる（中国語・日本語など）
  language?: PracticeLanguage;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// 作文・翻訳の複数行の入力欄。フランス語・ドイツ語・スペイン語では、文字を入力した直後の
// ↑ / ↓ キーでアクセント記号付きの文字に切り替えられ、下のボタンから特殊文字を直接入力できる
export function AccentTextarea({
  value,
  onChange,
  language,
  maxLength,
  rows,
  disabled,
  placeholder,
  className,
}: AccentTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 複数行の入力欄では ↑ / ↓ は行の移動にも使うので、文字を入力した直後（とその切り替え中）だけ
  // 特殊文字の切り替えに使う。カーソルを動かしたりクリックしたりすると解除する
  const cyclingRef = useRef(false);
  const accentIndex = useMemo(() => buildAccentIndex(language?.accentCycles ?? []), [language]);

  const applyEdit = (edit: TextEdit, focus = false) => {
    const textarea = textareaRef.current;
    onChange(edit.value);
    requestAnimationFrame(() => {
      if (focus) textarea?.focus();
      textarea?.setSelectionRange(edit.caret, edit.caret);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!language || e.nativeEvent.isComposing) return;

    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && cyclingRef.current) {
      const textarea = e.currentTarget;
      const caret = textarea.selectionStart;
      if (caret === textarea.selectionEnd) {
        const edit = cycleCharBeforeCaret(accentIndex, value, caret, e.key === "ArrowUp" ? 1 : -1);
        if (edit) {
          e.preventDefault();
          applyEdit(edit);
          return;
        }
      }
    }
    // 修飾キーだけの押下では状態を変えない（Shift を押しながら大文字を打つ場合など）
    if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
    cyclingRef.current = e.key.length === 1 && !e.ctrlKey && !e.metaKey;
  };

  // ボタンで、カーソル位置（選択範囲があれば置き換え）に文字を入れる
  const insertChar = (char: string) => {
    if (disabled) return;
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const edit = insertAtSelection(value, start, end, char);
    if (maxLength !== undefined && edit.value.length > maxLength) return;
    cyclingRef.current = true;
    applyEdit(edit, true);
  };

  return (
    <div>
      <textarea
        ref={textareaRef}
        lang={language?.lang}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onMouseDown={() => {
          cyclingRef.current = false;
        }}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={language ? false : undefined}
        className={className}
      />
      {language && (
        <>
          {/* 押しても入力欄のフォーカス（=ソフトウェアキーボード）が外れないよう mousedown の既定動作を止める */}
          <div
            role="group"
            aria-label="特殊文字"
            className="mt-2 flex flex-wrap justify-center gap-1.5"
          >
            {language.specialChars.map((char) => (
              <button
                key={char}
                type="button"
                tabIndex={-1}
                lang={language.lang}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertChar(char)}
                disabled={disabled}
                className="h-10 w-10 rounded-xl border border-zinc-300 bg-white text-base font-semibold text-zinc-700 transition-colors hover:border-tealblue-400 hover:text-tealblue-700 active:scale-95 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-tealblue-500 dark:hover:text-tealblue-300"
              >
                {char}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            <AccentKeyHint language={language} />
            上のボタンから直接入力することもできます。
          </p>
        </>
      )}
    </div>
  );
}
