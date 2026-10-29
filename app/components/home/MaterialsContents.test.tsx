import { render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { MaterialsContents } from "./MaterialsContents";

const section = (sectionSlug: string, title: string) => ({ sectionSlug, title, description: null });

function renderContents() {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: () => (
        <MaterialsContents
          sections={{
            chinese: [section("01", "作文"), section("06", "簡体字と日本語漢字の比較")],
            french: [section("01", "作文"), section("09", "発音クイズ")],
            german: [section("07", "数字・時間表現の演習")],
            spanish: [section("05", "文法クイズ（基本）")],
          }}
        />
      ),
    },
  ]);
  return render(<Stub />);
}

describe("MaterialsContents", () => {
  it("言語ごとに、実際の教材のセクションの題名を並べる", () => {
    renderContents();
    const french = screen.getByRole("link", { name: /フランス語/ }).closest("section");
    expect(french).not.toBeNull();
    const items = within(french as HTMLElement)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(items).toEqual(["作文", "発音クイズ"]);
    expect(screen.getByText("簡体字と日本語漢字の比較")).toBeInTheDocument();
  });

  it("言語名はその言語の教材ページへのリンクになっている", () => {
    renderContents();
    expect(screen.getByRole("link", { name: /中国語/ })).toHaveAttribute("href", "/learn/chinese");
    expect(screen.getByRole("link", { name: /スペイン語/ })).toHaveAttribute(
      "href",
      "/learn/spanish",
    );
  });
});
