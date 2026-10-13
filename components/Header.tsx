import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import HeaderNav from "@/components/HeaderNav";
import type { HeaderNavLink } from "@/components/HeaderNavClient";
import ThemeToggle from "@/components/ThemeToggle";
import BrandName from "@/components/brand-name";
import type { AllLanguageSections } from "@/app/learn/content";

const NAV_LINKS: HeaderNavLink[] = [
  {
    href: "/my-notebooks",
    label: "My単語帳",
    hoverClassName: "hover:text-coral-500 dark:hover:text-coral-500",
  },
  {
    href: "/learn",
    label: "学習教材",
    hoverClassName: "hover:text-[#1E9A9C] dark:hover:text-[#6FD1D1]",
  },
];

export default function Header({ allSections }: { allSections: AllLanguageSections }) {
  return (
    <header className="sticky top-0 z-50 bg-white/5 dark:bg-zinc-600/80 backdrop-blur-md border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4">
        <Link href="/" className="flex item-center gap-3">
          <Image
            src="/logo-dummy.png"
            alt="ことりずむ ロゴ"
            width={32}
            height={32}
            className="h-10 w-auto object-contain"
          />
          <span className="inline-block self-center text-[clamp(1.2rem,4.5vw,2.125rem)] tracking-[0.06em]">
            <BrandName />
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav className="hidden items-center gap-x-4 text-[clamp(1rem,2.2vw,1.125rem)] font-semibold tracking-[0.04em] text-zinc-600 md:flex dark:text-zinc-200">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap transition-colors ${link.hoverClassName}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Suspense
            fallback={
              <>
                <div className="hidden h-9 w-24 md:block" />
                <div className="h-9 w-9 md:hidden" />
              </>
            }
          >
            <HeaderNav links={NAV_LINKS} allSections={allSections} />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
