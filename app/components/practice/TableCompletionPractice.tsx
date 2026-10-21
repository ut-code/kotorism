import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { loadGrammarTables } from "@/components/practice/data";
import {
  CollapsibleChoice,
  EmptyPractice,
  PracticeButton,
  ScoreSummary,
  type ChoiceOption,
} from "@/components/practice/PracticeControls";
import { SpecialCharPalette } from "@/components/practice/SpecialCharPalette";
import { buildAccentIndex, cycleAccent } from "@/lib/shared/accent";
import { splitLabel } from "@/lib/shared/practice-data";
import { PRACTICE_LANGUAGES, type PracticeLanguageSlug } from "@/lib/shared/practice-languages";

type BlankRatio = "25" | "50" | "75" | "100";

const RATIO_OPTIONS: ChoiceOption<BlankRatio>[] = [
  { value: "25", label: "25%" },
  { value: "50", label: "50%" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
];

// セルを一意に表すキー（表の番号は、絞り込む前の全表での番号）
const cellKey = (table: number, row: number, col: number) => `${table}-${row}-${col}`;

const normalize = (s: string) => s.trim().toLowerCase();

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 表の見出し。「1格 (〜は)」の補足は小さく2行目に出し、日本語が語の途中で折り返さないようにする
function Label({ text }: { text: string }) {
  const { main, sub } = splitLabel(text);
  return (
    <>
      <span className="block whitespace-nowrap">{main}</span>
      {sub && (
        <span className="block whitespace-nowrap text-xs font-normal text-zinc-500 dark:text-zinc-400">
          {sub}
        </span>
      )}
    </>
  );
}

// 表完成演習。文法表の一部のセルを空欄にし、埋めて答え合わせする。
// 出題データはこのセクションの MDX にある表から読み取り、表の上の見出し（###）を表の名前にする
export default function TableCompletionPractice({
  language,
  section,
}: {
  language: PracticeLanguageSlug;
  section: string;
}) {
  const lang = PRACTICE_LANGUAGES[language];
  const tables = useMemo(() => loadGrammarTables(language, section), [language, section]);
  const accentIndex = useMemo(() => buildAccentIndex(lang.accentCycles), [lang]);

  // "all" または表の名前
  const [category, setCategory] = useState("all");
  const [ratio, setRatio] = useState<BlankRatio>("50");
  // 空欄にするセルのキー。乱数で選ぶため、表示が確定してから作る（それまでは null）
  const [blanks, setBlanks] = useState<Set<string> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  // カテゴリを選んだあとのスクロール先（表の先頭）
  const contentRef = useRef<HTMLDivElement>(null);

  const visible = tables
    .map((table, index) => ({ table, index }))
    .filter(({ table }) => category === "all" || table.title === category);

  // 表示順に並べたセルのキー
  const visibleKeys = visible.flatMap(({ table, index }) =>
    table.rows.flatMap((row, r) => row.cells.map((_, c) => cellKey(index, r, c))),
  );
  const answerOf = (key: string) => {
    const [t, r, c] = key.split("-").map(Number);
    return tables[t]?.rows[r]?.cells[c]?.value ?? "";
  };
  const isCorrect = (key: string) => normalize(answers[key] ?? "") === normalize(answerOf(key));

  const makeBlanks = (keys: string[], blankRatio: BlankRatio) => {
    const count =
      blankRatio === "100"
        ? keys.length
        : Math.max(1, Math.round((keys.length * Number(blankRatio)) / 100));
    return new Set(shuffle(keys).slice(0, count));
  };

  const keysFor = (cat: string) =>
    tables.flatMap((table, index) =>
      cat === "all" || table.title === cat
        ? table.rows.flatMap((row, r) => row.cells.map((_, c) => cellKey(index, r, c)))
        : [],
    );

  const restart = (cat: string, blankRatio: BlankRatio) => {
    setBlanks(makeBlanks(keysFor(cat), blankRatio));
    setAnswers({});
    setChecked(false);
  };

  useEffect(() => {
    setBlanks(makeBlanks(keysFor("all"), "50"));
    // 初回の空欄は表示が確定したときに1回だけ作る
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [tables]);

  const changeCategory = (cat: string) => {
    setCategory(cat);
    restart(cat, ratio);
    // 設定の下にある表へ切り替わったことに気付きやすいよう、表の先頭までスクロールする
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const changeRatio = (value: BlankRatio) => {
    setRatio(value);
    restart(category, value);
  };

  // 間違えた空欄だけを空欄にし直す（正解した欄は答えを表示したままにする）
  const retryWrong = () => {
    if (!blanks) return;
    const wrong = [...blanks].filter((key) => !isCorrect(key));
    setBlanks(new Set(wrong));
    setAnswers((prev) => {
      const next = { ...prev };
      for (const key of wrong) delete next[key];
      return next;
    });
    setChecked(false);
    requestAnimationFrame(() => {
      const first = visibleKeys.find((key) => wrong.includes(key));
      if (first) inputRefs.current.get(first)?.focus();
    });
  };

  const setAnswer = (key: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const blankKeys = blanks ? visibleKeys.filter((key) => blanks.has(key)) : [];

  // ↑ / ↓ でカーソル直前の文字を特殊文字に切り替える。Enter で次の空欄へ進む
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, key: string) => {
    if (e.nativeEvent.isComposing) return;
    const input = e.currentTarget;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const caret = input.selectionStart;
      if (caret === null || caret !== input.selectionEnd || caret === 0) return;
      const value = answers[key] ?? "";
      const next = cycleAccent(accentIndex, value[caret - 1], e.key === "ArrowUp" ? 1 : -1);
      if (!next) return;
      e.preventDefault();
      setAnswer(key, value.slice(0, caret - 1) + next + value.slice(caret));
      requestAnimationFrame(() => input.setSelectionRange(caret, caret));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nextKey = blankKeys[blankKeys.indexOf(key) + 1];
      if (nextKey) inputRefs.current.get(nextKey)?.focus();
      else input.blur();
    }
  };

  // パレットのボタンで、選択中の入力欄のカーソル位置に文字を入れる
  const insertChar = (char: string) => {
    if (!activeKey || checked) return;
    const input = inputRefs.current.get(activeKey);
    const value = answers[activeKey] ?? "";
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    setAnswer(activeKey, value.slice(0, start) + char + value.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + char.length, start + char.length);
    });
  };

  if (tables.length === 0) {
    return <EmptyPractice>文法表のデータが見つかりませんでした。</EmptyPractice>;
  }

  const correctCount = blankKeys.filter(isCorrect).length;

  return (
    <div>
      <div className="space-y-5">
        <CollapsibleChoice
          title="出題範囲"
          options={[
            { value: "all", label: "すべて" },
            ...tables.map((t) => ({ value: t.title, label: t.title })),
          ]}
          value={category}
          onChange={changeCategory}
        />
        <CollapsibleChoice
          title="空欄の割合"
          options={RATIO_OPTIONS}
          value={ratio}
          onChange={changeRatio}
        />
      </div>

      <div ref={contentRef} className="mt-8 scroll-mt-24" />
      <SpecialCharPalette language={lang} onInsert={insertChar} />

      {blanks && (
        <div className="mt-8 flex flex-col gap-10">
          {visible.map(({ table, index: t }) => (
            <section key={table.title}>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{table.title}</h3>
              {/* スマホでは表が潰れて入力しづらいので、最小幅を確保して横スクロールさせる */}
              <p className="mt-1 text-xs text-zinc-500 sm:hidden dark:text-zinc-400">
                ← 表は横にスクロールできます →
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-base">
                  <thead>
                    <tr className="bg-zinc-100/80 dark:bg-zinc-900">
                      {table.headers.map((h, i) => (
                        <th
                          key={i}
                          className="border border-zinc-200 p-2.5 font-bold text-zinc-800 sm:p-3 dark:border-zinc-800 dark:text-zinc-200"
                        >
                          <Label text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, r) => (
                      <tr key={r}>
                        <th
                          scope="row"
                          className="border border-zinc-200 bg-zinc-50/50 p-2.5 font-bold text-zinc-900 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100"
                        >
                          <Label text={row.label} />
                        </th>
                        {row.cells.map((cell, c) => {
                          const key = cellKey(t, r, c);
                          if (!blanks.has(key)) {
                            return (
                              <td
                                key={c}
                                colSpan={cell.colSpan}
                                lang={lang.lang}
                                className="border border-zinc-200 px-4 py-2.5 font-semibold whitespace-nowrap text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                              >
                                {cell.value}
                              </td>
                            );
                          }
                          // 結合セルがあるので、列見出しの位置は左のセルの幅を足して求める
                          const column =
                            1 + row.cells.slice(0, c).reduce((sum, x) => sum + x.colSpan, 0);
                          const correct = checked && isCorrect(key);
                          const wrong = checked && !correct;
                          return (
                            <td
                              key={c}
                              colSpan={cell.colSpan}
                              className="border border-zinc-200 p-1.5 sm:p-2 dark:border-zinc-800"
                            >
                              <input
                                ref={(el) => {
                                  if (el) inputRefs.current.set(key, el);
                                  else inputRefs.current.delete(key);
                                }}
                                type="text"
                                lang={lang.lang}
                                autoComplete="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                aria-label={`${row.label} ${table.headers[column] ?? ""}`}
                                aria-invalid={wrong || undefined}
                                value={answers[key] ?? ""}
                                readOnly={checked}
                                onFocus={() => setActiveKey(key)}
                                onChange={(e) => setAnswer(key, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, key)}
                                className={`w-full min-w-24 rounded-xl border-2 px-3 py-2 text-base font-semibold outline-none transition-colors ${
                                  correct
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : wrong
                                      ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
                                      : "border-zinc-300 bg-white text-zinc-900 focus:border-tealblue-500 focus:ring-4 focus:ring-tealblue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-tealblue-400"
                                }`}
                              />
                              {correct && (
                                <span className="mt-1 block text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                  ○ 正解
                                </span>
                              )}
                              {wrong && (
                                <span className="mt-1 block text-xs font-bold whitespace-nowrap text-rose-700 dark:text-rose-400">
                                  ✕ 正解: <span lang={lang.lang}>{cell.value}</span>
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-8">
        {checked && <ScoreSummary correct={correctCount} total={blankKeys.length} unit="か所" />}
        <div className="flex flex-wrap justify-center gap-3">
          {checked ? (
            <>
              {correctCount < blankKeys.length && (
                <PracticeButton onClick={retryWrong}>間違えた空欄だけもう一度</PracticeButton>
              )}
              <PracticeButton
                variant={correctCount < blankKeys.length ? "secondary" : "primary"}
                onClick={() => restart(category, ratio)}
              >
                新しい空欄でもう一度
              </PracticeButton>
            </>
          ) : (
            <>
              <PracticeButton onClick={() => setChecked(true)} disabled={blankKeys.length === 0}>
                答え合わせ
              </PracticeButton>
              <PracticeButton variant="secondary" onClick={() => restart(category, ratio)}>
                空欄を選び直す
              </PracticeButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
