"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type GuideSlide = {
  title: string;
  image: { src: string; alt: string };
  items: string[];
};

// ガイドの各スライド。画面上のボタン名と表記を揃え、「どこを押せばいいか」が分かるようにする。
// 画像は実際の画面のスクリーンショット（public/images/notebook-guide/）
const GUIDE_SLIDES: GuideSlide[] = [
  {
    title: "単語帳をつくる",
    image: {
      src: "/images/notebook-guide/create.png",
      alt: "My単語帳ページの新規作成フォームと作成済みの単語帳一覧",
    },
    items: [
      "「新規作成」にタイトルを入力して作成すると、「見出し語」「意味」の2列だけの空の単語帳ができます。",
      "作成した単語帳は「作成済みの単語帳」に並びます。クリックすると単語帳ページが開きます。",
    ],
  },
  {
    title: "単語を追加する",
    image: {
      src: "/images/notebook-guide/add-words.png",
      alt: "単語帳ページ下部の「単語を追加」フォーム",
    },
    items: [
      "単語帳ページ下部の「単語を追加」フォームから1語ずつ追加できます。",
      "1つの見出し語に複数の意味がある場合は「＋ 組を追加」で行を増やせます。",
      "「Excelから単語を追加」では、テンプレートのダウンロードとExcelファイル（.xlsx）の一括取り込みができます。",
    ],
  },
  {
    title: "列を編集する",
    image: {
      src: "/images/notebook-guide/columns.png",
      alt: "「列を編集」パネル。列名の変更・削除と新しい列の追加ができる",
    },
    items: [
      "「列を編集」から、発音・例文などの列を追加したり、列名を変更・削除したりできます。",
      "1列目（見出し語）は削除できません。",
    ],
  },
  {
    title: "暗記学習をする",
    image: {
      src: "/images/notebook-guide/study.png",
      alt: "暗記学習モードのカード画面と「前へ」「シャッフル」「次へ」ボタン",
    },
    items: [
      "「暗記学習を始める」でカードを1枚ずつめくって覚えられます。",
      "項目が3つ以上ある単語は多角柱のカードになり、左右をクリックして面を回転させます。",
      "「おもて」で表に出す列を切り替え、「シャッフル」で出題順をランダムにできます。",
    ],
  },
  {
    title: "★で苦手な単語を復習する",
    image: {
      src: "/images/notebook-guide/stars.png",
      alt: "単語一覧の★と、「★を復習する」「★を一括リセット」ボタン",
    },
    items: [
      "覚えられなかった単語には★をつけましょう。つけた回数に応じて色が変わります（「★の色」で変更可）。",
      "★がついた単語があると「★を復習する」が表示され、★の単語だけを学習できます。",
      "★の横の数字をクリックすると回数を修正できます。「★を一括リセット」でまとめて0に戻せます。",
    ],
  },
  {
    title: "単語帳を共有する",
    image: {
      src: "/images/notebook-guide/share.png",
      alt: "公開中の共有リンクと「共同編集者を管理」パネルの招待リンク",
    },
    items: [
      "「リンクで共有する」を押すと単語帳が公開され、リンクを知っている人が閲覧・学習できます。",
      "「共同編集者を管理」から招待リンクを発行すると、参加した人と一緒に単語帳を編集できます。",
    ],
  },
];

// My単語帳ページに置く「使い方ガイド」ボタン。押すと、背景をぼかした（モザイク状の）オーバーレイの上に
// ガイドをスライド形式でポップアップ表示する。
// 背景クリック・×ボタン・Escキーで閉じ、←→キーや「前へ」「次へ」でスライドを切り替えられる
export default function NotebookGuideButton() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const isFirst = index === 0;
  const isLast = index === GUIDE_SLIDES.length - 1;
  const slide = GUIDE_SLIDES[index];

  function openGuide() {
    setIndex(0);
    setOpen(true);
  }

  // 開いている間はキーボード操作を受け付け、背面のページがスクロールしないよう固定する
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, GUIDE_SLIDES.length - 1));
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openGuide}
        className="rounded-full border border-coral-300 px-3 py-1.5 text-sm text-coral-700 transition-all hover:-translate-y-0.5 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-800 hover:shadow-md hover:shadow-coral-100 dark:border-coral-900/50 dark:text-coral-300 dark:hover:border-coral-600 dark:hover:bg-coral-950/20 dark:hover:text-coral-200 dark:hover:shadow-none"
      >
        使い方ガイド
      </button>

      {open &&
        createPortal(
          // ヘッダー（z-50）より上に重ねるため、document.body直下にポータルする
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notebook-guide-title"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md sm:p-6"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="relative flex h-[40rem] max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-black/[.06] px-6 py-4 dark:border-white/[.1]">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  My単語帳の使い方
                  <span className="ml-2 text-zinc-400 dark:text-zinc-500">
                    {index + 1} / {GUIDE_SLIDES.length}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="ガイドを閉じる"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  ×
                </button>
              </div>

              {/* スライド本体。モーダル・画像の高さを固定し、スライドを切り替えても「次へ」ボタンの位置がずれないようにする */}
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 text-left">
                <div className="relative h-48 w-full overflow-hidden rounded-xl border border-black/[.06] bg-zinc-50 sm:h-64 dark:border-white/[.1] dark:bg-zinc-800">
                  <Image
                    key={slide.image.src}
                    src={slide.image.src}
                    alt={slide.image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 560px"
                    className="object-contain p-2"
                  />
                </div>
                <h2
                  id="notebook-guide-title"
                  className="flex items-center gap-2 text-lg font-semibold text-black dark:text-zinc-50"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-500 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {slide.title}
                </h2>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {slide.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-black/[.06] px-6 py-4 dark:border-white/[.1]">
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  disabled={isFirst}
                  className="rounded-full border border-black/[.08] px-4 py-2 text-sm transition-colors hover:border-black/[.15] disabled:invisible dark:border-white/[.145] dark:hover:border-white/[.25]"
                >
                  前へ
                </button>

                {/* 現在位置を示すドット。押すとそのスライドへ直接移動する */}
                <div className="flex items-center gap-1.5">
                  {GUIDE_SLIDES.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`${i + 1}枚目: ${s.title}`}
                      aria-current={i === index ? "step" : undefined}
                      className={`h-2 rounded-full transition-all ${
                        i === index
                          ? "w-5 bg-coral-500"
                          : "w-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                      }`}
                    />
                  ))}
                </div>

                {isLast ? (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-600"
                  >
                    はじめる
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => i + 1)}
                    className="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-600"
                  >
                    次へ
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
