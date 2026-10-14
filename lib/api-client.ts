// client component から /api/* の resource route を呼ぶ小さなヘルパー。
// 画面の loader を再検証する必要のない、読み取り・記録用の呼び出しに使う
// (一覧などを更新したい操作は useFetcher / fetcher.Form で route の action に送る)

export async function apiGet<T>(url: string, params: Record<string, string>): Promise<T> {
  const response = await fetch(`${url}?${new URLSearchParams(params)}`);
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${url} failed: ${response.status}`);
  return response.json() as Promise<T>;
}
