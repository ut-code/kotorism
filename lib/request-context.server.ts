import { AsyncLocalStorage } from "node:async_hooks";
import type { User } from "better-auth";

type RequestStore = {
  request: Request;
  // getCurrentUser の結果をリクエスト内でメモ化する(同一リクエストでDBを何度も引かない)
  user?: Promise<User | null>;
};

const storage = new AsyncLocalStorage<RequestStore>();

// root の middleware から呼ぶ。以降の loader / action / 下位 middleware では
// getRequestStore() で同じ Request を参照できる
export function runWithRequest<T>(request: Request, fn: () => T): T {
  return storage.run({ request }, fn);
}

export function getRequestStore(): RequestStore {
  const store = storage.getStore();
  if (!store)
    throw new Error("リクエストの外から呼ばれました(root の middleware を確認してください)");
  return store;
}
