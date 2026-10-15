import Link from "@/components/Link";
import { useLocation } from "react-router";
import type { SectionSummary } from "@/lib/shared/learn/content";

export default function SectionNav({ sections }: { sections: SectionSummary[] }) {
  const { pathname } = useLocation();
  const currentSlug = pathname.split("/").pop();

  const currentIndex = sections.findIndex((section) => section.sectionSlug === currentSlug);

  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection =
    currentIndex >= 0 && currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  return (
    <div className="mt-8 flex w-full max-w-3xl justify-between">
      {prevSection ? (
        <Link href={`/learn/french/${prevSection.sectionSlug}`}>← {prevSection.title}</Link>
      ) : (
        <span />
      )}
      {nextSection ? (
        <Link href={`/learn/french/${nextSection.sectionSlug}`}>{nextSection.title} →</Link>
      ) : (
        <span />
      )}
    </div>
  );
}
