import { getLanguage } from "@/app/learn/languages";
import { SectionReviewControls } from "@/components/learn/SectionReviewControls";
import { SectionViewTracker } from "@/components/learn/SectionViewTracker";

const language = getLanguage("chinese");

// 中国語セクション専用レイアウト（各言語ディレクトリの layout.tsx はファイル自体が必須）
export default function ChineseSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{language?.label}</p>
        <SectionReviewControls />
        <SectionViewTracker />
      </div>
      <div className="chinese-content mt-8 w-full max-w-3xl text-left">{children}</div>
    </main>
  );
}
