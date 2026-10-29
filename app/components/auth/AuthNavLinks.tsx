import Link from "@/components/Link";
import { useLocation } from "react-router";

// ヘッダーの「ログイン」「新規登録」リンク。今いるページをredirectパラメータに載せておき、
// ログイン・登録が終わったら（デフォルトのMy単語帳ではなく）元のページへ戻れるようにする
export default function AuthNavLinks() {
  const { pathname } = useLocation();
  const redirectQuery = `redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/login?${redirectQuery}`}
        className="whitespace-nowrap text-base font-medium text-zinc-600 transition-colors hover:text-zinc-400 dark:text-zinc-200 dark:hover:text-zinc-400"
      >
        ログイン
      </Link>
      <Link
        href={`/signup?${redirectQuery}`}
        className="whitespace-nowrap rounded-full bg-black px-4 py-1.5 text-base font-medium text-white transition-colors hover:bg-zinc-600 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
      >
        新規登録
      </Link>
    </div>
  );
}
