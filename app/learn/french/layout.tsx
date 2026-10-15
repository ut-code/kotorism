import { getSections } from "@/app/learn/content";
import SectionLayout from "@/components/learn/SectionLayout";
import type { Route } from "./+types/layout";

// フランス語セクションのレイアウト（各言語ディレクトリの layout.tsx はファイル自体が必須）。
// 見た目は全言語共通の SectionLayout に任せる
export async function loader() {
  return { sections: await getSections("french") };
}

export default function FrenchSectionLayout({ loaderData }: Route.ComponentProps) {
  return <SectionLayout languageSlug="french" sections={loaderData.sections} />;
}
