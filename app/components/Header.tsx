import Image from "@/components/Image";
import Link from "@/components/Link";

import HeaderNavClient, { type HeaderNavLink } from "@/components/HeaderNavClient";
import ThemeToggle from "@/components/ThemeToggle";
import BrandName from "@/components/BrandName";
import type { AllLanguageSections } from "@/lib/shared/learn/content";

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

export default function Header({
  allSections,
  userName,
}: {
  allSections: AllLanguageSections;
  // ログイン中のユーザー名。未ログインならnull
  userName: string | null;
}) {
  // My単語帳・学習教材はログインしないと使えないため、未ログインではリンクを出さない
  const navLinks = userName ? NAV_LINKS : [];

  return (
    <header className="sticky top-0 z-50 bg-white/5 dark:bg-zinc-600/80 backdrop-blur-md border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="ことりずむ ロゴ"
            width={756}
            height={644}
            className="h-10 w-auto object-contain"
          />
          <span className="inline-block self-center text-[clamp(1.2rem,4.5vw,2.125rem)] tracking-[0.06em]">
            <BrandName />
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {navLinks.length > 0 && (
            <nav className="hidden items-center gap-x-4 text-[clamp(1rem,2.2vw,1.125rem)] font-semibold tracking-[0.04em] text-zinc-600 md:flex dark:text-zinc-200">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap transition-colors ${link.hoverClassName}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          <HeaderNavClient links={navLinks} allSections={allSections} userName={userName} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
