import Link from "@/components/Link";

import { SectionBookmarkButton } from "@/components/learn/SectionBookmarkButton";
import { practiceEstimateLabel, type PracticeKind } from "@/lib/shared/learn/practice-estimate";
import {
  sectionCardStatusLabel,
  type SectionCardStatus,
} from "@/lib/shared/learn/section-card-status";

interface SectionCardProps {
  href: string;
  index: number;
  title: string;
  language: string;
  sectionSlug: string;
  isLoggedIn: boolean;
  manuallyTagged: boolean;
  // 進み具合（未着手・取り組んだ・通算の正解数）
  status: SectionCardStatus;
  // 1問ずつ出題する演習の答え方。あれば「10問・約2分」と所要時間の目安を添える
  practiceKind: PracticeKind | null;
}

// /learn/[language] のセクション一覧カード。ブックマークは manuallyTagged の有無にかかわらず
// 必ず表示し、塗りつぶし（苦手）か輪郭のみ（通常）かでひと目で状態がわかるようにする。
// カード全体はセクションへのリンクだが、ブックマーク部分だけは独立してクリックでき、
// その場でタグをON/OFFできる（Linkを絶対配置の背面レイヤーにして重ねている）。
// 右端の「＞」はボタンに見えないよう、丸い背景を付けない飾りにしている
export function SectionCard({
  href,
  index,
  title,
  language,
  sectionSlug,
  isLoggedIn,
  manuallyTagged,
  status,
  practiceKind,
}: SectionCardProps) {
  return (
    <div className="group relative flex items-center justify-between rounded-2xl border border-tealblue-200 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-tealblue-300 hover:shadow-xl hover:shadow-tealblue-100 dark:border-tealblue-600 dark:bg-tealblue-900 dark:hover:border-tealblue-400 dark:hover:bg-tealblue-800 dark:hover:shadow-none">
      <Link href={href} aria-label={title} className="absolute inset-0 rounded-2xl" />
      <div className="pointer-events-none flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-tealblue-600 dark:text-tealblue-300">
          Section {index + 1}
        </span>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{title}</span>
        <span
          className={`text-xs ${
            status.kind === "new"
              ? "text-zinc-500 dark:text-tealblue-200"
              : "font-medium text-tealblue-700 dark:text-tealblue-200"
          }`}
        >
          {status.kind !== "new" && <span aria-hidden="true">✓ </span>}
          {sectionCardStatusLabel(status)}
          {practiceKind && (
            <span className="font-normal text-zinc-500 dark:text-tealblue-200">
              {" ・ "}
              {practiceEstimateLabel(practiceKind)}
            </span>
          )}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SectionBookmarkButton
          language={language}
          sectionSlug={sectionSlug}
          isLoggedIn={isLoggedIn}
          initialActive={manuallyTagged}
        />
        <div className="pointer-events-none text-zinc-500 transition-colors group-hover:text-tealblue-600 dark:text-tealblue-300 dark:group-hover:text-tealblue-50">
          <svg
            aria-hidden="true"
            className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
