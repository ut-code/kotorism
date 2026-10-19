// My単語帳・最近の学習履歴・学習教材のページ見出し。フリックや ◀▶ で行き来したときに見出しが動いて見えないよう、
// 3ページで同じ大きさ・同じ位置（中央揃え）にする。ページ本体の <main> には PAGE_MAIN_CLASS を使う
export default function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
      {children}
    </h1>
  );
}

// 上の3ページの <main> の余白。見出しの縦位置を揃えるため共通にする
export const PAGE_MAIN_CLASS = "flex flex-1 flex-col items-center px-6 py-16 sm:py-24";
