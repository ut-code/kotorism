import { describe, expect, it } from "vite-plus/test";

import {
  getTranslationProblem,
  getTranslationProblems,
  getTranslationTopics,
  TRANSLATION_PROBLEMS,
} from "./problems";

describe("翻訳のプリセット問題", () => {
  it("各言語でトピックごとに両方向の問題を2問ずつ持つ", () => {
    for (const [language, problems] of Object.entries(TRANSLATION_PROBLEMS)) {
      const topics = getTranslationTopics(language);

      expect(topics.length).toBeGreaterThan(0);
      expect(new Set(topics).size).toBe(topics.length);
      expect(new Set(problems.map(({ id }) => id)).size).toBe(problems.length);

      for (const topic of topics) {
        const topicProblems = problems.filter((problem) => problem.topic === topic);
        expect(topicProblems.filter(({ direction }) => direction === "toJapanese")).toHaveLength(2);
        expect(topicProblems.filter(({ direction }) => direction === "fromJapanese")).toHaveLength(
          2,
        );
        expect(
          topicProblems.every(
            ({ sourceText, referenceTranslation }) => sourceText && referenceTranslation,
          ),
        ).toBe(true);
      }
    }
  });

  it("言語・方向・IDで問題を取得し、未知の入力には空配列または undefined を返す", () => {
    const frenchToJapanese = getTranslationProblems("french", "toJapanese");
    expect(frenchToJapanese.length).toBeGreaterThan(0);
    expect(frenchToJapanese.every(({ direction }) => direction === "toJapanese")).toBe(true);

    const problem = frenchToJapanese[0];
    expect(getTranslationProblem("french", problem.id)).toEqual(problem);
    expect(getTranslationProblem("unknown", problem.id)).toBeUndefined();
    expect(getTranslationProblems("unknown")).toEqual([]);
    expect(getTranslationTopics("unknown")).toEqual([]);
  });
});
