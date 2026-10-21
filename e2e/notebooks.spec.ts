import { expect, test, type Locator } from "@playwright/test";

import { createNotebook } from "./helpers";

test("「新しい単語帳」を押すとすぐ空の単語帳が開き、その場でタイトルを付けて表・Excelの取り込みを使える", async ({
  page,
}) => {
  await page.goto("/my-notebooks");
  // 一覧ではタイトルを入力しない
  await expect(page.getByRole("textbox", { name: "単語帳のタイトル" })).toHaveCount(0);
  await page.getByRole("button", { name: "新しい単語帳" }).click();
  await expect(page).toHaveURL(/\/my-notebooks\/[^/?]+/);

  // 開いた直後は、仮のタイトル（無題の単語帳）を選んだ状態で入力できる
  const titleInput = page.getByRole("textbox", { name: "単語帳のタイトル" });
  await expect(titleInput).toBeFocused();
  await expect(titleInput).toHaveValue("無題の単語帳");
  await page.keyboard.type("e2e 用の単語帳");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "e2e 用の単語帳" })).toBeVisible();

  // 同じページで、表への追加と Excel の取り込みがすぐ使える
  await expect(
    page.getByRole("table").first().getByRole("button", { name: "表に単語を追加" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Excel・スプレッドシートから追加" })).toBeVisible();

  // 再読み込みしてもタイトルの入力にはならず、一覧に作った単語帳が並ぶ
  await page.reload();
  await expect(page.getByRole("textbox", { name: "単語帳のタイトル" })).toHaveCount(0);
  await page.goto("/my-notebooks");
  await expect(page.getByText("e2e 用の単語帳")).toBeVisible();
});

test("単語帳のタイトルは、あとからタイトルを押して変えられる（Esc で取り消し）", async ({
  page,
}) => {
  await createNotebook(page, "e2e 用のタイトルを変える単語帳");
  await page.getByRole("heading", { level: 1, name: "e2e 用のタイトルを変える単語帳" }).click();
  const titleInput = page.getByRole("textbox", { name: "単語帳のタイトル" });
  await titleInput.fill("取り消すタイトル");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { level: 1, name: "e2e 用のタイトルを変える単語帳" }),
  ).toBeVisible();

  await page.getByRole("heading", { level: 1, name: "e2e 用のタイトルを変える単語帳" }).click();
  await titleInput.fill("変えたタイトル");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "変えたタイトル" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "変えたタイトル" })).toBeVisible();
});

test("他人の単語帳の共有URLは、存在しなければ 404", async ({ page }) => {
  const response = await page.goto("/share/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("単語帳の表では、★（ブックマーク）を見出し語の下に表示し、そこから★をつけられる", async ({
  page,
  baseURL,
}) => {
  await createNotebook(page, "e2e 用の★の位置の単語帳");
  const notebookUrl = new URL(page.url()).pathname;
  const created = await page.request.post(notebookUrl, {
    form: { intent: "createCard", head: "merci", "row:0:意味": "ありがとう" },
    headers: { Origin: baseURL! },
  });
  expect(created.ok()).toBe(true);
  await page.reload();

  const table = page.getByRole("table").first();
  // 見出し行の左端は見出し語の列（★だけの列は無い）
  await expect(table.locator("thead th").first()).toHaveText("見出し語");
  // 単語の行の左端のセルが見出し語で、★のボタンは見出し語の下にある
  const row = table.locator("tbody tr").first();
  const head = row.locator("td").first();
  await expect(head).toHaveAccessibleName("merci");
  const word = await head.getByText("merci", { exact: true }).boundingBox();
  const star = await head.getByRole("button", { name: "★をつける" }).boundingBox();
  expect(star!.y).toBeGreaterThanOrEqual(word!.y + word!.height);

  await head.getByRole("button", { name: "★をつける" }).click();
  await expect(head.getByRole("button", { name: "★の回数を増やす" })).toBeVisible();
  // 削除は右端の列に残る（編集は表の上の「表を編集」からまとめて行う）
  await expect(row.locator("td").last().getByRole("button", { name: "削除" })).toBeVisible();
});

