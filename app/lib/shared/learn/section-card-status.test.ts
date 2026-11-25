import { describe, expect, it } from "vite-plus/test";

import { sectionCardStatus, sectionCardStatusLabel } from "./section-card-status";

const label = (input: Parameters<typeof sectionCardStatus>[0]) =>
  sectionCardStatusLabel(sectionCardStatus(input));

describe("sectionCardStatus", () => {
  it("開いたことがなく回答もなければ「未着手」", () => {
    expect(label({ viewed: false, attemptCount: 0, correctCount: 0 })).toBe("未着手");
  });

  it("開いたことがあり回答がなければ（読み物のセクションなど）「取り組んだ」", () => {
    expect(label({ viewed: true, attemptCount: 0, correctCount: 0 })).toBe("取り組んだ");
  });

  it("クイズに回答していれば通算の正解数を出す（開いた記録が消えていても）", () => {
    expect(label({ viewed: true, attemptCount: 10, correctCount: 8 })).toBe("正解 8/10");
    expect(label({ viewed: false, attemptCount: 3, correctCount: 0 })).toBe("正解 0/3");
  });

  it("正解数が回答数を超える不整合なデータでも、回答数までにおさえる", () => {
    expect(label({ viewed: true, attemptCount: 2, correctCount: 5 })).toBe("正解 2/2");
  });
});
