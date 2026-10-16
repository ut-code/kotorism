import { useState } from "react";
import { useFetcher } from "react-router";

import type { FormState } from "@/lib/shared/form-state";
import CardFieldsForm from "@/components/my-notebooks/CardFieldsForm";
import EyeIcon from "@/components/EyeIcon";
import StarCountEditor from "@/components/StarCountEditor";
import { useStarColors } from "@/hooks/useStarColors";
import { starColorFor } from "@/lib/shared/star-colors";
import type { CardData } from "@/lib/shared/card-data";

const initialState: FormState = {};

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral-500 px-3 py-1 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 disabled:opacity-50 dark:hover:shadow-none"
    >
      {pending ? "保存中…" : "保存"}
    </button>
  );
}

// Excelの結合セルのように、ある列で連続する組（行）の値が同じであればまとめてrowSpanで
// 1つのセルにする。先頭行以外はnull（描画しない）を返し、代わりに直前のセルのrowSpanを伸ばす。
// 空文字同士は結合しない（未入力のセルが1つの大きな空欄に見えて紛らわしいのを避けるため）
function computeRowSpans(values: string[]): number[] {
  const spans = values.map(() => 1);
  for (let i = values.length - 1; i > 0; i -= 1) {
    if (values[i] !== "" && values[i] === values[i - 1]) {
      spans[i - 1] += spans[i];
      spans[i] = 0;
    }
  }
  return spans;
}

