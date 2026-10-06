import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";

import HeaderNav from "@/components/HeaderNav";
import HeaderSearch from "@/components/HeaderSearch";
import type { HeaderNavLink } from "@/components/HeaderNavClient";
import ThemeToggle from "@/components/ThemeToggle";

// ヘッダーロゴ「Vocabook」専用の見出しフォント（トップページの見出しと統一感を出す）
const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const NAV_LINKS: HeaderNavLink[] = [
  {
    href: "/my-notebooks",
    label: "My単語帳",
    hoverClassName: "hover:text-[#FF7F50] dark:hover:text-[#FF7F50]",
  },
  {
    href: "/learn",
    label: "学習教材",
    hoverClassName: "hover:text-[#1E9A9C] dark:hover:text-[#6FD1D1]",
  },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/5 dark:bg-zinc-600/80 backdrop-blur-md border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4">
        <Link href="/" className="flex item-center gap-3">
          <Image
            src="/logo-dummy.png"
            alt="Vocabook ロゴ"
            width={32}
            height={32}
            className="h-10 w-auto object-contain"
          />
          <span
            className={`${bebasNeue.variable} inline-block text-[clamp(1.2rem,4.5vw,2.125rem)] tracking-[0.06em] self-center transition-transform duration-300 ease-out [font-family:var(--font-bebas-neue)] hover:scale-110 hover:[text-shadow:0_2px_3px_rgba(39,39,42,0.55)] dark:hover:[text-shadow:0_2px_3px_rgba(228,228,231,0.45)]`}
          >
            Vocabook
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* PCではヘッダーに検索欄を置く。スマホはハンバーガーメニュー内に表示する */}
          <HeaderSearch className="hidden w-48 md:block lg:w-60" />
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
            <HeaderNav links={NAV_LINKS} />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
