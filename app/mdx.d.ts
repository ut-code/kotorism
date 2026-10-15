declare module "*.mdx" {
  import type { ReactNode } from "react";

  // 各ページが export している title(サイドバーや目次の見出し)。route.tsx が再 export する
  export const title: string;
  export default function MDXContent(props: Record<string, unknown>): ReactNode;
}
