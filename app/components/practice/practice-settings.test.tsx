import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { learnPage, renderPage, stubApi } from "@/test-utils";

// どの演習も、開始ボタンを設定の一番上に置き、設定項目は見出しを押したときだけ選択肢を出す
const PRACTICES: {
  name: string;
  language: string;
  section: string;
  start: string | null;
  before?: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
}[] = [
  { name: "動詞の活用", language: "french", section: "03", start: "練習を始める" },
  { name: "穴埋め", language: "french", section: "07", start: "練習を始める" },
  { name: "数字・時間表現", language: "french", section: "08", start: "練習を始める" },
  { name: "ピンイン", language: "chinese", section: "03", start: "練習を始める" },
  { name: "中国語の文法クイズ", language: "chinese", section: "05", start: "練習を始める" },
  {
    name: "フランス語の文法クイズ（基本1）",
    language: "french",
    section: "05",
    start: "練習を始める",
  },
  {
    name: "フランス語の文法クイズ（基本2）",
    language: "french",
    section: "06",
    start: "練習を始める",
  },
  { name: "フランス語の発音クイズ", language: "french", section: "09", start: "練習を始める" },
  { name: "表完成", language: "french", section: "04", start: null },
  { name: "作文", language: "french", section: "01", start: "書き始める" },
  { name: "翻訳", language: "spanish", section: "02", start: "訳し始める" },
  {
    name: "簡体字クイズ",
    language: "chinese",
    section: "06",
    start: "クイズを始める",
    before: async (user) => {
      await user.click(
        within(screen.getByRole("group", { name: "練習の方法" })).getByRole("button", {
          name: /選択クイズ/,
        }),
      );
    },
  },
];

beforeEach(stubApi);
afterEach(() => vi.unstubAllGlobals());

describe.each(PRACTICES)("$name", ({ language, section, start, before }) => {
  it("開始ボタンが設定より上にあり、設定は見出しを押すまで開かない", async () => {
    const user = userEvent.setup();
    renderPage(learnPage(language, section));
    await before?.(user);

    const toggles = (await screen.findAllByRole("button", { expanded: false })).filter((el) =>
      el.closest("h3"),
    );
    expect(toggles.length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { expanded: true })).toHaveLength(0);
    // 開く前は選択肢を出さない
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);

    if (start) {
      // 縦に1列に並べる画面なので、DOM の順が上下の順になる
      const startButton = screen.getByRole("button", { name: start });
      expect(
        startButton.compareDocumentPosition(toggles[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    await user.click(toggles[0]);
    expect(toggles[0]).toHaveAttribute("aria-expanded", "true");
    await user.click(toggles[0]);
    expect(toggles[0]).toHaveAttribute("aria-expanded", "false");
  });
});
