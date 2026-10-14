declare module "*.mdx" {
  import type { ReactNode } from "react";

  // 各ページが export している title(サイドバーや目次の見出し)は、
  // app/learn/content.ts が import.meta.glob で読むため、ここでは宣言しない
  export default function MDXContent(props: Record<string, unknown>): ReactNode;
}
