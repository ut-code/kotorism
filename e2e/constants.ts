import path from "node:path";

// e2e 用ユーザー。DB は実行ごとに作り直すので固定でよい
export const E2E_USER = { name: "e2e_user", password: "password-1234" };

// setup プロジェクトが保存するログイン済みの状態(Cookie)
export const STORAGE_STATE = path.join(import.meta.dirname, "../node_modules/.cache/e2e/user.json");
