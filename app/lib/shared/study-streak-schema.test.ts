import { describe, expect, it } from "vite-plus/test";

import { parseAcknowledgeStreak } from "./study-streak-schema";

function form(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
}

describe("parseAcknowledgeStreak", () => {
  it("正の整数の節目を数値にして通す", () => {
    expect(parseAcknowledgeStreak(form({ intent: "acknowledge", milestone: "7" }))).toEqual({
      success: true,
      data: { intent: "acknowledge", milestone: 7 },
    });
  });

  it.each([
    ["intent が違う", { intent: "dismiss", milestone: "7" }],
    ["intent が無い", { milestone: "7" }],
    ["節目が無い", { intent: "acknowledge" }],
    ["節目が空", { intent: "acknowledge", milestone: "" }],
    ["節目が 0", { intent: "acknowledge", milestone: "0" }],
    ["節目が負", { intent: "acknowledge", milestone: "-7" }],
    ["節目が小数", { intent: "acknowledge", milestone: "7.5" }],
    ["節目が数値でない", { intent: "acknowledge", milestone: "seven" }],
  ])("%s場合は拒否する", (_label, entries) => {
    expect(parseAcknowledgeStreak(form(entries)).success).toBe(false);
  });
});
