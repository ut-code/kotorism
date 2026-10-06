import Form from "next/form";

// ヘッダーの検索欄。送信すると /search?q=... へ移動する（JSが無くても動く）
export default function HeaderSearch({ className = "" }: { className?: string }) {
  return (
    <Form action="/search" role="search" className={className}>
      <input
        type="search"
        name="q"
        required
        placeholder="単語・教材を検索"
        aria-label="単語・教材を検索"
        className="w-full rounded-full border border-black/[.08] bg-white/60 px-4 py-1.5 text-sm text-zinc-800 outline-none transition-colors focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-zinc-400"
      />
    </Form>
  );
}
