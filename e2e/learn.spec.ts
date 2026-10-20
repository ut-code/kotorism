import { expect, test } from "@playwright/test";

test.describe("学習教材", () => {
  test("言語の一覧から、各言語のセクション一覧に入れる", async ({ page }) => {
    await page.goto("/learn");
    await page
      .getByRole("link", { name: /中国語/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/learn\/chinese$/);
  });

  test("MDX で書かれたセクション(中国語 05)が描画される", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    await expect(page.getByRole("heading", { level: 1, name: "文法クイズ" })).toBeVisible();
  });

  test("共通クイズで回答して次の問題へ進める", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    await page.getByRole("button", { name: "練習を始める" }).click();

    await expect(page.getByRole("progressbar", { name: "進み具合" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    const choices = page.locator(".max-w-xl .flex.flex-col.gap-2 > button");
    await expect(choices).toHaveCount(4);
    await choices.first().click();

    await expect(page.getByRole("status")).toContainText(/正解|不正解/);
    await page.getByRole("button", { name: "次の問題へ" }).click();
    await expect(page.getByRole("progressbar", { name: "進み具合" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  });

  test("文法クイズは全問を4択で出題し、どの問題にも解説が出る", async ({ page }) => {
    // 全単元の問題を1問ずつ解くので時間がかかる
    test.slow();
    await page.goto("/learn/chinese/05");
    await page.getByRole("button", { name: /^問題数/ }).click();
    await page.getByRole("radio", { name: "全問" }).click();
    await page.getByRole("button", { name: "練習を始める" }).click();

    const choices = page.locator(".max-w-xl .flex.flex-col.gap-2 > button");
    const focuses = new Set<string>();
    for (;;) {
      await expect(choices).toHaveCount(4);
      await expect(page.getByRole("textbox")).toHaveCount(0);
      const instruction = await page.getByText(/^(意味|形|文脈|穴埋め)　/).textContent();
      focuses.add(instruction?.split("　")[0] ?? "");
      await choices.first().click();
      await expect(page.getByRole("status")).toContainText("解説:");

      const next = page.getByRole("button", { name: /次の問題へ|結果を見る/ });
      const isLast = (await next.textContent()) === "結果を見る";
      await next.click();
      if (isLast) break;
    }
    expect(focuses).toEqual(new Set(["意味", "形", "文脈", "穴埋め"]));
  });

  test("文法クイズは単元を選ぶと、その単元の問題だけを出題する", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    const summary = page.getByText(/問を出題します$/);
    const totalText = await summary.textContent();

    await page.getByRole("button", { name: /^出題する単元/ }).click();
    await page.getByRole("button", { name: "全て解除" }).click();
    await expect(page.getByRole("button", { name: "練習を始める" })).toBeDisabled();
    await expect(page.getByText("出題する単元を1つ以上選んでください。")).toBeVisible();

    await page.getByRole("checkbox", { name: /時相・アスペクト/ }).check();
    await page.getByRole("button", { name: /^問題数/ }).click();
    await page.getByRole("radio", { name: "全問" }).click();
    await expect(summary).toHaveText(/^\d+ 問を出題します$/);
    const total = Number(/(\d+) 問から/.exec(totalText ?? "")?.[1]);
    const aspectCount = Number(/^(\d+)/.exec((await summary.textContent()) ?? "")?.[1]);
    expect(aspectCount).toBeGreaterThan(0);
    expect(aspectCount).toBeLessThan(total);

    await page.getByRole("button", { name: "練習を始める" }).click();
    for (let i = 0; i < aspectCount; i++) {
      await page.getByRole("button", { name: /^1/ }).click();
      // 時相の問題の解説は、どれも了・着・过のいずれかを扱う
      await expect(page.getByRole("status")).toContainText(/[了着过]/);
      await page.getByRole("button", { name: /次の問題へ|結果を見る/ }).click();
    }
    await expect(page.getByRole("button", { name: "練習を始める" })).toHaveCount(0);
  });

  test("TSX で書かれたセクション(フランス語 01)が描画される", async ({ page }) => {
    const response = await page.goto("/learn/french/01");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  });
});
