import { expect, test, type Page } from "@playwright/test";

// ブラウザの読み上げを差し替え、読み上げた文字列を window.__spoken に記録する
async function recordSpeech(page: Page) {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
    if (!("SpeechSynthesisUtterance" in window)) {
      (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      };
    }
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak(utterance: SpeechSynthesisUtterance) {
          spoken.push(utterance.text);
          setTimeout(() => utterance.onend?.(new Event("end") as SpeechSynthesisEvent), 10);
        },
        cancel() {},
        getVoices: () => [],
      },
    });
  });
}

const spoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.slice());

test.describe("フランス語の発音クイズ", () => {
  test.beforeEach(async ({ page }) => {
    await recordSpeech(page);
  });

  test("文法クイズと同じく、開始ボタンが上にあり、単元・形式を丸いチップで選べる", async ({
    page,
  }) => {
    await page.goto("/learn/french/09");
    await expect(page.getByRole("heading", { level: 1, name: "発音クイズ" })).toBeVisible();
    await expect(page.getByText("ブラウザの読み上げ機能")).toHaveCount(0);
    const start = await page.getByRole("button", { name: "練習を始める" }).boundingBox();
    const units = page.getByRole("button", { name: /^出題する単元/ });
    const unitsBox = await units.boundingBox();
    expect(start && unitsBox && start.y < unitsBox.y).toBe(true);

    await units.click();
    await expect(page.getByRole("checkbox", { name: /鼻母音/ })).toBeVisible();
    await page.getByRole("button", { name: /^出題する形式/ }).click();
    await expect(page.getByRole("checkbox", { name: /聞き取り/ })).toBeVisible();
  });

  test("全問を4択で出題し、形式ごとに読み上げ・答え合わせができ、どの問題にも解説が出る", async ({
    page,
  }) => {
    test.slow();
    await page.goto("/learn/french/09");
    await page.getByRole("button", { name: /^問題数/ }).click();
    await page.getByRole("radio", { name: "全問" }).click();
    // 聞き取りは出題と同時に読み上げるので、出題する操作の前に読み上げた回数を控えておく
    let before = (await spoken(page)).length;
    await page.getByRole("button", { name: "練習を始める" }).click();

    const choices = page.locator(".max-w-xl .flex.flex-col.gap-2 > button");
    const kinds = new Set<string>();
    for (;;) {
      await expect(choices).toHaveCount(4);
      const instruction = await page.getByText(/^(聞き取り|ルール|読み方)　/).textContent();
      const kind = instruction?.split("　")[0] ?? "";
      kinds.add(kind);

      if (kind === "聞き取り") {
        // 出題すると語を読み上げ、「もう一度聞く」でも読み上げる
        await expect.poll(async () => (await spoken(page)).length).toBe(before + 1);
        await page.getByRole("button", { name: "もう一度聞く" }).click();
        await expect.poll(async () => (await spoken(page)).length).toBe(before + 2);
        const [auto, again] = (await spoken(page)).slice(before);
        expect(again).toBe(auto);
        await choices.first().click();
      } else if (kind === "読み方") {
        // 選択肢を押すと、その発音を読み上げて選ぶだけで、答え合わせはまだしない
        await choices.nth(1).click();
        await expect.poll(async () => (await spoken(page)).length).toBe(before + 1);
        await expect(page.getByRole("status")).toHaveCount(0);
        await choices.nth(2).click();
        await expect.poll(async () => (await spoken(page)).length).toBe(before + 2);
        const [a, b] = (await spoken(page)).slice(before);
        expect(a).not.toBe(b);
        await page.getByRole("button", { name: "答え合わせ" }).click();
      } else {
        await choices.first().click();
      }
      await expect(page.getByRole("status")).toContainText("解説:");

      const next = page.getByRole("button", { name: /次の問題へ|結果を見る/ });
      const isLast = (await next.textContent()) === "結果を見る";
      before = (await spoken(page)).length;
      await next.click();
      if (isLast) break;
    }
    expect(kinds).toEqual(new Set(["聞き取り", "ルール", "読み方"]));
  });

  test("読み方の問題は、答え合わせのあとも選択肢を押して聞き比べられる", async ({ page }) => {
    await page.goto("/learn/french/09");
    await page.getByRole("button", { name: /^出題する形式/ }).click();
    await page.getByRole("checkbox", { name: /聞き取り/ }).uncheck();
    await page.getByRole("checkbox", { name: /ルール/ }).uncheck();
    await page.getByRole("button", { name: "練習を始める" }).click();

    const choices = page.locator(".max-w-xl .flex.flex-col.gap-2 > button");
    await expect(page.getByText(/^読み方　/)).toBeVisible();
    await expect(page.getByRole("button", { name: "答え合わせ" })).toBeDisabled();
    // 答え合わせの前は発音記号を見せず、「発音 1」〜「発音 4」と番号だけを出す
    await expect(choices).toHaveText([/発音 1/, /発音 2/, /発音 3/, /発音 4/]);
    await expect(choices.filter({ hasText: "[" })).toHaveCount(0);
    await choices.first().click();
    await page.getByRole("button", { name: "答え合わせ" }).click();
    await expect(page.getByRole("status")).toContainText(/正解|不正解/);
    // 答え合わせのあとは、どの選択肢にも発音記号を出す
    await expect(choices.filter({ hasText: /\[.+\]/ })).toHaveCount(4);

    const before = (await spoken(page)).length;
    await choices.nth(3).click();
    await expect.poll(async () => (await spoken(page)).length).toBe(before + 1);
  });

  test("形式を絞ると、その形式の問題だけを出題する", async ({ page }) => {
    await page.goto("/learn/french/09");
    await page.getByRole("button", { name: /^出題する形式/ }).click();
    await page.getByRole("checkbox", { name: /聞き取り/ }).uncheck();
    await page.getByRole("checkbox", { name: /読み方/ }).uncheck();
    await page.getByRole("button", { name: "練習を始める" }).click();
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/^ルール　/)).toBeVisible();
      await page.locator(".max-w-xl .flex.flex-col.gap-2 > button").first().click();
      await page.getByRole("button", { name: /次の問題へ|結果を見る/ }).click();
    }
  });
});
