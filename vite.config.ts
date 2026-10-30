import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig, lazyPlugins } from "vite-plus";

import { mdxPlugin } from "./mdx-plugin.ts";

export default defineConfig({
  fmt: {
    ignorePatterns: [],
  },
  lint: {
    plugins: ["typescript", "react"],
    rules: {
      "react/purity": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    categories: {
      correctness: "error",
    },
    ignorePatterns: [
      ".react-router/**",
      "build/**",
      "app/generated/**",
      ".worktree/**",
      ".worktrees/**",
    ],
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  // BETTER_AUTH_URL(.env)のオリジンに合わせる
  server: { port: 3000 },
  resolve: {
    // tsconfig の paths(@/*)。.mdx は tsconfig の対象外なので、alias でも同じものを指定する
    alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) },
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(() => [tailwindcss(), mdxPlugin(), reactRouter()]),
});
