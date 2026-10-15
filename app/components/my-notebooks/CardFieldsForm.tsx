import { useLayoutEffect, useRef, useState } from "react";

const inputClassName =
  "rounded border border-black/[.1] bg-transparent px-2 py-1 text-sm outline-none focus:border-black/[.3] dark:border-white/[.15] dark:focus:border-white/[.4]";
// 結合セル用：枠線は中のinputではなく、結合行数ぶんの高さに広げるラッパー側に持たせる
// （ネイティブのinput要素自体をJSで動的に伸ばすと、Chromiumで再描画がずれることがあるため、
// 見た目の枠はプレーンなdivに持たせ、inputは自然な高さのまま中に収める）
const mergedWrapperClassName =
  "flex flex-col gap-1 rounded border border-black/[.1] p-1.5 dark:border-white/[.15]";
const mergedInputClassName = "bg-transparent px-1 py-0.5 text-sm outline-none";

type RowState = {
  key: number;
  // 列名 → この行が「グループの先頭」のときに使う入力値
  values: Record<string, string>;
  // 列名 → true なら、このセルは1つ上の行と結合されている（Excelの結合セルと同じ）。
  // 結合中のセルは自分の入力欄を持たず、グループ先頭の値をそのまま引き継いで送信する
  mergedUp: Record<string, boolean>;
};

type Group = { startIndex: number; length: number };

function emptyMerge(bodyColumns: string[]): Record<string, boolean> {
  return Object.fromEntries(bodyColumns.map((column) => [column, false]));
}

// 初期表示時、既存データの時点で列の値が隣接して一致していれば結合済みとして表示する
// （一覧表示のセル結合と同じ基準に揃えることで、編集を開いても見た目が変わらないようにする）
function buildInitialRows(
  defaultRows: Record<string, string>[],
  bodyColumns: string[],
): RowState[] {
  const source = defaultRows.length > 0 ? defaultRows : [{}];
  return source.map((values, index) => {
    const mergedUp: Record<string, boolean> = {};
    for (const column of bodyColumns) {
      const prev = source[index - 1]?.[column];
      const curr = values[column];
      mergedUp[column] = index > 0 && !!curr && curr === prev;
    }
    return { key: index, values, mergedUp };
  });
}

// 列1つぶんの「結合グループ」一覧を、先頭行の添字ごとに引けるMapとして求める
function groupStartsFor(rows: RowState[], column: string): Map<number, Group> {
  const map = new Map<number, Group>();
  let i = 0;
  while (i < rows.length) {
    let length = 1;
    while (i + length < rows.length && rows[i + length].mergedUp[column]) {
      length += 1;
    }
    map.set(i, { startIndex: i, length });
    i += length;
  }
  return map;
}