test("見出し語の列の右に区切り線を引く（表示中・編集中・単語の追加中とも）", async ({
  page,
  baseURL,
}) => {
  await createNotebook(page, "e2e 用の見出し語の区切り線の単語帳");
  const notebookUrl = new URL(page.url()).pathname;
  const created = await page.request.post(notebookUrl, {
    form: { intent: "createCard", head: "merci", "row:0:意味": "ありがとう" },
    headers: { Origin: baseURL! },
  });
  expect(created.ok()).toBe(true);
  await page.reload();
  const table = page.getByRole("table").first();
  // 右に線が引かれているマス（border-right が1px以上）
  const hasRightLine = (cell: Locator) =>
    cell.evaluate((el) => parseFloat(getComputedStyle(el).borderRightWidth) >= 1);

  expect(await hasRightLine(table.getByRole("columnheader", { name: "見出し語" }))).toBe(true);
  expect(await hasRightLine(table.getByRole("cell", { name: "merci", exact: true }))).toBe(true);
  // 線は見出し語の列だけで、ほかの列の間には引かない
  expect(await hasRightLine(table.getByRole("cell", { name: "ありがとう", exact: true }))).toBe(
    false,
  );

  // 単語の追加中の行
  await table.getByRole("button", { name: "表に単語を追加" }).click();
  const addingHead = table.getByRole("textbox", { name: "見出し語" });
  expect(await hasRightLine(addingHead.locator("xpath=ancestor::td[1]"))).toBe(true);
  await page.keyboard.press("Escape");

  // 編集中の行
  await page.getByRole("button", { name: "表を編集" }).click();
  const editingHead = table.getByRole("textbox", { name: "見出し語" }).first();
  expect(await hasRightLine(editingHead.locator("xpath=ancestor::td[1]"))).toBe(true);
});

test.describe("スマホ幅の単語帳ページ", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("学習のボタンは1行に1つずつ、文字が折り返さない幅で並べる", async ({ page, baseURL }) => {
    await createNotebook(page, "e2e 用のスマホ表示の単語帳");
    const notebookUrl = new URL(page.url()).pathname;
    const created = await page.request.post(notebookUrl, {
      form: { intent: "createCard", head: "merci", "row:0:意味": "ありがとう" },
      headers: { Origin: baseURL! },
    });
    expect(created.ok()).toBe(true);
    await page.reload();
    // ★を付けると「★を復習する」「★を一括リセット」も並び、ボタンが最大の4つになる
    await page.getByRole("button", { name: "★をつける" }).click();
    await expect(page.getByRole("link", { name: /★を復習する/ })).toBeVisible();

    const buttons = [
      page.getByRole("link", { name: /★を復習する/ }),
      page.getByRole("link", { name: "クイズに挑戦" }),
      page.getByRole("link", { name: "暗記学習を始める" }),
      page.getByRole("button", { name: "★を一括リセット" }),
    ];
    const boxes = [];
    for (const button of buttons) boxes.push((await button.boundingBox())!);

    for (let i = 0; i < boxes.length; i++) {
      // 文字が1行に収まっている（折り返して縦に伸びていない）
      expect(boxes[i].height).toBeLessThan(48);
      // 前のボタンより下の行にある（横に並んでいない）
      if (i > 0) expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height);
      // どのボタンも同じ幅（画面幅いっぱい）
      expect(Math.round(boxes[i].width)).toBe(Math.round(boxes[0].width));
    }
  });
});

