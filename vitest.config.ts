import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { mdxPlugin } from "./mdx-plugin.ts";

// app/lib/shared の純粋関数と、app/lib/server の DB に触れるコード(インメモリ DB)をテストする。
// React Router のプラグインは読み込まない。教材の一覧(content.ts)が route.tsx 経由で content.mdx を
// 読み込むため、MDX の変換だけは入れる
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) } },
  plugins: [mdxPlugin()],
  test: {
    // DB に触れるテスト(app/lib/server)用のインメモリ SQLite。テストファイルごとに別プロセスで動くため、
    // ファイルをまたいでデータは共有されない。マイグレーションは各テストが applyMigrations() で当てる
    env: { DATABASE_URL: "file::memory:?cache=shared" },
    // 1画面で完結する UI の振る舞い(*.test.tsx)は、ブラウザを立ち上げずに jsdom で確かめる。
    // そうしないと e2e に入れるしかなく、CI が遅くなる
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["app/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          include: ["app/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
