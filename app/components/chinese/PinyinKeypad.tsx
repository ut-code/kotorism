const LETTER_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// 声調ボタン（最後の音節に付ける）。0 は軽声（記号を外す）
const TONES = [
  { tone: 1, mark: "ˉ", label: "最後の音節を第1声にする" },
  { tone: 2, mark: "ˊ", label: "最後の音節を第2声にする" },
  { tone: 3, mark: "ˇ", label: "最後の音節を第3声にする" },
  { tone: 4, mark: "ˋ", label: "最後の音節を第4声にする" },
  { tone: 0, mark: "・", label: "最後の音節を軽声にする" },
] as const;

const PUNCTUATION = ["，", "。", "？", "！", "、"];

export type KeypadTone = (typeof TONES)[number]["tone"];

interface PinyinKeypadProps {
  onChar: (ch: string) => void;
  onTone: (tone: KeypadTone) => void;
  onPunctuation: (p: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter: () => void;
  enterLabel: string;
  disabled?: boolean;
}

const keyClass =
  "h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white text-base font-semibold text-zinc-700 active:scale-95 active:bg-tealblue-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:active:bg-tealblue-950";

// スマホで OS のキーボードの代わりに出す、ピンイン入力用のキーパッド。
// 押しても入力欄のフォーカスが外れないよう mousedown の既定動作を止める
export function PinyinKeypad({
  onChar,
  onTone,
  onPunctuation,
  onBackspace,
  onSpace,
  onEnter,
  enterLabel,
  disabled,
}: PinyinKeypadProps) {
  return (
    <div
      role="group"
      aria-label="ピンイン入力キーパッド"
      onMouseDown={(e) => e.preventDefault()}
      className="mt-3 flex flex-col gap-1.5 rounded-xl bg-zinc-100 p-1.5 select-none dark:bg-zinc-800"
    >
      <div className="flex gap-1">
        {TONES.map(({ tone, mark, label }) => (
          <button
            key={tone}
            type="button"
            tabIndex={-1}
            aria-label={label}
            disabled={disabled}
            onClick={() => onTone(tone)}
            className={`${keyClass} text-tealblue-700 dark:text-tealblue-300`}
          >
            {mark}
          </button>
        ))}
      </div>
      {LETTER_ROWS.map((row, i) => (
        <div key={row} className="flex gap-1">
          {i === 2 && (
            <button
              type="button"
              tabIndex={-1}
              lang="zh-Latn-pinyin"
              disabled={disabled}
              onClick={() => onChar("ü")}
              className={keyClass}
            >
              ü
            </button>
          )}
          {[...row].map((ch) => (
            <button
              key={ch}
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={() => onChar(ch)}
              className={keyClass}
            >
              {ch}
            </button>
          ))}
          {i === 2 && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="1文字消す"
              disabled={disabled}
              onClick={onBackspace}
              className={keyClass}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-1">
        <button
          type="button"
          tabIndex={-1}
          aria-label="音節の区切り"
          disabled={disabled}
          onClick={() => onChar("'")}
          className={keyClass}
        >
          '
        </button>
        {PUNCTUATION.map((p) => (
          <button
            key={p}
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => onPunctuation(p)}
            className={keyClass}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={onSpace}
          className={`${keyClass} flex-[2] text-sm`}
        >
          確定/空白
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={onEnter}
          className={`${keyClass} flex-[1.5] text-sm`}
        >
          {enterLabel}
        </button>
      </div>
    </div>
  );
}
