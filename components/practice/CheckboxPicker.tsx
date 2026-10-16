"use client";

import { useState } from "react";

// 出題する対象（動詞・漢字など）を複数選ぶ一覧。
// 「全て選択／全て解除」・グループごとの一括選択・検索での絞り込みができる。
// 絞り込み中は、表示されているものだけを一括で選択・解除する
export type PickerItem = {
  id: string;
  label: string;
  // ラベルの横に小さく出す補足（意味など）
  sub?: string;
  // 検索の対象にする文字列（省略時は label と sub）
  search?: string;
};

export function CheckboxPicker({
  title,
  unit,
  items,
  selected,
  onChange,
  groups,
  searchPlaceholder,
  labelLang,
  labelClassName = "font-medium",
  columnsClassName = "grid-cols-2 sm:grid-cols-3",
}: {
  title: string;
  // 「語」「字」など、選択数の単位
  unit: string;
  items: PickerItem[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  // まとめて選ぶためのグループ（例: 規則動詞・不規則動詞）
  groups?: { label: string; ids: string[] }[];
  // 指定したときだけ検索欄を出す
  searchPlaceholder?: string;
  // ラベルの言語（HTML の lang 属性）
  labelLang?: string;
  labelClassName?: string;
  columnsClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visible = normalizedQuery
    ? items.filter((item) =>
        (item.search ?? `${item.label} ${item.sub ?? ""}`).toLowerCase().includes(normalizedQuery),
      )
    : items;

  const setMany = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    onChange(next);
  };

  const linkClass = "font-semibold text-tealblue-600 hover:underline dark:text-tealblue-400";

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
          {title}
          <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            {selected.size} / {items.length} {unit}を選択中
          </span>
        </h3>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() =>
              setMany(
                visible.map((item) => item.id),
                true,
              )
            }
            className={linkClass}
          >
            {normalizedQuery ? "表示中を全て選択" : "全て選択"}
          </button>
          <button
            type="button"
            onClick={() =>
              setMany(
                visible.map((item) => item.id),
                false,
              )
            }
            className={linkClass}
          >
            {normalizedQuery ? "表示中を全て解除" : "全て解除"}
          </button>
        </div>
      </div>

      {groups && (
        <div className="mt-3 flex flex-wrap gap-2">
          {groups.map((group) => {
            const allSelected = group.ids.length > 0 && group.ids.every((id) => selected.has(id));
            return (
              <button
                key={group.label}
                type="button"
                onClick={() => setMany(group.ids, !allSelected)}
                aria-pressed={allSelected}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  allSelected
                    ? "border-tealblue-500 bg-tealblue-50 text-tealblue-700 dark:border-tealblue-400 dark:bg-tealblue-950/50 dark:text-tealblue-300"
                    : "border-zinc-200 text-zinc-600 hover:border-tealblue-300 hover:text-tealblue-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-tealblue-600 dark:hover:text-tealblue-300"
                }`}
              >
                {group.label}（{group.ids.length}）
              </button>
            );
          })}
        </div>
      )}

      {searchPlaceholder && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-tealblue-500 focus:ring-4 focus:ring-tealblue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      )}

      <div className={`mt-3 grid gap-2 ${columnsClassName}`}>
        {visible.map((item) => (
          <label
            key={item.id}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
              selected.has(item.id)
                ? "border-tealblue-500 bg-tealblue-50 dark:border-tealblue-400 dark:bg-tealblue-950/40"
                : "border-zinc-200 hover:border-tealblue-300 dark:border-zinc-700 dark:hover:border-tealblue-600"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => setMany([item.id], !selected.has(item.id))}
              className="h-4 w-4 shrink-0 accent-tealblue-600"
            />
            <span className="min-w-0">
              <span
                lang={labelLang}
                className={`text-zinc-800 dark:text-zinc-100 ${labelClassName}`}
              >
                {item.label}
              </span>
              {item.sub && (
                <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">{item.sub}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {visible.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          「{query.trim()}」に一致するものがありません。
        </p>
      )}
    </section>
  );
}
