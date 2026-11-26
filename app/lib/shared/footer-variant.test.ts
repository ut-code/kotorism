import { describe, expect, it } from "vite-plus/test";

import { footerVariant } from "./footer-variant";

describe("footerVariant", () => {
  it("トップページだけ大きなフッター", () => {
    expect(footerVariant("/")).toBe("full");
  });

  it.each(["/history", "/my-notebooks", "/my-notebooks/abc", "/learn/french/01", "/login"])(
    "アプリ内の画面 %s は1行のフッター",
    (path) => {
      expect(footerVariant(path)).toBe("compact");
    },
  );

  it.each([
    "/my-notebooks/abc/study",
    "/my-notebooks/abc/quiz",
    "/my-notebooks/abc/review",
    "/share/abc/study",
    "/share/abc/quiz/",
  ])("練習中 %s はフッターを出さない", (path) => {
    expect(footerVariant(path)).toBe("none");
  });
});
