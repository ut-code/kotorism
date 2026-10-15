import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 単体テストは app/lib/shared の DB に触れない純粋関数が対象。React Router のプラグインは読み込まない
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) } },
  test: { include: ["app/lib/**/*.test.ts"] },
});
