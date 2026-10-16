import { getSections } from "@/lib/shared/learn/content";
import SectionLayout from "@/components/learn/SectionLayout";
import type { Route } from "./+types/route";

// スペイン語セクションのレイアウト（learn._<言語> のレイアウト）。
// 見た目は全言語共通の SectionLayout に任せる
export async function loader() {
  return { sections: await getSections("spanish") };
}

export default function SpanishSectionLayout({ loaderData }: Route.ComponentProps) {
  return <SectionLayout languageSlug="spanish" sections={loaderData.sections} />;
}
