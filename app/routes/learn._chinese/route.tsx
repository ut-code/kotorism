import { getSections } from "@/lib/shared/learn/content";
import SectionLayout from "@/components/learn/SectionLayout";
import type { Route } from "./+types/route";

// 中国語セクションのレイアウト（learn._<言語> のレイアウト）。
// 見た目は全言語共通の SectionLayout に任せる
export async function loader() {
  return { sections: await getSections("chinese") };
}

// 日本語フォントに無い簡体字を表示するため、中国語（簡体字）のフォントも読み込む
export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap",
  },
];

export default function ChineseSectionLayout({ loaderData }: Route.ComponentProps) {
  return (
    <SectionLayout
      languageSlug="chinese"
      sections={loaderData.sections}
      className="chinese-font-fallback"
    />
  );
}
