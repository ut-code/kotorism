declare module "*.mdx" {
  import type { ReactNode } from "react";

  // 各ページが export している title(サイドバーや目次の見出し)。route.tsx が再 export する
  export const title: string;
  // セクション冒頭に出す説明。app/components/learn/SectionLayout.tsx が表示する
  export const description: string | undefined;
  export default function MDXContent(props: Record<string, unknown>): ReactNode;
}
