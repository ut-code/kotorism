import { describe, expect, it } from "vitest";

import { getSections } from "./content";
import { LANGUAGES } from "./languages";

describe.each(LANGUAGES.map((l) => l.languageSlug))("getSections(%s)", (language) => {
  it("同じ教材を重複して返さない", async () => {
    const sections = await getSections(language);
    expect(sections.length).toBeGreaterThan(0);
    const slugs = sections.map((s) => s.sectionSlug);
    const titles = sections.map((s) => s.title);
    expect(new Set(slugs).size, slugs.join(", ")).toBe(slugs.length);
    expect(new Set(titles).size, titles.join(", ")).toBe(titles.length);
  });
});

// 文法クイズは易しいものから順に解いてほしいので、一覧の並びを固定する
describe.each([
  {
    language: "french",
    order: ["文法クイズ（基本1）", "文法クイズ（基本2）", "文法クイズ（紛らわしい表現）"],
  },
  {
    language: "spanish",
    order: ["文法クイズ（基本）", "文法クイズ（紛らわしい表現）"],
  },
  {
    language: "german",
    order: ["文法クイズ（格変化）", "文法クイズ（その他）"],
  },
])("getSections($language) の文法クイズ", ({ language, order }) => {
  it(`「${order.join("」→「")}」の順に並ぶ`, async () => {
    const titles = (await getSections(language)).map((s) => s.title);
    const first = titles.indexOf(order[0]);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(titles.slice(first, first + order.length)).toEqual(order);
  });
});
