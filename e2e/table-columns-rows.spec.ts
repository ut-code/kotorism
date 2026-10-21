import { expect, test, type Locator, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

// 見出し語・意味・例文の3列で、単語を3件入れた単語帳を作る
async function createNotebookWithColumns(page: Page, baseURL: string, title: string) {
  await createNotebook(page, title);
  const notebookUrl = new URL(page.url()).pathname;
  const post = (form: Record<string, string>) =>
    page.request.post(notebookUrl, { form, headers: { Origin: baseURL } });
  expect((await post({ intent: "addColumn", name: "例文" })).ok()).toBe(true);
  for (const [head, meaning, example] of [
    ["un", "1", "un chat"],
    ["deux", "2", "deux chats"],
    ["trois", "3", "trois chats"],
  ]) {
    expect(
      (
        await post({ intent: "createCard", head, "row:0:意味": meaning, "row:0:例文": example })
      ).ok(),
    ).toBe(true);
  }
  await page.reload();
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  return page.getByRole("table").first();
}

const headers = (table: Locator) =>
  table.locator("thead th").evaluateAll((ths) => ths.map((th) => th.textContent?.trim() ?? ""));
const heads = (table: Locator) =>
  table.locator("tbody tr").evaluateAll((rows) =>
    // 見出し語のマス（行の左端）は、見出し語を名前（aria-label）に持つ。下に★などがあるため文字そのものは使わない
    rows.map((row) => row.querySelector("td")?.getAttribute("aria-label") ?? "").filter(Boolean),
  );

// マウスで長押ししたまま、target の中心へ動かして離す
async function longPressDrag(page: Page, source: Locator, target: { x: number; y: number }) {
  const box = (await source.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.move(target.x, target.y, { steps: 10 });
  await page.mouse.up();
}

test.describe("列の名前の変更", () => {
  test("「列を編集」ボタンは無く、列の見出しをダブルクリックすると名前を変えられる", async ({
    page,
    baseURL,
  }) => {
    const table = await createNotebookWithColumns(page, baseURL!, "e2e 用の列名を変える単語帳");
    await expect(page.getByRole("button", { name: "列を編集" })).toHaveCount(0);

    await table.getByRole("columnheader", { name: "意味", exact: true }).dblclick();
    const input = table.getByRole("textbox", { name: "列の名前" });
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("意味");
    await input.fill("日本語訳");
    await page.keyboard.press("Enter");

    await expect(table.getByRole("columnheader", { name: "日本語訳", exact: true })).toBeVisible();
    // 列の値はそのまま残る
    await expect(table.getByRole("cell", { name: "un chat", exact: true })).toBeVisible();
    await expect(table.getByRole("cell", { name: "2", exact: true })).toBeVisible();
  });

  test("名前の変更中に Esc を押すと、変えずに戻る", async ({ page, baseURL }) => {
    const table = await createNotebookWithColumns(
      page,
      baseURL!,
      "e2e 用の列名の変更を取り消す単語帳",
    );
    await table.getByRole("columnheader", { name: "意味", exact: true }).dblclick();
    await table.getByRole("textbox", { name: "列の名前" }).fill("取り消す名前");
    await page.keyboard.press("Escape");
    await expect(table.getByRole("columnheader", { name: "意味", exact: true })).toBeVisible();
  });

  test("名前の変更中に「列を削除」で、その列を消せる（見出し語の列は消せない）", async ({
    page,
    baseURL,
  }) => {
    const table = await createNotebookWithColumns(page, baseURL!, "e2e 用の列を消す単語帳");
    await table.getByRole("columnheader", { name: "見出し語", exact: true }).dblclick();
    await expect(table.getByRole("button", { name: "列を削除" })).toHaveCount(0);
    await page.keyboard.press("Escape");

    page.once("dialog", (dialog) => dialog.accept());
    await table.getByRole("columnheader", { name: "例文", exact: true }).dblclick();
    await table.getByRole("button", { name: "列を削除" }).click();
    await expect(table.getByRole("columnheader", { name: "例文", exact: true })).toHaveCount(0);
    await expect(table.getByRole("cell", { name: "un chat", exact: true })).toHaveCount(0);
  });
});

test.describe("長押ししたまま動かして並べ替える", () => {
  test("組が複数ある単語は、どの組の行を長押ししても、その単語の行すべてに色が付く", async ({
    page,
    baseURL,
  }) => {
    const table = await createNotebookWithColumns(page, baseURL!, "e2e 用の長押しで色が付く単語帳");
    // 見出し語を空けて追加すると、いちばん下の単語（trois）の2つ目の組になる
    const created = await page.request.post(new URL(page.url()).pathname, {
      form: { intent: "createCard", head: "", "row:0:意味": "三", "row:0:例文": "trois fois" },
      headers: { Origin: baseURL! },
    });
    expect(created.ok()).toBe(true);
    await page.reload();

    const cardRows = table.locator('tbody tr[data-card-index="2"]');
    await expect(cardRows).toHaveCount(2);
    const backgrounds = () =>
      cardRows.evaluateAll((rows) => rows.map((row) => getComputedStyle(row).backgroundColor));
    const transparent = "rgba(0, 0, 0, 0)";
    expect(await backgrounds()).toEqual([transparent, transparent]);

    // 2つ目の組の行を、動かさずに長押しする
    const box = (await table.getByRole("cell", { name: "trois fois", exact: true }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(600);
    const pressed = await backgrounds();
    expect(pressed[0]).not.toBe(transparent);
    expect(pressed[1]).toBe(pressed[0]);
    // 離すと色が消える
    await page.mouse.up();
    await expect.poll(backgrounds).toEqual([transparent, transparent]);
  });

  test("行（単語）を長押ししたまま下へ動かすと、並びが変わって保存される", async ({
    page,
    baseURL,
  }) => {
    const table = await createNotebookWithColumns(page, baseURL!, "e2e 用の行を並べ替える単語帳");
    expect(await heads(table)).toEqual(["un", "deux", "trois"]);

    // 「un」の行を、いちばん下（「trois」の行より下）へ
    const last = (await table.getByRole("cell", { name: "trois", exact: true }).boundingBox())!;
    await longPressDrag(page, table.getByRole("cell", { name: "un", exact: true }), {
      x: last.x + last.width / 2,
      y: last.y + last.height + 2,
    });
    await expect.poll(() => heads(table)).toEqual(["deux", "trois", "un"]);
    await page.reload();
    await expect
      .poll(() => heads(page.getByRole("table").first()))
      .toEqual(["deux", "trois", "un"]);
  });

  test("列を長押ししたまま左へ動かすと、列の並びが変わって保存される", async ({
    page,
    baseURL,
  }) => {
    const table = await createNotebookWithColumns(page, baseURL!, "e2e 用の列を並べ替える単語帳");
    expect((await headers(table)).slice(0, 3)).toEqual(["見出し語", "意味", "例文"]);

    // 「例文」の列を、「意味」の列の左へ
    const meaning = (await table
      .getByRole("columnheader", { name: "意味", exact: true })
      .boundingBox())!;
    await longPressDrag(page, table.getByRole("columnheader", { name: "例文", exact: true }), {
      x: meaning.x + 4,
      y: meaning.y + meaning.height / 2,
    });
    await expect
      .poll(async () => (await headers(table)).slice(0, 3))
      .toEqual(["見出し語", "例文", "意味"]);
    // 列の値も一緒に動く（見出し語の右隣が例文）
    const firstRow = table.locator("tbody tr").first().locator("td");
    await expect(firstRow.nth(1)).toHaveText("un chat");
    await page.reload();
    await expect
      .poll(async () => (await headers(page.getByRole("table").first())).slice(0, 3))
      .toEqual(["見出し語", "例文", "意味"]);
  });

  test("長押しせずにすぐ動かしたときは、並べ替えない", async ({ page, baseURL }) => {
    const table = await createNotebookWithColumns(
      page,
      baseURL!,
      "e2e 用のすぐ動かしても並べ替えない単語帳",
    );
    const source = (await table.getByRole("cell", { name: "un", exact: true }).boundingBox())!;
    const last = (await table.getByRole("cell", { name: "trois", exact: true }).boundingBox())!;
    await page.mouse.move(source.x + 4, source.y + 4);
    await page.mouse.down();
    await page.mouse.move(last.x + 4, last.y + last.height + 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(await heads(table)).toEqual(["un", "deux", "trois"]);
  });
});

test.describe("スマホ（タッチ操作）", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  // 指で長押し（hold ミリ秒）してから、moves の位置へ順に動かして離す
  async function touch(
    page: Page,
    start: { x: number; y: number },
    hold: number,
    moves: { x: number; y: number }[],
  ) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    await page.waitForTimeout(hold);
    for (const point of moves) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  const centerOf = async (locator: Locator) => {
    const box = (await locator.boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  test("列の見出しを長押しして離すと、名前を変えられる", async ({ page, baseURL }) => {
    const table = await createNotebookWithColumns(
      page,
      baseURL!,
      "e2e 用のスマホで列名を変える単語帳",
    );
    await touch(
      page,
      await centerOf(table.getByRole("columnheader", { name: "意味", exact: true })),
      700,
      [],
    );
    await expect(table.getByRole("textbox", { name: "列の名前" })).toHaveValue("意味");
  });

  test("行を長押ししたまま動かすと、並べ替えられる", async ({ page, baseURL }) => {
    const table = await createNotebookWithColumns(
      page,
      baseURL!,
      "e2e 用のスマホで行を並べ替える単語帳",
    );
    const start = await centerOf(table.getByRole("cell", { name: "trois", exact: true }));
    const first = (await table.getByRole("cell", { name: "un", exact: true }).boundingBox())!;
    const moves = Array.from({ length: 8 }, (_, i) => ({
      x: start.x,
      y: start.y + ((first.y + 2 - start.y) * (i + 1)) / 8,
    }));
    await touch(page, start, 700, moves);
    await expect.poll(() => heads(table)).toEqual(["trois", "un", "deux"]);
  });
});