export default function CardRow({
  notebookId,
  columns,
  card,
}: {
  notebookId: string;
  columns: string[];
  card: { id: string; data: CardData; starred: boolean; starCount: number; viewCount: number };
}) {
  // このカードが「表示モード」か「インライン編集モード」かを切り替えるフラグ
  const [editing, setEditing] = useState(false);
  // 単語帳ページの action(intent で振り分け)に送信する。fetcher.data が直近の実行結果(state = { error? })
  const actionUrl = `/my-notebooks/${notebookId}`;
  const updateFetcher = useFetcher<FormState>();
  const state = updateFetcher.data ?? initialState;
  // stateが変化した（=action実行結果が返ってきた）タイミングだけ、成功時に編集モードを閉じる。
  // 初回マウント時はprevState === stateなので何もしない
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setEditing(false);
    }
  }

  // 見出し語を除いた列。表示順そのまま
  const bodyColumns = columns.slice(1);

  // toggleStarの結果（サーバーの往復）を待たず、クリックした瞬間に★・回数・色を切り替えるための
  // 楽観的UI。送信中（idleでない間）は反転後の状態を見せる。これが無いと、往復の間だけ
  // 古い状態（トグル前の☆）が表示され続けてしまい、「一瞬白い星に戻る」ように見えるバグになる
  const starFetcher = useFetcher();
  const togglingStar = starFetcher.state !== "idle";
  const optimisticStar = togglingStar
    ? card.starred
      ? { starred: false, starCount: card.starCount }
      : { starred: true, starCount: card.starCount + 1 }
    : { starred: card.starred, starCount: card.starCount };
  const deleteFetcher = useFetcher();

  // ★を付けた回数（optimisticStar.starCount）に応じた色。0回（未使用）ならundefinedになりニュートラル表示にする
  const { colors: starColors } = useStarColors();
  const starColor = starColorFor(optimisticStar.starCount, starColors);

  if (!editing) {
    // 見出し語1件につき、rows（組）の件数ぶん<tr>を並べる。見出し語セルと操作セルは
    // Excelの結合セルのように rowSpan で全組にまたがらせ、本文の各列は列ごとに
    // 連続して同じ値が続く区間だけをrowSpanでまとめる（結合・分割）
    const rowCount = card.data.rows.length;
    const bodySpansByColumn = bodyColumns.map((column) =>
      computeRowSpans(card.data.rows.map((row) => row[column] ?? "")),
    );

    return (
      <>
        {card.data.rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-t border-black/[.06] dark:border-white/[.1]">
            {rowIndex === 0 && (
              <td
                rowSpan={rowCount}
                className="px-4 py-3 align-top text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                {card.data.head}
              </td>
            )}
            {bodyColumns.map((column, columnIndex) => {
              const span = bodySpansByColumn[columnIndex][rowIndex];
              if (span === 0) return null;
              return (
                <td
                  key={column}
                  rowSpan={span}
                  className="px-4 py-3 align-top text-sm text-zinc-700 dark:text-zinc-300"
                >
                  {row[column] ?? ""}
                </td>
              );
            })}
            {rowIndex === 0 && (
              <td rowSpan={rowCount} className="px-4 py-3 text-right align-top whitespace-nowrap">
                {/* 送信中は楽観的UIでoptimisticStarを即座に切り替える。
                    表示はcard.starredではなくoptimisticStar.starredを見ることで、
                    サーバーの往復を待たずに★・色が切り替わる。
                    回数の表示・修正はStarCountEditorに分離し、誤クリック時に
                    手動での書き換え・0へのリセットができるようにしている */}
                <span className="mr-3 inline-flex items-center gap-1">
                  <starFetcher.Form method="post" action={actionUrl} className="inline">
                    <input type="hidden" name="intent" value="toggleStar" />
                    <input type="hidden" name="cardId" value={card.id} />
                    <button
                      type="submit"
                      aria-label={optimisticStar.starred ? "★を外す" : "★をつける"}
                      style={starColor ? { color: starColor } : undefined}
                      className={
                        starColor
                          ? "text-sm transition-opacity hover:opacity-75"
                          : "text-sm text-zinc-400 transition-colors hover:underline dark:text-zinc-600"
                      }
                    >
                      {optimisticStar.starred ? "★" : "☆"}
                    </button>
                  </starFetcher.Form>
                  <StarCountEditor
                    cardId={card.id}
                    notebookId={notebookId}
                    starCount={optimisticStar.starCount}
                    color={starColor}
                  />
                  {/* 目アイコンは暗記モード（/study, /review）でこのカードが表示された累計回数。
                      ★（左）の右隣に並べ、修正対象ではないのでただの表示に留める。
                      サイズは★の文字サイズ（text-sm）に合わせている */}
                  <span
                    aria-label="暗記モードで表示した回数"
                    className="inline-flex items-center gap-0.5 text-xs text-zinc-400 dark:text-zinc-600"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    {card.viewCount}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mr-3 text-sm text-zinc-600 transition-colors hover:underline dark:text-zinc-400"
                >
                  編集
                </button>
                {/* 確認ダイアログで「キャンセル」された場合はpreventDefaultで送信自体を止める */}
                <deleteFetcher.Form
                  method="post"
                  action={actionUrl}
                  className="inline"
                  onSubmit={(event) => {
                    if (!window.confirm("この単語を削除しますか？")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="intent" value="deleteCard" />
                  <input type="hidden" name="cardId" value={card.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 transition-colors hover:underline dark:text-red-400"
                  >
                    削除
                  </button>
                </deleteFetcher.Form>
              </td>
            )}
          </tr>
        ))}
      </>
    );
  }

  // 編集モードでは、colSpan（見出し語1列 + 列数 + 操作列1列）で全カラムぶんを1セルに潰して
  // その中にフォームを丸ごと展開する
  return (
    <tr className="border-t border-black/[.06] dark:border-white/[.1]">
      <td colSpan={bodyColumns.length + 2} className="px-4 py-3">
        {/* 実行結果は updateFetcher.data（= state）に反映される */}
        <updateFetcher.Form
          method="post"
          action={actionUrl}
          className="flex flex-col items-start gap-3"
        >
          <input type="hidden" name="intent" value="updateCard" />
          <input type="hidden" name="cardId" value={card.id} />
          {/* defaultHead/defaultRowsで現在の値を初期表示し、そこから編集する */}
          <CardFieldsForm
            columns={columns}
            defaultHead={card.data.head}
            defaultRows={card.data.rows}
          />
          <div className="flex items-center gap-3">
            <SaveButton pending={updateFetcher.state !== "idle"} />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-coral-600 transition-all hover:-translate-y-0.5 hover:text-coral-800 hover:underline dark:text-coral-400 dark:hover:text-coral-200"
            >
              キャンセル
            </button>
          </div>
        </updateFetcher.Form>
        {state?.error && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
      </td>
    </tr>
  );
}
