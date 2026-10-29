import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrismList } from "./PrismList";

describe("PrismList", () => {
  it("既定では、各行の頭に光の跡を置く", () => {
    const { container } = render(<PrismList items={["A", "B"]} tone="coral" ruleOffset={7} />);
    expect(container.querySelectorAll("li svg")).toHaveLength(2);
  });

  it("marker を false にすると、光の跡を置かずに文章だけを並べる", () => {
    const { container } = render(
      <PrismList items={["A", "B"]} tone="coral" ruleOffset={7} marker={false} />,
    );
    expect(container.querySelectorAll("li svg")).toHaveLength(0);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["A", "B"]);
  });
});
