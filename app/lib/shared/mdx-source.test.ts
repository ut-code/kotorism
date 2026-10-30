import { describe, expect, it } from "vite-plus/test";

import { unescapeMarkdown } from "./mdx-source";

describe("unescapeMarkdown", () => {
  it("Markdown のエスケープ対象記号からバックスラッシュを外す", () => {
    expect(unescapeMarkdown(String.raw`\_ \* \| \[ \] \-`)).toBe("_ * | [ ] -");
  });

  it("エスケープ対象外のバックスラッシュは保持する", () => {
    expect(unescapeMarkdown(String.raw`\q \\`)).toBe("\\q \\");
  });
});
