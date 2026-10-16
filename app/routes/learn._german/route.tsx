import { getSections } from "@/lib/shared/learn/content";
import SectionLayout from "@/components/learn/SectionLayout";
import type { Route } from "./+types/route";

// ドイツ語セクションのレイアウト（learn._<言語> のレイアウト）。
// 見た目は全言語共通の SectionLayout に任せる
export async function loader() {
  return { sections: await getSections("german") };
}

export default function GermanSectionLayout({ loaderData }: Route.ComponentProps) {
  return <SectionLayout languageSlug="german" sections={loaderData.sections} />;
}
