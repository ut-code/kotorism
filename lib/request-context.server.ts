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

// ログイン後の戻り先などに使う、リクエストのパス+クエリ。クライアント遷移では
// "/learn.data?_routes=..." のようなデータリクエストのURLになるので、通常のURLに戻す
export function getRequestPath(request: Request): string {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/_\.data$/, "/").replace(/\.data$/, "");
  url.searchParams.delete("_routes");
  return pathname + url.search;
}
