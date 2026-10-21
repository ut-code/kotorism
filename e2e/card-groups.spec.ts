import { expect, test, type Page } from "@playwright/test";

import { createNotebook } from "./helpers";

// 1つの単語に複数の組（多義語）を持たせる。組が複数ある単語は、見出し語のマスが組の数だけ縦に結合される

// 単語を入れた単語帳を作る
async function createNotebookWithCards(page: Page, baseURL: string, title: string) {
  await createNotebook(page, title);
  const notebookUrl = new URL(page.url()).pathname;
  for (const [head, meaning] of [
    ["light", "光"],
    ["dark", "暗い"],
  ]) {
    const created = await page.request.post(notebookUrl, {
      form: { intent: "createCard", head, "row:0:意味": meaning },
      headers: { Origin: baseURL },
    });
    expect(created.ok()).toBe(true);
  }
  await page.reload();
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  return page.getByRole("table").first();
}

test("表の下の＋で見出し語を空けて追加すると、すぐ上の単語の組になる", async ({ page }) => {
  await createNotebook(page, "e2e 用の組を＋で足す単語帳");
  const table = page.getByRole("table").first();

  await table.getByRole("button", { name: "表に単語を追加" }).click();
  await table.getByRole("textbox", { name: "見出し語" }).fill("light");
  const meaning = table.getByRole("textbox", { name: "意味" });
  await meaning.fill("光");
  await page.keyboard.press("Enter");
  // 入力欄のマスも同じ文字の cell として見つかるため、保存が済んで入力欄が空に戻るのを待ってから次へ進む
  // （保存中の Enter は送らないため、待たずに続けると遅い環境で2つ目が追加されない）
  await expect(meaning).toHaveValue("");

  // 見出し語は空のまま、意味だけ入れて追加する
  await meaning.fill("軽い");
  await page.keyboard.press("Enter");
  await expect(meaning).toHaveValue("");

  await expect(table.getByRole("cell", { name: "軽い", exact: true })).toBeVisible();
  const head = table.getByRole("cell", { name: "light", exact: true });
  await expect(head).toHaveCount(1);
  await expect(head).toHaveAttribute("rowspan", "2");
});

test("まとめて編集で、単語の右の＋から組を足し、マスを全部空にした組は消える", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(page, baseURL!, "e2e 用の組を編集する単語帳");

  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("button", { name: "「light」に組を追加" }).click();
  // 足した組の最初の欄から入力できる
  const added = table.getByRole("textbox", { name: "意味" }).nth(1);
  await expect(added).toBeFocused();
  await added.fill("軽い");
  await page.getByRole("button", { name: "保存" }).click();
  // 編集中は入力欄のマスも同じ文字の cell として見つかるため、保存が済んで表示に戻るのを待つ
  await expect(page.getByRole("button", { name: "表を編集" })).toBeVisible();

  await expect(table.getByRole("cell", { name: "軽い", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "light", exact: true })).toHaveAttribute(
    "rowspan",
    "2",
  );

  // 組のマスを全部空にして保存すると、その組を消す
  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("textbox", { name: "意味" }).nth(1).fill("");
  await page.getByRole("button", { name: "保存" }).click();
  // 編集中は入力欄のマスも同じ文字の cell として見つかるため、保存が済んで表示に戻るのを待つ
  await expect(page.getByRole("button", { name: "表を編集" })).toBeVisible();

  await expect(table.getByRole("cell", { name: "軽い", exact: true })).toHaveCount(0);
  await expect(table.getByRole("cell", { name: "light", exact: true })).toHaveAttribute(
    "rowspan",
    "1",
  );
});

test("まとめて編集で表の下に足した行の見出し語が空なら、すぐ上の単語の組になる", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithCards(page, baseURL!, "e2e 用の行を組にする単語帳");

  await page.getByRole("button", { name: "表を編集" }).click();
  await table.getByRole("button", { name: "表に行を追加" }).click();
  await table.getByRole("textbox", { name: "意味" }).last().fill("黒っぽい");
  await page.getByRole("button", { name: "保存" }).click();
  // 編集中は入力欄のマスも同じ文字の cell として見つかるため、保存が済んで表示に戻るのを待つ
  await expect(page.getByRole("button", { name: "表を編集" })).toBeVisible();

  await expect(table.getByRole("cell", { name: "黒っぽい", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "dark", exact: true })).toHaveAttribute(
    "rowspan",
    "2",
  );
});

