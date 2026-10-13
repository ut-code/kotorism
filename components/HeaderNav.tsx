import { getCurrentUser } from "@/lib/session";
import type { AllLanguageSections } from "@/app/learn/content";
import HeaderNavClient, { type HeaderNavLink } from "@/components/HeaderNavClient";

// ヘッダーの中で唯一セッションを参照する部分。ここをSuspenseで囲むことで、
// 静的な部分（ロゴ・PC用ナビなど）を動的レンダリングに巻き込むのを防ぐ
export default async function HeaderNav({
  links,
  allSections,
}: {
  links: HeaderNavLink[];
  allSections: AllLanguageSections;
}) {
  const user = await getCurrentUser();

  return <HeaderNavClient links={links} allSections={allSections} userName={user?.name ?? null} />;
}
