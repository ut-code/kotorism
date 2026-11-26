// ページごとのフッターの出し方。
// - full:    トップページ（LP）だけ。サークル紹介・SNS つきの大きなフッター
// - compact: アプリ内の画面。お問い合わせとクレジットの1行だけ
// - none:    暗記学習・クイズ・★復習の最中。練習の画面の下に余白を作らない
export type FooterVariant = "full" | "compact" | "none";

// /my-notebooks/<id>/study など、単語帳の練習画面（自分の単語帳と共有リンクの両方）
const PRACTICE_PATH = /^\/(my-notebooks|share)\/[^/]+\/(study|quiz|review)\/?$/;

export function footerVariant(pathname: string): FooterVariant {
  if (pathname === "/") return "full";
  if (PRACTICE_PATH.test(pathname)) return "none";
  return "compact";
}
