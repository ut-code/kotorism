import { expect, test, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

// ブラウザの読み上げを差し替え、読み上げた文字列と言語を window.__spoken に記録する
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
          spoken.push(`${utterance.lang}:${utterance.text}`);
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

const WORDS = [
  ["丈夫", "夫", "zhàngfu"],
  ["认真", "真面目だ", "rènzhēn"],
  ["比赛", "試合", "bǐsài"],
];

// 見出し語の列の名前を headName にし、意味・拼音の列で WORDS を入れた単語帳を作り、クイズを開く
async function openQuiz(page: Page, baseURL: string, title: string, headName: string) {
  await createNotebook(page, title);
  const notebookUrl = new URL(page.url()).pathname;
  const post = (form: Record<string, string>) =>
    page.request.post(notebookUrl, { form, headers: { Origin: baseURL } });
  expect((await post({ intent: "renameColumn", columnIndex: "0", name: headName })).ok()).toBe(
    true,
  );
  expect((await post({ intent: "addColumn", name: "拼音" })).ok()).toBe(true);
  for (const [head, meaning, pinyin] of WORDS) {
    expect(
      (
        await post({ intent: "createCard", head, "row:0:意味": meaning, "row:0:拼音": pinyin })
      ).ok(),
    ).toBe(true);
  }
  await page.goto(`${notebookUrl}/quiz`);
  await page.getByRole("button", { name: "拼音", exact: true }).click();
  await page.getByRole("button", { name: "全問", exact: true }).click();
  await page.getByRole("button", { name: "クイズを始める" }).click();
}

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
});

test("中国語テンプレートの列の単語帳で拼音を答えると、意味が出て、答え合わせで見出し語を中国語で読み上げる", async ({
  page,
  baseURL,
}) => {
  await openQuiz(page, baseURL!, "e2e 用の中国語テンプレートのクイズ", "単語");

  for (let i = 0; i < WORDS.length; i += 1) {
    const head = (await page.locator("[data-quiz-head]").textContent())!.trim();
    const [, meaning, pinyin] = WORDS.find(([h]) => h === head)!;
    await expect(page.getByText(`意味：${meaning}`)).toBeVisible();
    expect(await spoken(page)).not.toContain(`zh-CN:${head}`);

    await page.getByRole("button", { name: pinyin, exact: true }).click();
    await expect(page.getByText("正解！")).toBeVisible();
    await expect.poll(() => spoken(page)).toContain(`zh-CN:${head}`);

    // もう一度聞ける
    const before = (await spoken(page)).length;
    await page.getByRole("button", { name: "発音を聞く" }).click();
    await expect.poll(async () => (await spoken(page)).length).toBe(before + 1);

    await page.getByRole("button", { name: /次の問題へ|結果を見る/ }).click();
  }
  await expect(page.getByText("全問正解です！")).toBeVisible();
});

test("1行目がテンプレートと違う単語帳では、意味も読み上げも出さない", async ({ page, baseURL }) => {
  await openQuiz(page, baseURL!, "e2e 用のテンプレート外の中国語クイズ", "見出し語");

  await expect(page.getByText(/^意味：/)).toHaveCount(0);
  const head = (await page.locator("[data-quiz-head]").textContent())!.trim();
  const [, , pinyin] = WORDS.find(([h]) => h === head)!;
  await page.getByRole("button", { name: pinyin, exact: true }).click();
  await expect(page.getByText("正解！")).toBeVisible();
  await expect(page.getByRole("button", { name: "発音を聞く" })).toHaveCount(0);
  await page.waitForTimeout(200);
  expect(await spoken(page)).toEqual([]);
});
