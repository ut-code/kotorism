import { getSections } from "@/app/learn/content";
import SectionLayout from "@/components/learn/SectionLayout";
import type { Route } from "./+types/layout";

// スペイン語セクションのレイアウト（各言語ディレクトリの layout.tsx はファイル自体が必須）。
// 見た目は全言語共通の SectionLayout に任せる
export async function loader() {
  return { sections: await getSections("spanish") };
}

export default function SpanishSectionLayout({ loaderData }: Route.ComponentProps) {
  return <SectionLayout languageSlug="spanish" sections={loaderData.sections} />;
}