test.describe("★の付け外しで、表示が一度元に戻らない", () => {
  // ★のボタンの文字・色が変わるたびに記録する（クリック直後からサーバーの応答・再読み込みが終わるまで）
  async function recordStar(page: import("@playwright/test").Page, name: RegExp) {
    await page.getByRole("button", { name }).evaluate((button) => {
      const log: string[] = [];
      (window as unknown as { starLog: string[] }).starLog = log;
      const record = () => {
        const current = document.querySelector<HTMLButtonElement>(
          'button[aria-label="★を外す"], button[aria-label="★をつける"], button[aria-label="★の回数を増やす"]',
        );
        if (!current) return;
        // 表の★は図形（svg）なので中が塗られているかで、暗記学習の★は文字で ★・☆ を見分ける
        const icon = current.querySelector("svg");
        const shape = icon
          ? icon.getAttribute("fill") === "none"
            ? "☆"
            : "★"
          : current.textContent;
        const entry = `${shape} ${getComputedStyle(current).color}`;
        if (log.at(-1) !== entry) log.push(entry);
      };
      record();
      new MutationObserver(record).observe(button.closest("main")!, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
    });
  }

  // 名前が重なると確認が出るため、テストごとに別の名前で作る
  async function setUpNotebook(
    page: import("@playwright/test").Page,
    baseURL: string,
    title: string,
  ) {
    await createNotebook(page, title);
    const notebookUrl = new URL(page.url()).pathname;
    const created = await page.request.post(notebookUrl, {
      form: { intent: "createCard", head: "merci", "row:0:意味": "ありがとう" },
      headers: { Origin: baseURL },
    });
    expect(created.ok()).toBe(true);
    // サーバーの応答を遅らせ、通信中・再読み込み中の表示を確かめやすくする
    await page.route("**/*", async (route) => {
      if (route.request().method() === "POST" || route.request().url().includes(".data")) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      await route.continue();
    });
    return notebookUrl;
  }

  // 表の★は押すたびに回数が増えて次の色へ進む（下のテスト）。暗記学習の★は付け外しのまま
  for (const where of ["暗記学習"] as const) {
    test(`${where}で★をつけたとき、☆（白い星）に戻らない`, async ({ page, baseURL }) => {
      const notebookUrl = await setUpNotebook(page, baseURL!, "e2e 用の★のちらつきの単語帳 1");
      await page.goto(`${notebookUrl}/study`);
      await recordStar(page, /★をつける/);

      await page.getByRole("button", { name: "★をつける" }).click();
      await expect(page.getByRole("button", { name: "★を外す" })).toBeVisible();
      // 応答と再読み込みが終わるまで待つ
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const log = await page.evaluate(() => (window as unknown as { starLog: string[] }).starLog);
      // 最初は☆、押した後は★のまま（☆に戻らない・色も一度決まったら変わらない）
      expect(log[0]).toMatch(/^☆/);
      const afterClick = log.slice(1);
      expect(afterClick.length).toBeGreaterThan(0);
      expect(afterClick.every((entry) => entry.startsWith("★"))).toBe(true);
      expect(new Set(afterClick).size).toBe(1);
    });
  }
  test("表の★は、押すたびにすぐ次の色へ進み、☆に戻らない（素早く押しても回数がすべて残る）", async ({
    page,
    baseURL,
  }) => {
    const notebookUrl = await setUpNotebook(page, baseURL!, "e2e 用の★のちらつきの単語帳 2");
    await page.goto(notebookUrl);
    await recordStar(page, /★をつける/);

    const star = page.locator("tbody tr").first().locator("td").first().getByRole("button").first();
    await star.click();
    await star.click();
    await star.click();
    await expect(page.getByRole("button", { name: "★の回数を修正する" })).toHaveText("3");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const log = await page.evaluate(() => (window as unknown as { starLog: string[] }).starLog);
    // 1回目（tealblue）→ 2回目（黄）→ 3回目以降（赤）と、塗られた★のまま順に進む
    expect(log).toEqual([
      expect.stringMatching(/^☆/),
      "★ rgb(63, 182, 184)",
      "★ rgb(251, 191, 36)",
      "★ rgb(214, 80, 61)",
    ]);

    await page.reload();
    await expect(page.getByRole("button", { name: "★の回数を増やす" })).toBeVisible();
    await expect(page.getByRole("button", { name: "★の回数を修正する" })).toHaveText("3");
  });
});

test("表の★の欄は、★と目の高さがそろい、★の回数と見た回数が別のまとまりに見える", async ({
  page,
  baseURL,
}) => {
  await createNotebook(page, "e2e 用の★と目の並びの単語帳");
  const created = await page.request.post(new URL(page.url()).pathname, {
    form: { intent: "createCard", head: "merci", "row:0:意味": "ありがとう" },
    headers: { Origin: baseURL! },
  });
  expect(created.ok()).toBe(true);
  await page.reload();

  const cell = page.getByRole("table").first().locator("tbody tr").first().locator("td").first();
  const layout = await cell.evaluate((td) => {
    const center = (r: DOMRect) => r.top + r.height / 2;
    // ★も目も図形（svg）で描き、見えている形の位置で比べる（文字の★は字の枠と見た目の位置がずれるため）
    const star = td
      .querySelector<HTMLButtonElement>('button[aria-label="★をつける"]')!
      .querySelector("svg")!
      .getBoundingClientRect();
    const starCount = td
      .querySelector<HTMLButtonElement>('button[aria-label="★の回数を修正する"]')!
      .getBoundingClientRect();
    const eye = td
      .querySelector('[aria-label="暗記モードで表示した回数"]')!
      .querySelector("svg")!
      .getBoundingClientRect();
    const viewCount = document.createRange();
    viewCount.selectNodeContents(td.querySelector('[aria-label="暗記モードで表示した回数"]')!);
    const starCountText = document.createRange();
    starCountText.selectNodeContents(
      td.querySelector<HTMLButtonElement>('button[aria-label="★の回数を修正する"]')!,
    );
    return {
      // ★の回数と見た回数の数字の縦の中心のずれ
      countOffset: Math.abs(
        center(starCountText.getBoundingClientRect()) - center(viewCount.getBoundingClientRect()),
      ),
      // ★の文字と目のアイコンの縦の中心のずれ
      verticalOffset: Math.abs(center(star) - center(eye)),
      // ★と★の回数の間（同じまとまり）と、★の回数と目の間（別のまとまり）
      starToCount: starCount.left - star.right,
      countToEye: eye.left - starCount.right,
    };
  });
  expect(layout.verticalOffset).toBeLessThanOrEqual(0.5);
  expect(layout.countOffset).toBeLessThanOrEqual(0.5);
  expect(layout.starToCount).toBeLessThanOrEqual(4);
  expect(layout.countToEye).toBeGreaterThanOrEqual(12);
});

test.describe("単語帳の名前が自分の別の単語帳と重なったとき", () => {
  // 「重なり確認 …」という名前の単語帳を1つ作っておき、新しい単語帳に同じ名前を付けようとする
  async function tryDuplicate(page: import("@playwright/test").Page, name: string) {
    await createNotebook(page, name);
    await page.goto("/my-notebooks");
    await page.getByRole("button", { name: "新しい単語帳" }).click();
    const titleInput = page.getByRole("textbox", { name: "単語帳のタイトル" });
    await titleInput.fill(name);
    await titleInput.press("Enter");
    await expect(page.getByRole("alert")).toContainText(
      `「${name}」という名前の単語帳がすでにあります`,
    );
  }

  test("番号を付けた名前を選べる", async ({ page }) => {
    await tryDuplicate(page, "重なり確認 番号");
    await page.getByRole("button", { name: "「重なり確認 番号 1」にする" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "重なり確認 番号 1" })).toBeVisible();
  });

  test("今日の日付を付けた名前を選べる", async ({ page }) => {
    await tryDuplicate(page, "重なり確認 日付");
    await page
      .getByRole("button", { name: /^「重なり確認 日付 \d{4}-\d{2}-\d{2}」にする$/ })
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: /^重なり確認 日付 \d{4}-\d{2}-\d{2}$/ }),
    ).toBeVisible();
  });

  test("このままの名前にもできる", async ({ page }) => {
    await tryDuplicate(page, "重なり確認 このまま");
    await page.getByRole("button", { name: "このままにする" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "重なり確認 このまま" }),
    ).toBeVisible();
    await page.goto("/my-notebooks");
    await expect(page.getByText("重なり確認 このまま", { exact: true })).toHaveCount(2);
  });

  test("新しい単語帳を「無題の単語帳」のまま決めても、重なっていれば知らせる", async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      await page.goto("/my-notebooks");
      await page.getByRole("button", { name: "新しい単語帳" }).click();
      await page.getByRole("textbox", { name: "単語帳のタイトル" }).press("Enter");
    }
    // 2つ目で知らせる（1つ目は、ほかに「無題の単語帳」が無ければそのまま決まる）
    await expect(page.getByRole("alert")).toContainText(
      "「無題の単語帳」という名前の単語帳がすでにあります",
    );
  });
});

test("Excel・スプレッドシートから追加では、Googleスプレッドシートを .xlsx で書き出して取り込む方法を案内する", async ({
  page,
}) => {
  await createNotebook(page, "e2e 用のスプレッドシートの案内の単語帳");
  await page.getByRole("button", { name: "Excel・スプレッドシートから追加" }).click();
  await expect(
    page.getByText(
      "Googleスプレッドシートの場合は、「ファイル」→「ダウンロード」→「Microsoft Excel（.xlsx）」で保存したファイルを選んでください。",
    ),
  ).toBeVisible();
});
