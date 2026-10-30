import { describe, expect, it } from "vite-plus/test";

import { verbs as french } from "@/routes/learn._french.french.03/verbs";
import { verbs as german } from "@/routes/learn._german.german.03/verbs";
import { verbs as spanish } from "@/routes/learn._spanish.spanish.03/verbs";

// 初学者向けの練習なので、出題する動詞は基本的なものに絞る
describe.each([
  { language: "french", verbs: french },
  { language: "spanish", verbs: spanish },
  { language: "german", verbs: german },
])("$language の動詞の活用で出題する動詞", ({ verbs }) => {
  it("1語以上40語以下", () => {
    expect(verbs.length).toBeGreaterThan(0);
    expect(verbs.length).toBeLessThanOrEqual(40);
  });
});