// 単語カード1件分の入力欄。
// 見出し語（1列目）は単一。それ以外の列は、Excelの表のように「組」単位で行を増減できる
// うえ、列ごとに隣接するセルを結合できる（結合中は1つの入力欄に1回入力するだけで、
// 結合された全ての行に同じ値が保存される）。
// name="head" / name="row:連番:列名" という形式でSubmit時に読み取られる
// （結合されたセルは、行番号ごとに同じ値を持つ隠し入力を追加することで、
// 読み取り側（actions.tsのreadCardData）を変更せずに対応している）
export default function CardFieldsForm({
  columns,
  defaultHead = "",
  defaultRows = [],
  autoFocusHead = false,
}: {
  columns: string[];
  defaultHead?: string;
  defaultRows?: Record<string, string>[];
  // 見出し語の入力欄に最初からフォーカスを当てる（連続して単語を登録するときに使う）
  autoFocusHead?: boolean;
}) {
  const headColumn = columns[0] ?? "";
  const bodyColumns = columns.slice(1);

  const [rows, setRows] = useState<RowState[]>(() => buildInitialRows(defaultRows, bodyColumns));
  // 追加される行のkey採番。初期行の件数から続ける（refはrender中に読めないため）
  const nextKey = useRef(rows.length);

  // 結合セル（`列名:先頭行番号` → 要素）のref。
  // rowSpanしたtd自体は「結合されていない他の列」の行の高さぶんだけ自動的に高くなるが、
  // その中の子要素にheight:100%を指定してもテーブルセルでは解決されず引き伸ばされない。
  // かといってposition:absoluteで敷き詰める方法は、横スクロール用のoverflow-x-autoな
  // 祖先要素があると（overflow-xを指定するとoverflow-yも自動的にautoになる仕様のせいで）
  // 縦方向にクリップされてしまう（実機で確認済み）。
  // そのため、tdの実際の高さ（clientHeight）をJSで測り、中の入力欄コンテナに直接pxで
  // 指定する。DOMへ直接書き込むだけなのでReact stateは使わず、再レンダーごとに
  // （行の追加・削除・結合・分割のたびに）読み直して同期する
  const mergedTdRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const mergedWrapperRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useLayoutEffect(() => {
    mergedTdRefs.current.forEach((td, key) => {
      const wrapper = mergedWrapperRefs.current.get(key);
      if (!wrapper) return;
      // td.clientHeight は内容+padding（rowSpanで決まる高さ）。tdのpadding(4px×2)を
      // 引いた値を指定することで、結合行数ぶんの高さいっぱいに広げる
      wrapper.style.height = `${Math.max(0, td.clientHeight - 8)}px`;
    });
  });

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: nextKey.current++, values: {}, mergedUp: emptyMerge(bodyColumns) },
    ]);
  }

  function removeRow(key: number) {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      const index = prev.findIndex((row) => row.key === key);
      if (index === -1) return prev;

      const next = prev.map((row) => ({
        ...row,
        values: { ...row.values },
        mergedUp: { ...row.mergedUp },
      }));
      const removed = next[index];
      const follower = next[index + 1];
      if (follower) {
        for (const column of bodyColumns) {
          // 削除する行がグループの先頭で、直後の行がそのグループに吸収されていた場合だけ、
          // 直後の行を新しい先頭に昇格させ、表示していた値を引き継がせる
          // （そうしないと、削除直後にグループの表示値が消えてしまう）
          if (!removed.mergedUp[column] && follower.mergedUp[column]) {
            follower.values[column] = removed.values[column] ?? "";
            follower.mergedUp[column] = false;
          }
        }
      }
      next.splice(index, 1);
      return next;
    });
  }

  function updateValue(key: number, column: string, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, values: { ...row.values, [column]: value } } : row,
      ),
    );
  }

  // 添字indexの行（column）を、1つ上のグループへ結合する。
  // 結合される行が独自の値を持っていた場合はグループ先頭の値に統一されて失われるため確認する
  function mergeUp(index: number, column: string) {
    setRows((prev) => {
      const existing = prev[index]?.values[column] ?? "";
      if (existing !== "") {
        const ok = window.confirm(
          `結合すると「${existing}」は上のセルの値に統一されます。よろしいですか？`,
        );
        if (!ok) return prev;
      }
      return prev.map((row, i) =>
        i === index ? { ...row, mergedUp: { ...row.mergedUp, [column]: true } } : row,
      );
    });
  }

  // グループの最後の行だけを分割して独立させる。値は空欄から入力し直す
  // （Excelのセル結合解除と同じく、結合前の値は先頭セルに残ったまま）
  function splitLast(index: number, column: string) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              mergedUp: { ...row.mergedUp, [column]: false },
              values: { ...row.values, [column]: "" },
            }
          : row,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 dark:text-zinc-500">{headColumn}</label>
        <input
          name="head"
          defaultValue={defaultHead}
          autoFocus={autoFocusHead}
          className={inputClassName}
        />
      </div>

      {bodyColumns.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-black/[.06] p-2 dark:border-white/[.1]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {bodyColumns.map((column) => (
                    <th
                      key={column}
                      className="px-1 pb-1.5 text-left text-xs font-normal text-zinc-500 dark:text-zinc-500"
                    >
                      {column}
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.key}>
                    {bodyColumns.map((column) => {
                      // 結合グループに吸収されているセル（=先頭ではない）は描画しない
                      if (row.mergedUp[column]) return null;

                      const group = groupStartsFor(rows, column).get(index);
                      if (!group) return null;
                      const hasNext = index + group.length < rows.length;
                      // 結合セルの中身は「分割」ボタンが常にセル下端に来るため、結合して
                      // いない列（訳・操作）もalign-bottomにして下端をそろえる
                      const isMerged = group.length > 1;
                      const cellKey = `${column}:${index}`;

                      return (
                        <td
                          key={column}
                          ref={
                            isMerged
                              ? (el) => {
                                  if (el) mergedTdRefs.current.set(cellKey, el);
                                  else mergedTdRefs.current.delete(cellKey);
                                }
                              : undefined
                          }
                          rowSpan={group.length}
                          className="px-1 py-1 align-bottom"
                        >
                          <div
                            // 結合行数（group.length）が変わるたびにDOM要素を作り直す。
                            // 既存の要素の高さだけを後から書き換えると、ブラウザが再描画時に
                            // 新しく広がった分を正しく塗り直さないことがある（実機で確認済み）ため、
                            // keyを変えて確実に新しい要素として描画させる。
                            // 新しい要素は古いスタイルを一切引き継がないため、ref側でstyleを
                            // 手動クリアする必要は無い（むしろ開発時のStrict Modeによる
                            // refの二重呼び出しと噛み合わず、意図せずクリアされてしまう不具合になった）
                            key={group.length}
                            ref={
                              isMerged
                                ? (el) => {
                                    if (el) mergedWrapperRefs.current.set(cellKey, el);
                                    else mergedWrapperRefs.current.delete(cellKey);
                                  }
                                : undefined
                            }
                            className={isMerged ? mergedWrapperClassName : "flex flex-col gap-1"}
                          >
                            <input
                              name={`row:${index}:${column}`}
                              value={row.values[column] ?? ""}
                              onChange={(e) => updateValue(row.key, column, e.target.value)}
                              className={isMerged ? mergedInputClassName : inputClassName}
                            />
                            {/* 結合されている行にも同じ値を送信するための隠し入力 */}
                            {Array.from({ length: group.length - 1 }, (_, k) => index + 1 + k).map(
                              (absorbedIndex) => (
                                <input
                                  key={absorbedIndex}
                                  type="hidden"
                                  name={`row:${absorbedIndex}:${column}`}
                                  value={row.values[column] ?? ""}
                                />
                              ),
                            )}
                            {/* 結合セルではinputを伸ばさず、この操作行をmt-autoで下端に固定する
                                （ネイティブinputをflex-1で伸ばす方式は実機で描画崩れが起きたため） */}
                            <div
                              className={`flex gap-2 text-xs whitespace-nowrap ${isMerged ? "mt-auto" : ""}`}
                            >
                              {group.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => splitLast(index + group.length - 1, column)}
                                  className="text-coral-600 transition-colors hover:underline dark:text-coral-400"
                                >
                                  ✂ 分割
                                </button>
                              )}
                              {hasNext && (
                                <button
                                  type="button"
                                  onClick={() => mergeUp(index + group.length, column)}
                                  className="text-zinc-500 transition-colors hover:underline dark:text-zinc-400"
                                >
                                  ⬇ 次の行と結合
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-1 py-1 align-bottom text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        className="text-xs text-coral-600 transition-all hover:-translate-y-0.5 hover:text-coral-800 hover:underline disabled:opacity-30 dark:text-coral-400 dark:hover:text-coral-200"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
            「⬇
            次の行と結合」で列ごとにセルを結合すると、1回の入力が結合した行すべてに反映されます。
          </p>
          <button
            type="button"
            onClick={addRow}
            className="self-start text-xs text-coral-600 transition-all hover:-translate-y-0.5 hover:text-coral-800 hover:underline dark:text-coral-400 dark:hover:text-coral-200"
          >
            ＋ 組を追加（{bodyColumns.join("・")}をまとめて1行分）
          </button>
        </div>
      )}
    </div>
  );
}
