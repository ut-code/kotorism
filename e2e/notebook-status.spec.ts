import { expect, test, type Page } from "@playwright/test";

import { signUpWithPassword } from "./auth-helpers";
import { E2E_USER } from "./constants";
import { createNotebook } from "./helpers";

const ownList = (page: Page) => page.getByRole("list", { name: "作成済みの単語帳" });
const ownItem = (page: Page, title: string) =>
  ownList(page).getByRole("listitem").filter({ hasText: title });

test("学習済みにした単語帳は一覧の一番下にグレーで並び、学習中に戻すと元の位置へ戻る", async ({
  page,
}) => {
  const prefix = "学習済みの確認";
  for (const name of ["A", "B"]) await createNotebook(page, `${prefix} ${name}`);
  await page.goto("/my-notebooks");

  await ownItem(page, `${prefix} B`).getByRole("button", { name: "学習済みにする" }).click();
  // 学習済みは、ほかのテストの単語帳も含めて一覧の一番下
  await expect(ownList(page).getByRole("listitem").last()).toContainText(`${prefix} B`);
  await expect(ownItem(page, `${prefix} B`)).toHaveAttribute("data-studied", "true");
  // グレー（題名の文字が、学習中の単語帳より薄い）
  const titleColor = (title: string) =>
    ownItem(page, title)
      .locator("p")
      .first()
      .evaluate((p) => getComputedStyle(p).color);
  expect(await titleColor(`${prefix} B`)).not.toBe(await titleColor(`${prefix} A`));
  await page.reload();
  await expect(ownList(page).getByRole("listitem").last()).toContainText(`${prefix} B`);

  await ownItem(page, `${prefix} B`).getByRole("button", { name: "学習中に戻す" }).click();
  await expect(ownItem(page, `${prefix} B`)).toHaveAttribute("data-studied", "false");
  await expect(ownList(page).getByRole("listitem").last()).not.toContainText(`${prefix} B`);
});

test("共有された単語帳には、誰から共有されたかを薄く小さい文字で出す", async ({
  page,
  browser,
}) => {
  // 作成者（e2e ユーザー）が単語帳を作り、招待リンクを発行する
  await createNotebook(page, "共有元の確認の単語帳");
  await page.getByRole("button", { name: "共同編集者を管理" }).click();
  await page.getByRole("button", { name: "招待リンクを発行する" }).click();
  const inviteUrl = await page.locator('input[value*="/invite/"]').inputValue();

  // 別のユーザーが登録して、招待リンクから参加する
  const guestContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const guest = await guestContext.newPage();
  await signUpWithPassword(guest.request, { name: "e2e_guest", password: "password-1234" });
  await guest.goto(new URL(inviteUrl).pathname);
  await guest.getByRole("button", { name: "参加する" }).click();
  await expect(
    guest.getByRole("heading", { level: 1, name: "共有元の確認の単語帳" }),
  ).toBeVisible();

  const sharedBy = `${E2E_USER.name}さんから共有`;
  // 単語帳のページ
  await expect(guest.getByText(sharedBy)).toBeVisible();

  // 一覧の「共有されている単語帳」
  await guest.goto("/my-notebooks");
  const item = guest.getByRole("listitem").filter({ hasText: "共有元の確認の単語帳" });
  const note = item.getByText(sharedBy);
  await expect(note).toBeVisible();
  // 題名より小さく、薄い色
  const style = (locator: typeof note) =>
    locator.evaluate((el) => ({
      size: parseFloat(getComputedStyle(el).fontSize),
      color: getComputedStyle(el).color,
    }));
  const noteStyle = await style(note);
  const titleStyle = await style(item.getByText("共有元の確認の単語帳", { exact: true }));
  expect(noteStyle.size).toBeLessThan(titleStyle.size);
  expect(noteStyle.color).not.toBe(titleStyle.color);
  await guestContext.close();
});

test("単語帳を削除しても学習記録は残り、学習履歴には元の名前に（削除済み）を付けて出す", async ({
  page,
  baseURL,
}) => {
  const notebookUrl = await createNotebook(page, "削除後も記録が残る単語帳");
  const deckId = notebookUrl.split("/").pop()!;
  const recorded = await page.request.post("/api/study-time", {
    data: {
      clientId: "e2e-deleted-deck",
      activity: { kind: "deck", deckId, mode: "study" },
      seconds: 90,
    },
    headers: { Origin: baseURL! },
  });
  expect(recorded.ok()).toBe(true);

  await page.goto("/my-notebooks");
  page.once("dialog", (dialog) => dialog.accept());
  await ownItem(page, "削除後も記録が残る単語帳").getByRole("button", { name: "削除" }).click();
  await expect(ownItem(page, "削除後も記録が残る単語帳")).toHaveCount(0);

  await page.goto("/history");
  // 学習内容の一覧（教材ごとの学習時間）に、元の名前で残る
  await expect(
    page.getByRole("listitem").filter({ hasText: "削除後も記録が残る単語帳（削除済み）" }),
  ).toContainText("1分");
  // 学習カレンダーの単語帳の絞り込みにも出る
  await expect(
    page.getByRole("combobox", { name: "単語帳" }).getByRole("option", {
      name: "削除後も記録が残る単語帳（削除済み）",
    }),
  ).toHaveCount(1);
});
