"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpecialCharPalette } from "@/components/learn/SpecialCharPalette";

// 文法表データの型定義
export type GrammarTableRow = {
  label: string;
  cells: GrammarTableCell[];
};

export type GrammarTableCell = {
  value: string;
  colSpan: number;
};

export type GrammarTableData = {
  categoryKey: string;
  categoryTitle: string;
  headers: string[];
  rows: GrammarTableRow[];
};

// アルファベット基本文字とアクセント付き特殊文字の対応マップ
const ACCENT_MAP: Record<string, string[]> = {
  a: ["a", "á"],
  e: ["e", "é"],
  i: ["i", "í"],
  o: ["o", "ó"],
  u: ["u", "ú", "ü"],
  n: ["n", "ñ"],
  A: ["A", "Á"],
  E: ["E", "É"],
  I: ["I", "Í"],
  O: ["O", "Ó"],
  U: ["U", "Ú", "Ü"],
  N: ["N", "Ñ"],
};

// 逆引きルックアップ用マップ
const ACCENT_GROUP_KEY: Record<string, string> = {};
for (const [base, list] of Object.entries(ACCENT_MAP)) {
  for (const char of list) {
    ACCENT_GROUP_KEY[char] = base;
  }
}

/**
 * 矢印キー操作によりアクセント記号を順次切り替える関数
 */
function cycleChar(char: string, direction: "up" | "down"): string {
  const groupKey = ACCENT_GROUP_KEY[char];
  if (!groupKey) return char;
  const list = ACCENT_MAP[groupKey];
  if (!list) return char;
  const currentIndex = list.indexOf(char);
  if (currentIndex === -1) return char;

  const delta = direction === "up" ? 1 : -1;
  const nextIndex = (currentIndex + delta + list.length) % list.length;
  return list[nextIndex];
}

const SPECIAL_KEYS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

// 空欄割合の選択肢 (パーセント)
export type BlankRatioOption = "25" | "50" | "75" | "100";

