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

  test("言語ごとの一覧から、言語一覧に戻れる", async ({ page }) => {
    await page.goto("/learn/french");
    await page.getByRole("link", { name: "言語一覧に戻る" }).click();
    await expect(page).toHaveURL(/\/learn$/);
  });

  test("各教材のページから、その言語の学習教材一覧に戻れる", async ({ page }) => {
    await page.goto("/learn/french/01");
    await page.getByRole("link", { name: "学習教材一覧に戻る" }).click();
    await expect(page).toHaveURL(/\/learn\/french$/);
  });

  test("MDX で書かれたセクション(中国語 05)が描画される", async ({ page }) => {
    await page.goto("/learn/chinese/05");
    await expect(
      page.getByRole("heading", { level: 1, name: "文法クイズ", exact: true }),
    ).toBeVisible();
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

  for (const { path, title } of [
    { path: "/learn/chinese/05", title: "文法クイズ" },
    { path: "/learn/french/05", title: "文法クイズ（基本1）" },
    { path: "/learn/french/06", title: "文法クイズ（基本2）" },
    { path: "/learn/german/05", title: "文法クイズ（格変化）" },
    { path: "/learn/german/06", title: "文法クイズ（その他）" },
    { path: "/learn/spanish/05", title: "文法クイズ（基本）" },
  ]) {
    test(`${title}(${path})は全問を4択で出題し、どの問題にも解説が出る`, async ({ page }) => {
      // 全単元の問題を1問ずつ解くので時間がかかる
      test.slow();
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
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
  }

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

  for (const language of ["chinese", "french", "german", "spanish"]) {
    test(`${language}: セクション一覧に同じ教材が重複して出ない`, async ({ page }) => {
      await page.goto(`/learn/${language}`);
      const links = page.locator("main a[aria-label]");
      await expect(links.first()).toBeVisible();
      const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
      const titles = await links.evaluateAll((els) =>
        els.map((el) => el.getAttribute("aria-label")),
      );
      expect(new Set(hrefs).size, hrefs.join(", ")).toBe(hrefs.length);
      expect(new Set(titles).size, titles.join(", ")).toBe(titles.length);
    });
  }

  for (const { language, order } of [
    {
      language: "french",
      order: ["文法クイズ（基本1）", "文法クイズ（基本2）", "文法クイズ（紛らわしい表現）"],
    },
    { language: "spanish", order: ["文法クイズ（基本）", "文法クイズ（紛らわしい表現）"] },
    { language: "german", order: ["文法クイズ（格変化）", "文法クイズ（その他）"] },
  ]) {
    test(`${language}: 文法クイズは「${order.join("」→「")}」の順に並ぶ`, async ({ page }) => {
      await page.goto(`/learn/${language}`);
      const titles = await page
        .locator("main a[aria-label]")
        .evaluateAll((links) => links.map((link) => link.getAttribute("aria-label")));
      const first = titles.indexOf(order[0]);
      expect(first).toBeGreaterThanOrEqual(0);
      expect(titles.slice(first, first + order.length)).toEqual(order);
    });
  }

  test("文法クイズの「出題する単元」は、チェックマークのない同じ高さの丸いチップで並ぶ", async ({
    page,
  }) => {
    await page.goto("/learn/french/05");
    await page.getByRole("button", { name: /^出題する単元/ }).click();
    const chips = page.locator("main").getByRole("checkbox");
    await expect(chips.first()).toBeVisible();
    const shapes = await chips.evaluateAll((elements) =>
      elements.map((chip) => ({
        height: Math.round(chip.getBoundingClientRect().height),
        round:
          parseFloat(getComputedStyle(chip).borderRadius) >=
          chip.getBoundingClientRect().height / 2,
        hasMark: chip.querySelector("input, svg") !== null,
      })),
    );
    expect(shapes.length).toBeGreaterThan(5);
    expect(new Set(shapes.map((s) => s.height)).size).toBe(1);
    expect(shapes.every((s) => s.round && !s.hasMark)).toBe(true);

    // チップを押すと選択を切り替えられる
    const negation = page.getByRole("checkbox", { name: /否定表現/ });
    await negation.uncheck();
    await expect(negation).not.toBeChecked();
    await negation.check();
    await expect(negation).toBeChecked();
  });

  test("TSX で書かれたセクション(フランス語 01)が描画される", async ({ page }) => {
    const response = await page.goto("/learn/french/01");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  });
});
