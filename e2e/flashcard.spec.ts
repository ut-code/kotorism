import { expect, test } from "@playwright/test";

test("多面カードは、下の「◀ 左: 戻る」「右: 進む ▶」をクリックしても回転する", async ({
  page,
  baseURL,
}) => {
  // 単語帳の作り方（一覧の画面）に左右されないよう、作成はサーバーへ直接頼む。作成後の単語帳のページへの移動先から URL を得る
  const created = await page.request.post("/my-notebooks", {
    form: { intent: "createBlankNotebook", title: "e2e 用の多面単語帳" },
    headers: { Origin: baseURL! },
    maxRedirects: 0,
  });
  const notebookUrl = new URL(created.headers()["location"], baseURL).pathname;

  // 列を3つ（見出し語・意味・例文）にして、3面のカードになる単語を1件入れる
  const post = (form: Record<string, string>) =>
    page.request.post(notebookUrl, { form, headers: { Origin: baseURL! } });
  expect((await post({ intent: "addColumn", name: "例文" })).ok()).toBe(true);
  expect(
    (
      await post({
        intent: "createCard",
        head: "bonjour",
        "row:0:意味": "こんにちは",
        "row:0:例文": "Bonjour, Marie.",
      })
    ).ok(),
  ).toBe(true);

  await page.goto(`${notebookUrl}/study`);
  const current = page.getByRole("status").filter({ hasText: "表示中の面" });
  await expect(current).toHaveText("表示中の面: 見出し語");

  await page.getByRole("button", { name: "右: 進む ▶" }).click();
  await expect(current).toHaveText("表示中の面: 意味");

  await page.getByRole("button", { name: "◀ 左: 戻る" }).click();
  await expect(current).toHaveText("表示中の面: 見出し語");

  await page.getByRole("button", { name: "◀ 左: 戻る" }).click();
  await expect(current).toHaveText("表示中の面: 例文");
});
