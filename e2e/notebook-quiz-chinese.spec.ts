import { expect, test, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

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

const headers = (page: Page) =>
  page
    .getByRole("table")
    .first()
    .locator("thead th")
    .evaluateAll((ths) => ths.map((th) => th.textContent?.trim() ?? ""));

// アプリで作った単語帳に、中国語のExcelテンプレートをそのまま使って WORDS を取り込む。単語帳のパスを返す
async function createTemplateNotebook(page: Page, baseURL: string, title: string) {
  const notebookUrl = await createNotebook(page, title);
  const template = await page.request.get("/my-notebooks/template?language=中国語");
  expect(template.ok()).toBe(true);
  const source = new ExcelJS.Workbook();
  await source.xlsx.load((await template.body()) as unknown as ArrayBuffer);
  // テンプレートの1行目（列名）はそのまま使い、記入例の代わりに WORDS を書く
  const header = (source.worksheets[0].getRow(1).values as ExcelJS.CellValue[]).slice(1);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRow(header);
  for (const word of WORDS) sheet.addRow(word);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  const res = await page.request.post(notebookUrl, {
    multipart: {
      intent: "importCards",
      file: {
        name: "中国語.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer,
      },
    },
    headers: { Origin: baseURL },
  });
  expect(res.ok()).toBe(true);
  return notebookUrl;
}

// 見出し語の列の名前は既定（見出し語）のまま、意味・拼音の列で WORDS を入れた単語帳を作る
async function createPlainNotebook(page: Page, baseURL: string, title: string) {
  const notebookUrl = await createNotebook(page, title);
  const post = (form: Record<string, string>) =>
    page.request.post(notebookUrl, { form, headers: { Origin: baseURL } });
  expect((await post({ intent: "addColumn", name: "拼音" })).ok()).toBe(true);
  for (const [head, meaning, pinyin] of WORDS) {
    expect(
      (
        await post({ intent: "createCard", head, "row:0:意味": meaning, "row:0:拼音": pinyin })
      ).ok(),
    ).toBe(true);
  }
  return notebookUrl;
}

// クイズの設定を開き、拼音・全問を選ぶ
async function openQuizSettings(page: Page, notebookUrl: string) {
  await page.goto(`${notebookUrl}/quiz`);
  await page.getByRole("button", { name: "拼音", exact: true }).click();
  await page.getByRole("button", { name: "全問", exact: true }).click();
}

const startQuiz = (page: Page) => page.getByRole("button", { name: "クイズを始める" }).click();

async function currentWord(page: Page) {
  const head = (await page.locator("[data-quiz-head]").textContent())!.trim();
  return WORDS.find(([h]) => h === head)!;
}

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
});

test("中国語のテンプレートを取り込むと、表の見出し語の列がExcelの列名（単語）になる", async ({
  page,
  baseURL,
}) => {
  const notebookUrl = await createTemplateNotebook(
    page,
    baseURL!,
    "e2e 用の中国語テンプレートの取り込み",
  );
  await page.goto(notebookUrl);
  await expect.poll(() => headers(page)).toEqual(expect.arrayContaining(["単語", "意味", "拼音"]));
  expect(await headers(page)).not.toContain("見出し語");
});

test("中国語テンプレートの単語帳で拼音を答えると、意味が出て、答え合わせで見出し語を中国語で読み上げる", async ({
  page,
  baseURL,
}) => {
  const notebookUrl = await createTemplateNotebook(
    page,
    baseURL!,
    "e2e 用の中国語テンプレートのクイズ",
  );
  await openQuizSettings(page, notebookUrl);
  // 読み上げは既定でオン
  await expect(page.getByRole("button", { name: "読み上げる", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await startQuiz(page);

  for (let i = 0; i < WORDS.length; i += 1) {
    const [head, meaning, pinyin] = await currentWord(page);
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

test("読み上げの選択は拼音を答えるときだけ出て、「読み上げない」を選ぶと読み上げない", async ({
  page,
  baseURL,
}) => {
  const notebookUrl = await createTemplateNotebook(page, baseURL!, "e2e 用の読み上げを切るクイズ");
  await page.goto(`${notebookUrl}/quiz`);
  const off = page.getByRole("button", { name: "読み上げない", exact: true });
  await page.getByRole("button", { name: "意味", exact: true }).click();
  await expect(off).toHaveCount(0);

  await openQuizSettings(page, notebookUrl);
  await off.click();
  await expect(off).toHaveAttribute("aria-pressed", "true");
  await startQuiz(page);

  const [, meaning, pinyin] = await currentWord(page);
  await expect(page.getByText(`意味：${meaning}`)).toBeVisible();
  await page.getByRole("button", { name: pinyin, exact: true }).click();
  await expect(page.getByText("正解！")).toBeVisible();
  await expect(page.getByRole("button", { name: "発音を聞く" })).toHaveCount(0);
  await page.waitForTimeout(200);
  expect(await spoken(page)).toEqual([]);
});

test("1行目がテンプレートと違う単語帳では、意味も読み上げも、読み上げの選択も出さない", async ({
  page,
  baseURL,
}) => {
  const notebookUrl = await createPlainNotebook(
    page,
    baseURL!,
    "e2e 用のテンプレート外の中国語クイズ",
  );
  await openQuizSettings(page, notebookUrl);
  await expect(page.getByRole("button", { name: "読み上げない", exact: true })).toHaveCount(0);
  await startQuiz(page);

  await expect(page.getByText(/^意味：/)).toHaveCount(0);
  const [, , pinyin] = await currentWord(page);
  await page.getByRole("button", { name: pinyin, exact: true }).click();
  await expect(page.getByText("正解！")).toBeVisible();
  await expect(page.getByRole("button", { name: "発音を聞く" })).toHaveCount(0);
  await page.waitForTimeout(200);
  expect(await spoken(page)).toEqual([]);
});
