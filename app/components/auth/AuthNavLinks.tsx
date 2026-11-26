import Link from "@/components/Link";
import { useLocation } from "react-router";

// ヘッダーの「ログイン / 新規登録」ボタン。Google ログインは初回にそのまま登録されるので1つにまとめている。
// 今いるページをredirectパラメータに載せておき、ログインが終わったら（デフォルトのMy単語帳ではなく）元のページへ戻れるようにする
export default function AuthNavLinks() {
  const { pathname } = useLocation();
  const redirectQuery = `redirect=${encodeURIComponent(pathname)}`;

  return (
    <Link
      href={`/login?${redirectQuery}`}
      className="whitespace-nowrap rounded-full bg-black px-4 py-1.5 text-base font-medium text-white transition-colors hover:bg-zinc-600 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
    >
      ログイン / 新規登録
    </Link>
  );
}
