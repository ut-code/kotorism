import { useEffect, useRef, useState } from "react";

// 単語帳のページの「⋯」ボタン。たまにしか使わない操作（Excelからの追加・★の一括リセットなど）をまとめる。
// 項目を押したら閉じる。メニューの外を押す・Esc でも閉じる
export default function NotebookMoreMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="その他の操作"
        title="その他の操作"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[.08] text-lg leading-none text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div
          role="menu"
          // 項目（ボタン・フォームの送信）を押したら閉じる。確認ダイアログは項目側で出す
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button")) setOpen(false);
          }}
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-black/[.08] bg-white py-1 shadow-lg dark:border-white/[.145] dark:bg-zinc-900"
        >
          {children}
        </div>
      )}
    </div>
  );
}
