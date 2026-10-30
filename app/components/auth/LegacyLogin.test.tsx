import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { LegacyLoginNotice } from "./LegacyLogin";

describe("LegacyLoginNotice", () => {
  it("以前ユーザー名で登録した人に、Google でログインする前に連携するよう案内する", () => {
    const Stub = createRoutesStub([{ path: "/", Component: LegacyLoginNotice }]);
    render(<Stub />);
    const notice = screen.getByRole("note");
    expect(notice).toHaveTextContent("以前ユーザー名で登録した方へ");
    expect(notice).toHaveTextContent("Google アカウントを連携");
    expect(notice).toHaveTextContent("データのない別のアカウント");
  });
});
