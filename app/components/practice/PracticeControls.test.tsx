import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { CollapsibleChoice } from "./PracticeControls";

const OPTIONS = [
  { value: "choice", label: "4択" },
  { value: "typing", label: "筆記" },
] as const;

function Harness() {
  const [value, setValue] = useState<"choice" | "typing">("choice");
  return (
    <CollapsibleChoice title="答え方" options={[...OPTIONS]} value={value} onChange={setValue} />
  );
}

describe("CollapsibleChoice", () => {
  it("閉じている間は選択肢を出さず、見出しに今の値を出す", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: /^答え方/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveTextContent("4択");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("見出しを押すと開き、選んだ値が見出しに反映され、もう一度押すと閉じる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: /^答え方/ });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("radio", { name: "筆記" }));
    expect(screen.getByRole("radio", { name: "筆記" })).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveTextContent("筆記");

    await user.click(toggle);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
