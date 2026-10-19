import { describe, expect, it } from "vitest";

import { unescapeMarkdown } from "./mdx-source";

describe("unescapeMarkdown", () => {
  it("Markdown のエスケープ対象記号からバックスラッシュを外す", () => {
    expect(unescapeMarkdown(String.raw`\_ \* \| \[ \] \-`)).toBe("_ * | [ ] -");
  });

  it("エスケープ対象外のバックスラッシュは保持する", () => {
    expect(unescapeMarkdown(String.raw`\q \\`)).toBe("\\q \\");
  });
});
