import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// app/lib/shared の純粋関数と、app/lib/server の DB に触れるコード(インメモリ DB)をテストする。
// React Router のプラグインは読み込まない
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) } },
  test: {
    include: ["app/lib/**/*.test.ts"],
    // DB に触れるテスト(app/lib/server)用のインメモリ SQLite。テストファイルごとに別プロセスで動くため、
    // ファイルをまたいでデータは共有されない。マイグレーションは各テストが applyMigrations() で当てる
    env: { DATABASE_URL: "file::memory:?cache=shared" },
  },
});
