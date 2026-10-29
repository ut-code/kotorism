import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MultiElementCard from "./MultiElement";

describe("MultiElementCard", () => {
  // 面の背景が半透明だと、ダークモードで手前の面越しに奥の面が透けて見える
  it("ダークモードでも各面の背景を不透明にする", () => {
    render(<MultiElementCard faces={["apple", "りんご", "æpl"]} />);
    for (const text of ["apple", "りんご", "æpl"]) {
      const face = screen.getByText(text);
      const darkBg = face.className.split(" ").filter((c) => c.startsWith("dark:bg-"));
      expect(darkBg).not.toHaveLength(0);
      for (const c of darkBg) expect(c).not.toContain("/");
    }
  });
});
