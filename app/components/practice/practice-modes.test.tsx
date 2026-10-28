import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { learnPage, renderPage } from "@/test-utils";

// 4択の選択肢。選択肢のボタンには固有の名前が無いので、並べている箱から取る
const choices = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>(".max-w-xl .flex.flex-col.gap-2 > button"),
  );

async function expectChoiceMode(container: HTMLElement) {
  await waitFor(() => expect(choices(container)).toHaveLength(4));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
}

describe("答え方の初期設定と切り替え", () => {
  it.each([
    { name: "動詞の活用", language: "french", section: "03" },
    { name: "紛らわしい表現（フランス語）", language: "french", section: "07" },
    { name: "紛らわしい表現（スペイン語）", language: "spanish", section: "06" },
  ])("$name: 初期設定は4択で出題し、筆記に切り替えられる", async ({ language, section }) => {
    const user = userEvent.setup();
    const { container } = renderPage(learnPage(language, section));
    expect(screen.getByRole("button", { name: /^答え方/ })).toHaveTextContent("4択");
    await user.click(screen.getByRole("button", { name: "練習を始める" }));
    await expectChoiceMode(container);
    await user.click(choices(container)[0]);
    expect(screen.getByRole("status")).toHaveTextContent(/正解|不正解/);

    await user.click(screen.getByRole("button", { name: /設定に戻る/ }));
    await user.click(screen.getByRole("button", { name: /^答え方/ }));
    await user.click(screen.getByRole("radio", { name: "筆記" }));
    await user.click(screen.getByRole("button", { name: "練習を始める" }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  // 入力には時間がかかるので、PC では筆記・制限時間30秒から始め、4択にすると15秒にする
  it.each([
    { language: "french", section: "08" },
    { language: "german", section: "07" },
    { language: "spanish", section: "07" },
  ])(
    "数字・時間表現($language): 初期設定は筆記で、時刻を出題でき、4択に切り替えられる",
    async ({ language, section }) => {
      const user = userEvent.setup();
      const { container } = renderPage(learnPage(language, section));
      expect(screen.getByRole("button", { name: /^答え方/ })).toHaveTextContent("筆記");
      expect(screen.getByRole("button", { name: /^制限時間/ })).toHaveTextContent("30秒");

      await user.click(screen.getByRole("button", { name: /^出題範囲/ }));
      await user.click(screen.getByRole("radio", { name: "時刻" }));
      await user.click(screen.getByRole("button", { name: "練習を始める" }));
      expect(container.querySelector(".max-w-xl .text-6xl")?.textContent).toMatch(
        /^\d{1,2}:\d{2}$/,
      );
      expect(screen.getByRole("textbox")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /設定に戻る/ }));
      await user.click(screen.getByRole("button", { name: /^答え方/ }));
      await user.click(screen.getByRole("radio", { name: "4択" }));
      expect(screen.getByRole("button", { name: /^制限時間/ })).toHaveTextContent("15秒");
      await user.click(screen.getByRole("button", { name: "練習を始める" }));
      await expectChoiceMode(container);
    },
  );
});

describe("設定の中身", () => {
  it("動詞の活用: 時制は初学者向けに絞ったものだけを出す", async () => {
    const user = userEvent.setup();
    renderPage(learnPage("french", "03"));
    await user.click(screen.getByRole("button", { name: /^出題する時制・法/ }));
    expect(screen.getByRole("checkbox", { name: "直説法 現在" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "直説法 大過去" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "接続法 過去" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "条件法 過去" })).not.toBeInTheDocument();
  });

  it("紛らわしい表現: 閉じても、選んだ出題範囲が見出しに出る", async () => {
    const user = userEvent.setup();
    renderPage(learnPage("french", "07"));
    const toggle = screen.getByRole("button", { name: /^出題範囲/ });
    expect(toggle).toHaveTextContent("すべて");
    await user.click(toggle);
    const scope = screen.getByRole("radiogroup", { name: "出題範囲" });
    await user.click(within(scope).getByRole("radio", { name: /c'est/ }));
    await user.click(toggle);
    expect(screen.queryByRole("radiogroup", { name: "出題範囲" })).not.toBeInTheDocument();
    expect(toggle).toHaveTextContent("c'est");
  });
});

describe("文法クイズ", () => {
  it("回答して次の問題へ進める", async () => {
    const user = userEvent.setup();
    const { container } = renderPage(learnPage("chinese", "05"));
    await user.click(screen.getByRole("button", { name: "練習を始める" }));
    const progress = screen.getByRole("progressbar", { name: "進み具合" });
    expect(progress).toHaveAttribute("aria-valuenow", "0");
    await expectChoiceMode(container);
    await user.click(choices(container)[0]);
    expect(screen.getByRole("status")).toHaveTextContent(/正解|不正解/);
    await user.click(screen.getByRole("button", { name: "次の問題へ" }));
    expect(screen.getByRole("progressbar", { name: "進み具合" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  });

  it("単元を選ぶと、その単元の問題だけを出題する", async () => {
    const user = userEvent.setup();
    renderPage(learnPage("chinese", "05"));
    const total = Number(
      /(\d+) 問から/.exec(screen.getByText(/問を出題します$/).textContent ?? "")?.[1],
    );

    await user.click(screen.getByRole("button", { name: /^出題する単元/ }));
    await user.click(screen.getByRole("button", { name: "全て解除" }));
    expect(screen.getByRole("button", { name: "練習を始める" })).toBeDisabled();
    expect(screen.getByText("出題する単元を1つ以上選んでください。")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /時相・アスペクト/ }));
    await user.click(screen.getByRole("button", { name: /^問題数/ }));
    await user.click(screen.getByRole("radio", { name: "全問" }));
    const summary = screen.getByText(/^\d+ 問を出題します$/);
    const aspectCount = Number(/^(\d+)/.exec(summary.textContent ?? "")?.[1]);
    expect(aspectCount).toBeGreaterThan(0);
    expect(aspectCount).toBeLessThan(total);

    await user.click(screen.getByRole("button", { name: "練習を始める" }));
    for (let i = 0; i < aspectCount; i++) {
      await user.click(screen.getByRole("button", { name: /^1/ }));
      // 時相の問題の解説は、どれも了・着・过のいずれかを扱う
      expect(screen.getByRole("status")).toHaveTextContent(/[了着过]/);
      await user.click(screen.getByRole("button", { name: /次の問題へ|結果を見る/ }));
    }
    expect(screen.queryByRole("button", { name: "練習を始める" })).not.toBeInTheDocument();
  });
});
