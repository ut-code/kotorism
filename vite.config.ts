import { reactRouter } from "@react-router/dev/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

// MDX は React Router より前に変換する(GFM のテーブル等を有効にする)。
// @mdx-js/rollup は id のクエリ(?raw)を無視して変換してしまうため、教材の生テキストを読む
// import(lib/mdx-source.ts の ?raw)は変換せずそのまま通す
function mdxPlugin(): Plugin {
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

export default defineConfig({
  // BETTER_AUTH_URL(.env)のオリジンに合わせる
  server: { port: 3000 },
  resolve: {
    // tsconfig の paths(@/*)。.mdx は tsconfig の対象外なので、alias でも同じものを指定する
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), mdxPlugin(), reactRouter()],
});