export default function SpanishTablePractice({ tables }: { tables: GrammarTableData[] }) {
  // カテゴリ選択状態（"all" または 各カテゴリのタイトル）
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  // 学習内容の先頭位置（カテゴリ選択後の自動スクロール先）
  const contentRef = useRef<HTMLDivElement>(null);
  // 空欄の指定割合（25%, 50%, 75%, 100%）
  const [blankRatio, setBlankRatio] = useState<BlankRatioOption>("50");

  // 空欄対象セルのマスクマップ: key = `${tableIndex}-${rowIndex}-${colIndex}` -> boolean
  const [blankMask, setBlankMask] = useState<Record<string, boolean>>({});

  // 入力グリッドの回答データ保持: key = `${tableIndex}-${rowIndex}-${colIndex}` -> value
  const [gridAnswers, setGridAnswers] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);

  // 現在フォーカス中の入力欄のキー
  const [activeInputKey, setActiveInputKey] = useState<string | null>(null);

  // 各入力欄への参照を保持するMap
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // 初回マウント参照
  const isMountedRef = useRef(false);

  // 選択フィルタリング後のテーブル一覧
  const filteredTables = tables.filter(
    (t) => selectedCategory === "all" || t.categoryTitle === selectedCategory,
  );

  /**
   * 選択された割合に応じて、空欄にするセルをランダムに選出するマスク作成関数
   */
  const generateBlankMask = useCallback(
    (targetTables: GrammarTableData[], ratioStr: BlankRatioOption) => {
      const ratio = parseInt(ratioStr, 10) / 100;
      const mask: Record<string, boolean> = {};

      const allKeys: string[] = [];
      targetTables.forEach((table, tIdx) => {
        table.rows.forEach((row, rIdx) => {
          row.cells.forEach((_, cIdx) => {
            allKeys.push(`${tIdx}-${rIdx}-${cIdx}`);
          });
        });
      });

      if (ratioStr === "100") {
        allKeys.forEach((k) => {
          mask[k] = true;
        });
      } else {
        // 対象のキーをランダムにシャッフルし、指定割合分を true（空欄）に設定
        const keysCopy = [...allKeys];
        for (let i = keysCopy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [keysCopy[i], keysCopy[j]] = [keysCopy[j], keysCopy[i]];
        }
        const blankCount = Math.max(1, Math.round(allKeys.length * ratio));
        keysCopy.slice(0, blankCount).forEach((k) => {
          mask[k] = true;
        });
      }

      return mask;
    },
    [],
  );

  /**
   * 演習のリセット処理
   */
  const resetPractice = useCallback(
    (cat: string, ratio: BlankRatioOption = blankRatio) => {
      const tList = tables.filter((t) => cat === "all" || t.categoryTitle === cat);
      const newMask = generateBlankMask(tList, ratio);
      setBlankMask(newMask);
      setGridAnswers({});
      setIsChecked(false);
    },
    [tables, blankRatio, generateBlankMask],
  );

  // マウント時にランダム空欄マスクを生成
  useEffect(() => {
    if (!isMountedRef.current && tables.length > 0) {
      isMountedRef.current = true;
      resetPractice("all", "50");
    }
  }, [tables, resetPractice]);

  /**
   * セルに入力があったときの更新処理
   */
  const handleCellChange = (cellKey: string, value: string) => {
    setGridAnswers((prev) => ({
      ...prev,
      [cellKey]: value,
    }));
  };

  /**
   * 答え合わせ実行処理
   */
  const handleCheckAnswers = () => {
    setIsChecked(true);
  };

  /**
   * カテゴリ切替処理
   */
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    resetPractice(cat, blankRatio);
    // 設定パネルが長いと画面が切り替わったことに気付きにくいので、描画後に学習内容の位置までスクロールする
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  /**
   * 空欄割合変更処理
   */
  const handleBlankRatioChange = (ratio: BlankRatioOption) => {
    setBlankRatio(ratio);
    resetPractice(selectedCategory, ratio);
  };

  /**
   * 入力キーボードイベント（↑ / ↓ 矢印キーでアクセント変換、Enterキーで次の空欄へ移動または再挑戦）
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    cellKey: string,
    currentValue: string,
  ) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const input = inputRefs.current.get(cellKey);
      if (!input || !currentValue) return;

      const selStart = input.selectionStart ?? currentValue.length;

      let targetIdx = -1;
      for (let i = Math.min(selStart - 1, currentValue.length - 1); i >= 0; i--) {
        if (ACCENT_GROUP_KEY[currentValue[i]]) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx === -1) {
        for (let i = selStart; i < currentValue.length; i++) {
          if (ACCENT_GROUP_KEY[currentValue[i]]) {
            targetIdx = i;
            break;
          }
        }
      }

      if (targetIdx !== -1) {
        const charToCycle = currentValue[targetIdx];
        const newChar = cycleChar(charToCycle, e.key === "ArrowUp" ? "up" : "down");
        const newVal =
          currentValue.slice(0, targetIdx) + newChar + currentValue.slice(targetIdx + 1);

        handleCellChange(cellKey, newVal);

        requestAnimationFrame(() => {
          const updatedInput = inputRefs.current.get(cellKey);
          if (updatedInput) {
            updatedInput.setSelectionRange(selStart, selStart);
          }
        });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (!isChecked) {
        const idx = orderedBlankKeys.indexOf(cellKey);
        const nextKey = idx !== -1 ? orderedBlankKeys[idx + 1] : undefined;
        if (nextKey) {
          inputRefs.current.get(nextKey)?.focus();
        } else {
          inputRefs.current.get(cellKey)?.blur();
        }
      } else {
        resetPractice(selectedCategory, blankRatio);
      }
    }
  };

  // 答え合わせ状態でのEnterキーサポート
  useEffect(() => {
    if (!isChecked) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (e.isComposing) return;
        e.preventDefault();
        resetPractice(selectedCategory, blankRatio);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isChecked, resetPractice, selectedCategory, blankRatio]);

  /**
   * 特殊文字ボタンクリックでアクティブな入力欄へ文字挿入
   */
  const handleInsertSpecialChar = (char: string) => {
    if (!activeInputKey) return;
    const input = inputRefs.current.get(activeInputKey);
    const val = gridAnswers[activeInputKey] || "";
    const selStart = input?.selectionStart ?? val.length;
    const selEnd = input?.selectionEnd ?? val.length;

    const newVal = val.slice(0, selStart) + char + val.slice(selEnd);
    handleCellChange(activeInputKey, newVal);

    requestAnimationFrame(() => {
      if (input) {
        input.focus();
        const newPos = selStart + char.length;
        input.setSelectionRange(newPos, newPos);
      }
    });
  };

  if (!tables || tables.length === 0) {
    return (
      <div className="my-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-base text-zinc-500 dark:text-zinc-400">
          文法表データが見つかりませんでした。
        </p>
      </div>
    );
  }

  // Enterキーでの次項目移動用: 空欄対象セルキーを表示順に並べたリスト
  const orderedBlankKeys: string[] = [];
  filteredTables.forEach((table, tIdx) => {
    table.rows.forEach((row, rIdx) => {
      row.cells.forEach((_, cIdx) => {
        const key = `${tIdx}-${rIdx}-${cIdx}`;
        if (blankMask[key]) orderedBlankKeys.push(key);
      });
    });
  });

  // 正解数の計算 (空欄対象に指定されたセルのみを計算)
  let totalBlankCells = 0;
  let correctCount = 0;
  filteredTables.forEach((table, tIdx) => {
    table.rows.forEach((row, rIdx) => {
      row.cells.forEach((cell, cIdx) => {
        const key = `${tIdx}-${rIdx}-${cIdx}`;
        if (blankMask[key]) {
          totalBlankCells += 1;
          const userVal = (gridAnswers[key] || "").trim().toLowerCase();
          if (userVal === cell.value.trim().toLowerCase()) {
            correctCount += 1;
          }
        }
      });
    });
  });

  return (
    <div className="my-8 rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* 設定・カテゴリ選択パネル */}
      <div className="mb-8 rounded-xl border border-zinc-100 bg-zinc-50/90 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* カテゴリ選択 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              カテゴリ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleCategoryChange("all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  selectedCategory === "all"
                    ? "bg-teal-600 text-white shadow-sm dark:bg-teal-500"
                    : "bg-white text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                全カテゴリ
              </button>
              {tables.map((t) => (
                <button
                  key={t.categoryTitle}
                  type="button"
                  onClick={() => handleCategoryChange(t.categoryTitle)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    selectedCategory === t.categoryTitle
                      ? "bg-teal-600 text-white shadow-sm dark:bg-teal-500"
                      : "bg-white text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t.categoryTitle}
                </button>
              ))}
            </div>
          </div>

          {/* 空欄割合選択 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              空欄の割合:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "25%", value: "25" },
                { label: "50%", value: "50" },
                { label: "75%", value: "75" },
                { label: "100%", value: "100" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleBlankRatioChange(opt.value as BlankRatioOption)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    blankRatio === opt.value
                      ? "bg-teal-600 text-white shadow-sm dark:bg-teal-500"
                      : "bg-white text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 特殊文字ボタンパレット */}
      <SpecialCharPalette
        chars={SPECIAL_KEYS}
        onInsert={handleInsertSpecialChar}
        hint={
          <>
            💡 入力セルで <strong>↑ / ↓ 矢印キー</strong> を押してもアクセント記号（á, é, í, ó, ú, ñ
            など）へ切り替えられます。
          </>
        }
      />

      {/* 文法表完成グリッド */}
      <div ref={contentRef} className="scroll-mt-24" />

      <div className="flex flex-col gap-10">
        {filteredTables.map((table, tIdx) => (
          <div key={table.categoryTitle} className="overflow-x-auto">
            <h3 className="mb-4 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              【{table.categoryTitle}】
            </h3>
            {/* スマホでは表が潰れて入力しづらいので、最小幅を確保して横スクロールさせる */}
            <p className="mb-2 text-xs text-zinc-500 sm:hidden dark:text-zinc-400">
              ← 表は横にスクロールできます →
            </p>
            <table className="w-full min-w-[600px] border-collapse rounded-2xl border border-zinc-200 text-left text-base dark:border-zinc-800">
              <thead>
                <tr className="bg-zinc-100/80 dark:bg-zinc-900">
                  {table.headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="border border-zinc-200 p-2.5 font-bold sm:p-3.5 text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="border border-zinc-200 p-2.5 font-bold sm:p-3.5 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 bg-zinc-50/30 dark:bg-zinc-900/30">
                      {row.label}
                    </td>
                    {row.cells.map((cell, cIdx) => {
                      const key = `${tIdx}-${rIdx}-${cIdx}`;
                      const isBlankTarget = blankMask[key];
                      const val = gridAnswers[key] || "";
                      const isCellCorrect =
                        isChecked && val.trim().toLowerCase() === cell.value.trim().toLowerCase();
                      const isCellWrong = isChecked && isBlankTarget && !isCellCorrect;

                      return (
                        <td
                          key={cIdx}
                          colSpan={cell.colSpan}
                          className="border border-zinc-200 p-1.5 sm:p-2.5 dark:border-zinc-800"
                        >
                          {isBlankTarget ? (
                            <div className="flex flex-col gap-1">
                              <input
                                ref={(el) => {
                                  if (el) inputRefs.current.set(key, el);
                                  else inputRefs.current.delete(key);
                                }}
                                type="text"
                                value={val}
                                disabled={isChecked}
                                onFocus={() => setActiveInputKey(key)}
                                onChange={(e) => handleCellChange(key, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, key, val)}
                                placeholder="..."
                                className={`w-full rounded-xl border-2 px-3 py-2 text-base font-semibold outline-none transition-colors dark:bg-zinc-900 dark:text-zinc-50 ${
                                  isChecked
                                    ? isCellCorrect
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                                      : "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
                                    : "border-zinc-300 bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 dark:border-zinc-700 dark:focus:border-teal-400"
                                }`}
                              />
                              {isCellWrong && (
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                  正解: {cell.value}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-2 block font-semibold text-zinc-800 dark:text-zinc-200">
                              {cell.value}
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
        ))}
      </div>

      {/* スコア・結果表示バッジ & 操作ボタンエリア */}
      <div className="mt-10 flex flex-col items-center gap-6">
        {isChecked && (
          <div className="w-full max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center font-medium text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200">
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              答え合わせ結果:{" "}
              <span className="text-teal-600 dark:text-teal-400 text-3xl font-black">
                {correctCount}
              </span>{" "}
              / {totalBlankCells} 空欄正解 (
              {totalBlankCells > 0 ? Math.round((correctCount / totalBlankCells) * 100) : 0}%)
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          {!isChecked ? (
            <button
              type="button"
              onClick={handleCheckAnswers}
              className="rounded-2xl bg-teal-600 px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              答え合わせ
            </button>
          ) : (
            <button
              type="button"
              onClick={() => resetPractice(selectedCategory, blankRatio)}
              className="rounded-2xl bg-teal-600 px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              もう一度挑戦する
            </button>
          )}
          <button
            type="button"
            onClick={() => resetPractice(selectedCategory, blankRatio)}
            className="rounded-2xl border-2 border-zinc-200 px-6 py-3.5 text-base font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  );
}
