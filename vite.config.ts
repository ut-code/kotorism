import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { mdxPlugin } from "./mdx-plugin.ts";

export default defineConfig({
  // BETTER_AUTH_URL(.env)のオリジンに合わせる
  server: { port: 3000 },
  resolve: {
    // tsconfig の paths(@/*)。.mdx は tsconfig の対象外なので、alias でも同じものを指定する
    alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) },
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), mdxPlugin(), reactRouter()],
});
