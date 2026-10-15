import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import Link from "@/components/Link";

import EyeIcon from "@/components/EyeIcon";
import StarCountEditor from "@/components/StarCountEditor";
import { useStarColors } from "@/hooks/useStarColors";
import { useSwipe } from "@/hooks/useSwipe";
import { starColorFor } from "@/lib/shared/star-colors";
import type { CardData } from "@/lib/shared/card-data";
import MultiElementCard from "@/components/my-notebooks/MultiElement"; //三次元用の三角柱UIを導入

type Card = {
  id: string;
  data: CardData;
  starred: boolean;
  starCount: number;
  viewCount: number;
};

// 暗記学習で実際に1枚のカード（多角柱）として出題する単位。
// 見出し語1件（1つのCard）が複数の意味・発音などを持つ場合でも、
// 従来は1枚のカードの1面に複数値を「/」区切りでまとめて表示していたが、
// それだと見にくいため「1組につき1枚のカード」に展開する。
// card.data.rowsは既に「同じ添字の値同士が列をまたいで対応する組」の配列
// （例: 訳と発音が同じ添字なら対応する意味・発音）になっているため、
// そのまま1組=1枚のStudyUnitとして使う
type StudyUnit = {
  card: Card;
  // 列名 → この組での値（見出し語列を除く。値が無い列はキー自体が存在しない）
  values: Record<string, string>;
};

function expandToUnits(card: Card, bodyColumns: string[]): StudyUnit[] {
  return card.data.rows.map((row) => {
    const values: Record<string, string> = {};
    for (const column of bodyColumns) {
      if (row[column] !== undefined) values[column] = row[column];
    }
    return { card, values };
  });
}

