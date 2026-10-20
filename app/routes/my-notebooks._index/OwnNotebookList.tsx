import { useRef, useState } from "react";
import { useFetcher, useFetchers } from "react-router";

import Link from "@/components/Link";
import DeleteNotebookButton from "@/components/my-notebooks/DeleteNotebookButton";
import { useLongPressDrag, type LongPressDragHandlers, type Point } from "@/hooks/useLongPressDrag";
import { clampToGroup, notebookGroup, sortNotebooks } from "@/lib/shared/notebook-order";
import { insertionIndex, moveToInsertionPoint } from "@/lib/shared/reorder";

type OwnNotebook = {
  id: string;
  title: string;
  favorite: boolean;
  studied: boolean;
  listPosition: number;
  createdAt: Date;
  _count: { cards: number };
};

// 並べ替えの最中の状態。from 番目を insertAt 番目の間へ動かそうとしている（lib/shared/reorder.ts）
type Drag = { from: number; insertAt: number };

// My単語帳の一覧（自分が作った単語帳）。お気に入りは一番上、学習済みは一番下（グレー）にまとめて並び、
// 長押ししたまま動かすと、それぞれのまとまりの中で並べ替えられる。
// お気に入り・学習済みの切り替えと並べ替えは、サーバーの応答を待たずに並びを変えて見せる（送信中の fetcher.formData から作る）
export default function OwnNotebookList({ notebooks }: { notebooks: OwnNotebook[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const moveFetcher = useFetcher();
  const [drag, setDrag] = useState<Drag | null>(null);
  // 入れる場所を示す線（一覧の枠を基準にした縦の位置）
  const [dropLine, setDropLine] = useState<number | null>(null);

  // 送信中のお気に入り・学習済みの切り替えを先に反映してから、一覧と同じ順に並べる
  const fetchers = useFetchers();
  const togglingIds = (intent: string) =>
    new Set(
      fetchers
        .filter((fetcher) => fetcher.formData?.get("intent") === intent)
        .map((fetcher) => String(fetcher.formData?.get("notebookId"))),
    );
  const togglingFavorite = togglingIds("toggleFavorite");
  const togglingStudied = togglingIds("toggleStudied");
  let displayed = sortNotebooks(
    notebooks.map((notebook) => ({
      ...notebook,
      favorite: togglingFavorite.has(notebook.id) ? !notebook.favorite : notebook.favorite,
      studied: togglingStudied.has(notebook.id) ? !notebook.studied : notebook.studied,
    })),
  );
  // 送信中の並べ替えも先に反映する
  // （サーバーと同じく、どの単語帳を・どの単語帳の前へ、を id で受け渡す）
  const pendingMove = moveFetcher.formData;
  if (pendingMove) {
    const ids = displayed.map((notebook) => notebook.id);
    const from = ids.indexOf(String(pendingMove.get("notebookId")));
    const beforeId = String(pendingMove.get("beforeNotebookId") ?? "");
    const insertAt = beforeId === "" ? displayed.length : ids.indexOf(beforeId);
    if (from !== -1 && insertAt !== -1) {
      displayed = moveToInsertionPoint(
        displayed,
        from,
        clampToGroup(displayed.map(notebookGroup), from, insertAt),
      );
    }
  }
  const groups = displayed.map(notebookGroup);

  function itemRects() {
    return Array.from(listRef.current?.querySelectorAll<HTMLElement>(":scope > li") ?? []).map(
      (li) => li.getBoundingClientRect(),
    );
  }
  // 指・マウスの位置から入れる位置を決める。お気に入り・それ以外・学習済みの境目はまたがない
  function insertAtFor(from: number, point: Point) {
    const centers = itemRects().map((rect) => rect.top + rect.height / 2);
    return clampToGroup(groups, from, insertionIndex(centers, point.y));
  }
  const changesOrder = ({ from, insertAt }: Drag) => insertAt !== from && insertAt !== from + 1;
  function dropLineFor(next: Drag) {
    const list = listRef.current;
    if (!list || !changesOrder(next)) return null;
    const rects = itemRects();
    const origin = list.getBoundingClientRect();
    // 入れる位置の上の項目と下の項目のあいだ（端なら一覧の上端・下端）
    const above = rects[next.insertAt - 1];
    const below = rects[next.insertAt];
    const y = above && below ? (above.bottom + below.top) / 2 : below ? below.top : above.bottom;
    return y - origin.top;
  }

  function dragHandlers(from: number): LongPressDragHandlers {
    return {
      onDragStart: () => {
        setDrag({ from, insertAt: from });
        setDropLine(null);
      },
      onDragMove: (point) => {
        const next = { from, insertAt: insertAtFor(from, point) };
        setDrag(next);
        setDropLine(dropLineFor(next));
      },
      onDragEnd: (point) => {
        const next = { from, insertAt: insertAtFor(from, point) };
        setDrag(null);
        setDropLine(null);
        if (!changesOrder(next)) return;
        void moveFetcher.submit(
          {
            intent: "moveNotebook",
            notebookId: displayed[from].id,
            // この単語帳の前へ入れる（いちばん後ろなら空）
            beforeNotebookId: displayed[next.insertAt]?.id ?? "",
          },
          { method: "post", action: "/my-notebooks" },
        );
      },
    };
  }

  return (
    <div className="relative">
      <ul ref={listRef} aria-label="作成済みの単語帳" className="flex flex-col gap-3">
        {displayed.map((notebook, index) => (
          <NotebookListItem
            key={notebook.id}
            notebook={notebook}
            drag={dragHandlers(index)}
            dragDisabled={moveFetcher.state !== "idle"}
            isDragSource={drag?.from === index}
          />
        ))}
      </ul>
      {dropLine !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-coral-500"
          style={{ top: dropLine - 1 }}
        />
      )}
    </div>
  );
}

function NotebookListItem({
  notebook,
  drag,
  dragDisabled,
  isDragSource,
}: {
  notebook: OwnNotebook;
  drag: LongPressDragHandlers;
  dragDisabled: boolean;
  isDragSource: boolean;
}) {
  // 項目全体が単語帳を開くリンクなので、リンクの上でも長押しで並べ替えられるようにする（ボタンの上は除く）
  const ref = useLongPressDrag(drag, dragDisabled, { ignore: "button, input" });
  const favoriteFetcher = useFetcher();
  const studiedFetcher = useFetcher();
  const { studied } = notebook;

  return (
    <li
      ref={ref}
      data-studied={studied}
      // 学習済みはグレーの背景・薄い文字で、学習中の単語帳と見分けられるようにする
      className={`flex items-center justify-between gap-3 rounded-2xl border p-5 transition-all select-none [-webkit-touch-callout:none] hover:shadow-xl data-[long-pressed]:border-coral-400 data-[long-pressed]:shadow-xl dark:hover:shadow-none ${
        studied
          ? "border-zinc-200 bg-zinc-100 hover:border-zinc-300 hover:shadow-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
          : "border-coral-200 bg-white hover:border-coral-300 hover:shadow-coral-100 dark:border-coral-900/40 dark:bg-zinc-950 dark:hover:border-coral-700/60"
      } ${isDragSource ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        onClick={() =>
          void favoriteFetcher.submit(
            { intent: "toggleFavorite", notebookId: notebook.id },
            { method: "post", action: "/my-notebooks" },
          )
        }
        aria-label={notebook.favorite ? "お気に入りから外す" : "お気に入りに追加"}
        aria-pressed={notebook.favorite}
        title={
          notebook.favorite ? "お気に入りから外す" : "お気に入りに追加（一覧の一番上に並びます）"
        }
        className={`shrink-0 transition-colors ${
          notebook.favorite
            ? "text-coral-500 hover:text-coral-600"
            : "text-zinc-300 hover:text-coral-400 dark:text-zinc-600"
        }`}
      >
        <HeartIcon filled={notebook.favorite} />
      </button>
      {/* マウスで押したまま動かしたときに、ブラウザがリンクそのものをドラッグし始めないようにする */}
      <Link href={`/my-notebooks/${notebook.id}`} draggable={false} className="flex-1 text-left">
        <p
          className={`font-medium ${studied ? "text-zinc-400 dark:text-zinc-500" : "text-black dark:text-zinc-50"}`}
        >
          {notebook.title}
        </p>
        <p
          className={`mt-1 text-sm ${studied ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-500"}`}
        >
          {notebook._count.cards}語{studied && " ・ 学習済み"}
        </p>
      </Link>
      <button
        type="button"
        onClick={() =>
          void studiedFetcher.submit(
            { intent: "toggleStudied", notebookId: notebook.id },
            { method: "post", action: "/my-notebooks" },
          )
        }
        aria-label={studied ? "学習中に戻す" : "学習済みにする"}
        aria-pressed={studied}
        title={studied ? "学習中に戻す" : "学習済みにする（一覧の一番下にグレーで並びます）"}
        className={`shrink-0 transition-colors ${
          studied
            ? "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            : "text-zinc-300 hover:text-tealblue-500 dark:text-zinc-600"
        }`}
      >
        <CheckCircleIcon filled={studied} />
      </button>
      <DeleteNotebookButton notebookId={notebook.id} />
    </li>
  );
}

// お気に入りのハート。★は単語のブックマークで使っているので、単語帳のお気に入りはハートで区別する
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinejoin="round"
    >
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.5 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.5 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
    </svg>
  );
}

// 学習済みのチェック。学習済みなら丸を塗る
function CheckCircleIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
      />
      <path
        d="M8 12.5l2.7 2.7L16 9.8"
        fill="none"
        stroke={filled ? "white" : "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
