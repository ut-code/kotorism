// テーマの保存先キー。layout.tsxの初回描画前に走るインラインスクリプトと合わせている
const STORAGE_KEY = "theme";

// ライト/ダークモードを切り替えるボタン。
// htmlの.darkクラスを付け外しするだけで、実際の見た目は各コンポーネントのdark:クラスと
// globals.cssが担う。アイコンの出し分けもCSS（dark:hidden / dark:block）で行うため、
// サーバー側でテーマを知らなくてもハイドレーションのズレが起きない。
export default function ThemeToggle() {
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      // 次回以降の訪問でも選択を維持する。localStorageが使えない環境ではクラスの切り替えのみ行う
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // 保存できない場合はそのまま（現在のセッション内では切り替えが有効）
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title="ライト/ダークモードを切り替える"
      aria-label="ライト/ダークモードを切り替える"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[.08] text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {/* ライトモードのときは太陽、ダークモードのときは月を表示する */}
      <svg
        aria-hidden="true"
        className="h-5 w-5 dark:hidden"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="hidden h-5 w-5 dark:block"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
        />
      </svg>
    </button>
  );
}