// 「品詞」の列を足し、品詞が「名詞」で続く多義語を入れた単語帳を作る
async function createNotebookWithPolysemy(page: Page, baseURL: string, title: string) {
  await createNotebook(page, title);
  const notebookUrl = new URL(page.url()).pathname;
  const post = (form: Record<string, string>) =>
    page.request.post(notebookUrl, { form, headers: { Origin: baseURL } });
  expect((await post({ intent: "addColumn", name: "品詞" })).ok()).toBe(true);
  const created = await post({
    intent: "createCard",
    head: "cost",
    "row:0:意味": "値段が～である",
    "row:0:品詞": "動詞",
    "row:1:意味": "犠牲",
    "row:1:品詞": "名詞",
    "row:2:意味": "費用",
    "row:2:品詞": "名詞",
  });
  expect(created.ok()).toBe(true);
  await page.reload();
  // ページ下の「単語を追加」フォームの中にも表があるため、単語帳の表（最初の表）に絞る
  return page.getByRole("table").first();
}

test("まとめて編集で、結合しているマスを分割すると、いちばん下の組のマスが別の入力欄になる", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithPolysemy(page, baseURL!, "e2e 用のマスを分割する単語帳");
  await expect(table.getByRole("cell", { name: "名詞", exact: true })).toHaveAttribute(
    "rowspan",
    "2",
  );

  await page.getByRole("button", { name: "表を編集" }).click();
  // 編集中も、同じ値が続く「名詞」のマスは結合した1つの入力欄になっている
  const partOfSpeech = table.getByRole("textbox", { name: "品詞" });
  await expect(partOfSpeech).toHaveCount(2);

  await table.getByRole("button", { name: "「品詞」の結合を分割" }).click();
  await expect(partOfSpeech).toHaveCount(3);
  // 切り離したマスは空欄から入力し直す
  await expect(partOfSpeech.nth(2)).toHaveValue("");
  await partOfSpeech.nth(2).fill("名詞（複数形）");
  await page.getByRole("button", { name: "保存" }).click();
  // 編集中は入力欄のマスも同じ文字の cell として見つかるため、保存が済んで表示に戻るのを待つ
  await expect(page.getByRole("button", { name: "表を編集" })).toBeVisible();

  await expect(table.getByRole("cell", { name: "名詞", exact: true })).toHaveAttribute(
    "rowspan",
    "1",
  );
  await expect(table.getByRole("cell", { name: "名詞（複数形）", exact: true })).toBeVisible();
});

test("まとめて編集で、マスを下の組と結合すると、結合した組すべてに同じ値を保存する", async ({
  page,
  baseURL,
}) => {
  const table = await createNotebookWithPolysemy(page, baseURL!, "e2e 用のマスを結合する単語帳");

  await page.getByRole("button", { name: "表を編集" }).click();
  // 下の組のマスに別の値が入っているときは、上のマスの値にそろえてよいか確認する
  page.once("dialog", (dialog) => dialog.accept());
  await table.getByRole("button", { name: "「意味」を下の組と結合" }).nth(1).click();
  const meaning = table.getByRole("textbox", { name: "意味" });
  await expect(meaning).toHaveCount(2);
  await meaning.nth(1).fill("費用・犠牲");
  await page.getByRole("button", { name: "保存" }).click();
  // 編集中は入力欄のマスも同じ文字の cell として見つかるため、保存が済んで表示に戻るのを待つ
  await expect(page.getByRole("button", { name: "表を編集" })).toBeVisible();

  await expect(table.getByRole("cell", { name: "費用・犠牲", exact: true })).toHaveAttribute(
    "rowspan",
    "2",
  );
  await expect(table.getByRole("cell", { name: "犠牲", exact: true })).toHaveCount(0);
  await expect(table.getByRole("cell", { name: "費用", exact: true })).toHaveCount(0);
});
