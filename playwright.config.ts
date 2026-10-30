import { mkdirSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

import { STORAGE_STATE } from "./e2e/constants";

const port = 3100;
const baseURL = `http://localhost:${port}`;

// e2e は毎回まっさらな SQLite DB(webServer のコマンドで作り直す)で、ビルド済みのサーバーを起動して実行する
const cacheDir = path.join(import.meta.dirname, "node_modules/.cache/e2e");
const dbFile = path.join(cacheDir, "e2e.db");
mkdirSync(cacheDir, { recursive: true });

export default defineConfig({
  testDir: "./e2e",
  outputDir: path.join(cacheDir, "results"),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    // 手元・CI に入っている Chrome を使う(Playwright のブラウザのダウンロードは不要)
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chrome",
      use: { storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `rm -f "${dbFile}" && npm run build && npx prisma migrate deploy && PORT=${port} npx react-router-serve ./build/server/index.js`,
    url: `${baseURL}/login`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: `file:${dbFile}`,
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-0000",
      // 本物の Google ログインは自動化できないので、e2e のユーザーはパスワードで作る
      PASSWORD_SIGNUP: "true",
    },
  },
});
