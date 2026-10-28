import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { learnPage, renderPage, stubApi } from "@/test-utils";

beforeEach(stubApi);
afterEach(() => vi.unstubAllGlobals());

async function openEditor(language: string, section: string, start: string, placeholder: RegExp) {
  const user = userEvent.setup();
  renderPage(learnPage(language, section));
  await user.click(await screen.findByRole("button", { name: start }));
  const textarea = screen.getByPlaceholderText(placeholder);
  await user.click(textarea);
  return { user, textarea };
}

describe("作文・翻訳の特殊文字の入力補助", () => {
  it("フランス語の作文で、↑キーとボタンからアクセント記号付きの文字を入力できる", async () => {
    const { user, textarea } = await openEditor("french", "01", "書き始める", /フランス語で作文/);
    await user.keyboard("Je{ArrowUp}");
    expect(textarea).toHaveValue("Jé");

    await user.click(
      within(screen.getByRole("group", { name: "特殊文字" })).getByRole("button", { name: "ç" }),
    );
    expect(textarea).toHaveValue("Jéç");
  });

  it("文字を入力した直後でなければ、↑キーは普段どおり行を移動する", async () => {
    const { user, textarea } = await openEditor("french", "01", "書き始める", /フランス語で作文/);
    await user.keyboard("e{Enter}{ArrowUp}");
    expect(textarea).toHaveValue("e\n");
  });

  it("スペイン語の翻訳（日本語 → スペイン語）で、↑キーで ñ を入力できる", async () => {
    const { user, textarea } = await openEditor("spanish", "02", "訳し始める", /スペイン語で訳文/);
    await user.keyboard("n{ArrowUp}");
    expect(textarea).toHaveValue("ñ");
  });

  it("中国語の作文には特殊文字のボタンを出さない", async () => {
    await openEditor("chinese", "01", "書き始める", /中国語で作文/);
    expect(screen.queryByRole("group", { name: "特殊文字" })).not.toBeInTheDocument();
  });
});

// PC ではキーボードで打ち、Enter で漢字を確定し、Tab で候補を移動する
describe("中国語のピンイン入力（PC）", () => {
  it("声調に合う候補が先頭に来て、Enter で漢字・Tab で候補移動・Shift+Enter でピンインのまま確定できる", async () => {
    const { user, textarea } = await openEditor(
      "chinese",
      "01",
      "書き始める",
      /作文を書いてください/,
    );
    const candidates = () => screen.getByRole("region", { name: "ピンイン変換候補" });

    // mai → ↑ で第4声（mài）にすると、卖（売る）が先頭に来て Enter で確定される
    await user.keyboard("mai{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(candidates()).toHaveTextContent("mài");
    expect(within(candidates()).getAllByRole("button")[0]).toHaveTextContent("卖");
    await user.keyboard("{Enter}");
    expect(textarea).toHaveValue("卖");

    // Tab で 2 番目の候補に移り、Enter でその候補を確定する
    await user.keyboard("ma");
    const second = (within(candidates()).getAllByRole("button")[1].textContent ?? "")
      .replace(/^\d+\.\s*/, "")
      .trim();
    await user.keyboard("{Tab}");
    expect(textarea).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(textarea).toHaveValue(`卖${second}`);

    // Shift+Enter ではピンインのまま確定する
    await user.keyboard("nihao{Shift>}{Enter}{/Shift}");
    expect(textarea).toHaveValue(`卖${second}nihao`);
  });
});
