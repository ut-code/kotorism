import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import type { Plugin } from "vite";

// MDX は React Router より前に変換する(GFM のテーブル等を有効にする)。
// @mdx-js/rollup は id のクエリ(?raw)を無視して変換してしまうため、教材の生テキストを読む
// import(app/lib/shared/mdx-source.ts の ?raw)は変換せずそのまま通す
export function mdxPlugin(): Plugin {
  const plugin = mdx({ remarkPlugins: [remarkGfm] }) as Plugin & {
    transform: (this: unknown, code: string, id: string) => unknown;
  };
  const transform = plugin.transform;
  return {
    ...plugin,
    enforce: "pre",
    transform(code: string, id: string) {
      if (id.endsWith("?raw")) return null;
      return transform.call(this, code, id);
    },
  } as Plugin;
}
