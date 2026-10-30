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
    include: ["app/**/*.test.ts"],
    environment: "node",
  },
});