// Fisher-Yatesシャッフル: [0, 1, ..., length-1] という「カードの元の並び順（インデックス）」の
// 配列を作り、末尾から先頭に向かって「自分より前（自分を含む）」のランダムな位置と1つずつ
// 交換していくことで、すべての並び替えパターンが等確率で出現するようにする。
// cards配列自体は書き換えず、参照順だけを表すこの order 配列をシャッフルする点がポイント
// （元のカード配列とidの対応を保ったまま表示順だけ変えられる）
function shuffleOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function StudyDeck({
  notebookId,
  columns,
  cards,
}: {
  notebookId: string;
  columns: string[];
  cards: Card[];
}) {
  // 見出し語1件（1つのCard）を、意味などの行数に応じて複数の出題単位（StudyUnit）に展開する
  const units = useMemo(() => {
    const bodyColumns = columns.slice(1);
    return cards.flatMap((card) => expandToUnits(card, bodyColumns));
  }, [cards, columns]);

  // order: 「何番目に何のカード（unitsのインデックス）を出すか」を表す並び替えテーブル。
  // 初期状態は [0, 1, 2, ...] で、unitsをそのままの順番で出す
  const [order, setOrder] = useState(() => units.map((_, i) => i));
  // index: order の何番目（＝現在何枚目）を表示しているか
  const [index, setIndex] = useState(0);
  // flipped: 今のカードが表（見出し語）か裏（意味）のどちらを向いているか
  const [flipped, setFlipped] = useState(false);

  const [frontColumn, setFrontColumn] = useState<string>(columns[0] ?? "");

  // 現在表示すべき出題単位は、order[index]（実際のunitsインデックス）から引く
  const current = units[order[index]];
  const currentCard = current.card;

  // 指定した列の値を取得する。見出し語列はdata.head（1件）、
  // それ以外はcurrent.values[列名]（この行に割り当てられた1件、無ければ無し）
  function valuesFor(column: string, isHead: boolean): string[] {
    if (isHead) return currentCard.data.head ? [currentCard.data.head] : [];
    const value = current.values[column];
    return value !== undefined ? [value] : [];
  }

  // 今のカードでデータが存在する列一覧
  const rawActiveColumns = columns.filter((col, idx) => valuesFor(col, idx === 0).length > 0);

  // 選択された frontColumn が先頭（1面目）に来るように並び替える
  const activeColumns = rawActiveColumns.includes(frontColumn)
    ? [frontColumn, ...rawActiveColumns.filter((col) => col !== frontColumn)]
    : rawActiveColumns;

  const bodyColumns = activeColumns.slice(1);

  // 表示しようとしているカードの要素数が3個以上の時だけ3Dモードにする判定
  const is3DMode = activeColumns.length >= 3;

  // 3D多角柱のそれぞれの面に入れるコンテンツの準備。
  // 展開済みのStudyUnitでは各列は必ず1件の値に揃っているため、そのまま表示する
  const faces = activeColumns.map((colName) => {
    const isHead = colName === columns[0];
    const values = valuesFor(colName, isHead);
    return <CardFace key={colName} colName={colName} value={values[0] ?? "—"} isHead={isHead} />;
  });

  // ★の付け外しは、サーバーの往復を待たず、クリックした瞬間に★・回数・色を切り替える。
  // 切り替え後の値はカードidごとにここへ保持する。baseStarred は切り替え前にサーバーから受け取っていた値で、
  // 再検証でサーバー側の値が追いついたとき（baseStarred と食い違ったとき）は、サーバーの値を優先する。
  // 復習モード（/review）は再検証しない（カードが一覧から抜けて表示中の位置がずれるため）ので、
  // その場合はこの保持した値が表示され続ける
  const actionUrl = `/my-notebooks/${notebookId}`;
  const starFetcher = useFetcher();
  const viewFetcher = useFetcher();
  const [starOverrides, setStarOverrides] = useState<
    Record<string, { baseStarred: boolean; starred: boolean; starCount: number }>
  >({});
  const override = starOverrides[currentCard.id];
  const displayedStar =
    override && override.baseStarred === currentCard.starred
      ? override
      : { starred: currentCard.starred, starCount: currentCard.starCount };
  function handleToggleStar() {
    const next = displayedStar.starred
      ? { starred: false, starCount: displayedStar.starCount }
      : { starred: true, starCount: displayedStar.starCount + 1 };
    setStarOverrides((prev) => ({
      ...prev,
      [currentCard.id]: { baseStarred: currentCard.starred, ...next },
    }));
  }

  // ★を付けた回数（displayedStar.starCount）に応じた色。0回（未使用）ならundefinedになりニュートラル表示にする
  const { colors: starColors } = useStarColors();
  const starColor = starColorFor(displayedStar.starCount, starColors);

  // カードが切り替わる（＝暗記モードでこの単語が表示される）たびに、表示回数を1増やす
  // countedIdRefで直前に数えたカードIDを覚えておき、同じidに対して二重に数えないようにする
  // （開発時のStrictModeによるeffect二重発火対策も兼ねる。同じ見出し語の別の意味へ
  // 移動しただけ＝idが変わらない場合も、ここで重複カウントを防いでいる）
  const countedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (countedIdRef.current === currentCard.id) return;
    countedIdRef.current = currentCard.id;
    viewFetcher.submit(
      { intent: "incrementViewCount", cardId: currentCard.id },
      { method: "post", action: actionUrl },
    );
    // viewFetcher は毎レンダリングで同一とは限らないため、依存にはカードidだけを持たせる
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard.id]);

  // 次のカードへ。indexが末尾を超えないようMath.minでクランプし、
  // カードが切り替わったら必ず表向きに戻す
  function goNext() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, order.length - 1));
  }

  // 前のカードへ。indexが0未満にならないようMath.maxでクランプする
  function goPrev() {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  // 出題順を丸ごとシャッフルし直し、1枚目（index=0）・表向きの状態からやり直す
  function shuffle() {
    setOrder(shuffleOrder(units.length));
    setIndex(0);
    setFlipped(false);
  }

  // スマホ向け: カードを左へスワイプで次へ、右へスワイプで前へ。
  // 端のカードではボタンのdisabledと同様に何もしない（goNext/goPrevが範囲内にクランプする）
  const swipeHandlers = useSwipe({ onSwipeLeft: goNext, onSwipeRight: goPrev });

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 進捗と最初の面選択UI */}
      <div className="flex w-full max-w-[320px] items-center justify-between text-sm text-zinc-500">
        <p>
          {index + 1} / {order.length}
        </p>

        {/* ★ 最初に表にする項目の選択 */}
        <select
          value={frontColumn}
          onChange={(e) => {
            setFrontColumn(e.target.value);
            setFlipped(false); // 切り替えたら表面に戻す
          }}
          className="rounded-lg border border-black/[.08] bg-white px-2 py-1 text-xs dark:border-white/[.145] dark:bg-zinc-900"
        >
          {columns.map((col) => (
            <option key={col} value={col}>
              おもて: {col}
            </option>
          ))}
        </select>
      </div>
      {/* relativeなラッパーで囲み、右上の★ボタンをカードに重ねて絶対配置する。
          ★ボタンはフリップ用ボタンとは別要素（兄弟）なので、クリックがフリップに巻き込まれない */}
      <div className="relative mx-auto w-[320px] touch-pan-y" {...swipeHandlers}>
        {/* カード自体がクリック領域。クリックするたびに表裏(flipped)をトグルするだけで、
            カードの移動（前へ/次へ/シャッフル）とは独立した操作になっている */}

        {is3DMode ? (
          /* 3つの要素があるときは三角柱 */
          <div className="my-2 flex flex-col items-center gap-2">
            <MultiElementCard
              // 同じ見出し語の別の行（意味違い）へ移動したときも確実に再マウントさせ、
              // 直前の回転状態を引きずらないようにするため、unitsの位置（order[index]）をkeyにする
              key={order[index]}
              faces={faces}
              columnNames={activeColumns}
              width={320}
              height={220}
            />
            <span className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
              クリックして次の面へ回転（{activeColumns.length}角柱）
            </span>
          </div>
        ) : (
          /* それ以外の時は元通りの表裏ボタン */
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex h-[220px] w-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-black/[.08] bg-white p-8 text-center transition-colors hover:border-black/[.15] dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/[.25]"
          >
            {!flipped ? (
              // 表面: 1列目（見出し語）だけを大きく表示する
              <>
                <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
                  {frontColumn}
                </span>
                <span className="text-2xl font-semibold text-black dark:text-zinc-50">
                  {currentCard.data.head || "—"}
                </span>
              </>
            ) : bodyColumns.length > 0 ? (
              // 裏面: 列ごとに、この行に割り当てられた1件の値を表示する
              <div className="flex flex-col gap-4">
                {bodyColumns.map((column) => {
                  const value = current.values[column];
                  if (value === undefined) return null;
                  return (
                    <div key={column}>
                      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
                        {column}
                      </p>
                      <p className="text-lg text-black dark:text-zinc-50">{value}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              // 意味の列自体が無い、またはこのカードに項目が1件も登録されていない場合のフォールバック表示
              <p className="text-sm text-zinc-500 dark:text-zinc-500">他に項目がありません</p>
            )}
            <span className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
              クリックして{flipped ? "表" : "裏"}を見る
            </span>
          </button>
        )}

        {/* handleToggleStar は楽観的UI: starOverrides を即座に切り替えてから
            toggleStar（サーバー更新）を送る。表示も current.starred ではなく
            displayedStar.starred を見るため、通信を待たずに★が切り替わる。

            ★ボタンはフリップボタンと別要素にし、右上に絶対的に配置。
            ★クリックがフリップに巻き込まれないようにするため。

            回数の表示・修正は StarCountEditor に分離。誤クリック時も
            手動で書き換え・0リセットができる。

            全件モード（/study）は再検証しても件数・並び順が変わらないため、
            ★の付け外しをその場で反映できる。 */}
        <div className="absolute top-10 right-3 flex items-center gap-1">
          <starFetcher.Form method="post" action={actionUrl} onSubmit={handleToggleStar}>
            <input type="hidden" name="intent" value="toggleStar" />
            <input type="hidden" name="cardId" value={currentCard.id} />
            <button
              type="submit"
              aria-label={displayedStar.starred ? "★を外す" : "★をつける"}
              style={starColor ? { color: starColor } : undefined}
              className={
                starColor
                  ? "text-2xl transition-opacity hover:opacity-75"
                  : "text-2xl text-zinc-300 transition-colors hover:text-zinc-400 dark:text-zinc-700 dark:hover:text-zinc-500"
              }
            >
              {displayedStar.starred ? "★" : "☆"}
            </button>
          </starFetcher.Form>
          <StarCountEditor
            cardId={currentCard.id}
            notebookId={notebookId}
            starCount={displayedStar.starCount}
            color={starColor}
          />
          {/* 目アイコンは暗記モード（/study, /review）でこのカードが表示された累計回数。
              ★（左）の右隣に並べる。サイズは★の文字サイズ（text-2xl）に合わせている */}
          <span
            aria-label="暗記モードで表示した回数"
            className="inline-flex items-center gap-0.5 text-sm text-zinc-400 dark:text-zinc-600"
          >
            <EyeIcon className="h-6 w-6" />
            {currentCard.viewCount}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm transition-colors hover:border-black/[.15] disabled:opacity-40 dark:border-white/[.145] dark:hover:border-white/[.25]"
        >
          前へ
        </button>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-full border border-coral-300 px-4 py-2 text-sm text-coral-700 transition-colors hover:border-coral-500 hover:text-coral-800 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:text-coral-200"
        >
          シャッフル
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index === order.length - 1}
          className="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-200 disabled:opacity-40 dark:hover:shadow-none"
        >
          次へ
        </button>
      </div>

      <Link
        href={`/my-notebooks/${notebookId}`}
        className="text-sm text-zinc-500 transition-colors hover:underline dark:text-zinc-500"
      >
        ← 単語帳に戻る
      </Link>
    </div>
  );
}

function CardFace({ colName, value, isHead }: { colName: string; value: string; isHead: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
        {colName}
      </span>
      <span
        className={
          isHead
            ? "text-2xl font-semibold text-black dark:text-zinc-50"
            : "text-lg text-zinc-800 dark:text-zinc-200"
        }
      >
        {value}
      </span>
    </div>
  );
}
