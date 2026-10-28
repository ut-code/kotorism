import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { learnPage, recordSpeech, renderPage } from "@/test-utils";

const choices = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>(".max-w-xl .flex.flex-col.gap-2 > button"),
  );
const kindOf = () => screen.getByText(/^(聞き取り|ルール|読み方)\s/).textContent?.split(/\s/)[0];

let spoken: string[];
beforeEach(() => {
  spoken = recordSpeech();
});
afterEach(() => vi.unstubAllGlobals());

// 形式を絞る。チェックを外した形式は出題しない
async function onlyKind(user: ReturnType<typeof userEvent.setup>, uncheck: RegExp[]) {
  await user.click(screen.getByRole("button", { name: /^出題する形式/ }));
  for (const name of uncheck) await user.click(screen.getByRole("checkbox", { name }));
}

describe("フランス語の発音クイズ", () => {
  it("単元・形式を選べる", async () => {
    const user = userEvent.setup();
    renderPage(learnPage("french", "09"));
    expect(screen.queryByText("ブラウザの読み上げ機能")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^出題する単元/ }));
    expect(screen.getByRole("checkbox", { name: /鼻母音/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^出題する形式/ }));
    expect(screen.getByRole("checkbox", { name: /聞き取り/ })).toBeInTheDocument();
  });

  // 全問を1問ずつ解くので、ほかのテストと並行して動くと既定の5秒では足りない
  it("全問を4択で出題し、形式ごとに読み上げ・答え合わせができ、どの問題にも解説が出る", async () => {
    const user = userEvent.setup();
    const { container } = renderPage(learnPage("french", "09"));
    await user.click(screen.getByRole("button", { name: /^問題数/ }));
    await user.click(screen.getByRole("radio", { name: "全問" }));
    // 聞き取りは出題と同時に読み上げるので、出題する操作の前に読み上げた回数を控えておく
    let before = spoken.length;
    await user.click(screen.getByRole("button", { name: "練習を始める" }));

    const kinds = new Set<string>();
    for (;;) {
      expect(choices(container)).toHaveLength(4);
      const kind = kindOf() ?? "";
      kinds.add(kind);

      if (kind === "聞き取り") {
        // 出題すると語を読み上げ、「もう一度聞く」でも同じ語を読み上げる
        await waitFor(() => expect(spoken).toHaveLength(before + 1));
        await user.click(screen.getByRole("button", { name: "もう一度聞く" }));
        await waitFor(() => expect(spoken).toHaveLength(before + 2));
        expect(spoken[before + 1]).toBe(spoken[before]);
        await user.click(choices(container)[0]);
      } else if (kind === "読み方") {
        // 選択肢を押すと、その発音を読み上げて選ぶだけで、答え合わせはまだしない
        await user.click(choices(container)[1]);
        await waitFor(() => expect(spoken).toHaveLength(before + 1));
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        await user.click(choices(container)[2]);
        await waitFor(() => expect(spoken).toHaveLength(before + 2));
        expect(spoken[before + 1]).not.toBe(spoken[before]);
        await user.click(screen.getByRole("button", { name: "答え合わせ" }));
      } else {
        await user.click(choices(container)[0]);
      }
      expect(screen.getByRole("status")).toHaveTextContent("解説:");

      const next = screen.getByRole("button", { name: /次の問題へ|結果を見る/ });
      const isLast = next.textContent === "結果を見る";
      before = spoken.length;
      await user.click(next);
      if (isLast) break;
    }
    expect(kinds).toEqual(new Set(["聞き取り", "ルール", "読み方"]));
  }, 20_000);

  it("読み方の問題は、答え合わせのあとも選択肢を押して聞き比べられる", async () => {
    const user = userEvent.setup();
    const { container } = renderPage(learnPage("french", "09"));
    await onlyKind(user, [/聞き取り/, /ルール/]);
    await user.click(screen.getByRole("button", { name: "練習を始める" }));

    expect(kindOf()).toBe("読み方");
    expect(screen.getByRole("button", { name: "答え合わせ" })).toBeDisabled();
    // 答え合わせの前は発音記号を見せず、「発音 1」〜「発音 4」と番号だけを出す
    expect(choices(container).map((c) => c.textContent)).toEqual([
      expect.stringMatching(/発音 1/),
      expect.stringMatching(/発音 2/),
      expect.stringMatching(/発音 3/),
      expect.stringMatching(/発音 4/),
    ]);
    expect(choices(container).filter((c) => c.textContent?.includes("["))).toHaveLength(0);
    await user.click(choices(container)[0]);
    await user.click(screen.getByRole("button", { name: "答え合わせ" }));
    expect(screen.getByRole("status")).toHaveTextContent(/正解|不正解/);
    // 答え合わせのあとは、どの選択肢にも発音記号を出す
    expect(choices(container).filter((c) => /\[.+\]/.test(c.textContent ?? ""))).toHaveLength(4);

    const before = spoken.length;
    await user.click(choices(container)[3]);
    await waitFor(() => expect(spoken).toHaveLength(before + 1));
  });

  it("形式を絞ると、その形式の問題だけを出題する", async () => {
    const user = userEvent.setup();
    const { container } = renderPage(learnPage("french", "09"));
    await onlyKind(user, [/聞き取り/, /読み方/]);
    await user.click(screen.getByRole("button", { name: "練習を始める" }));
    for (let i = 0; i < 5; i++) {
      expect(kindOf()).toBe("ルール");
      await user.click(choices(container)[0]);
      await user.click(screen.getByRole("button", { name: /次の問題へ|結果を見る/ }));
    }
  });
});
