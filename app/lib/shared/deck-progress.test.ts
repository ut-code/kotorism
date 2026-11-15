import { describe, expect, it } from "vite-plus/test";

import { restoreQuizProgress, restoreStudyProgress, type QuizProgress } from "./deck-progress";

describe("restoreStudyProgress", () => {
  const keys = ["a:0", "b:0", "b:1", "c:0"];

  it("保存した並び順と現在位置をそのまま戻す", () => {
    const saved = { order: ["c:0", "a:0", "b:1", "b:0"], index: 2, frontColumn: "意味" };
    expect(restoreStudyProgress(saved, keys)).toEqual({
      order: [3, 0, 2, 1],
      index: 2,
      frontColumn: "意味",
    });
  });

  it("削除された出題単位は飛ばし、追加された出題単位は末尾に足す", () => {
    const saved = { order: ["c:0", "x:0", "a:0"], index: 2 };
    // c:0, a:0 が残り、b:0, b:1 は末尾に追加される。表示していた a:0 は詰めて2番目（index 1）
    expect(restoreStudyProgress(saved, keys)).toEqual({ order: [3, 0, 1, 2], index: 1 });
  });

  it("表示していた出題単位が消えていたら、その次に残っているものから再開する", () => {
    const saved = { order: ["a:0", "x:0", "c:0"], index: 1 };
    expect(restoreStudyProgress(saved, keys)?.index).toBe(1); // c:0
  });

  it("表示していた位置より後ろが全部消えていたら、残っている最後のものから再開する", () => {
    const saved = { order: ["a:0", "c:0", "x:0", "y:0"], index: 3 };
    expect(restoreStudyProgress(saved, keys)?.index).toBe(1); // c:0
  });

  it("残っている出題単位が無い・形が壊れているときは null", () => {
    expect(restoreStudyProgress({ order: ["x:0"], index: 0 }, keys)).toBeNull();
    expect(restoreStudyProgress({ order: "a:0", index: 0 }, keys)).toBeNull();
    expect(restoreStudyProgress(null, keys)).toBeNull();
  });
});

describe("restoreQuizProgress", () => {
  const question = (cardId: string, answer: string) => ({
    cardId,
    head: `head-${cardId}`,
    answer,
    hint: "",
    ruby: "",
    choices: [answer, "x", "y", "z"],
  });
  const base: QuizProgress = {
    phase: "quiz",
    column: "意味",
    roundSize: 10,
    target: "all",
    audio: "on",
    questions: [question("a", "犬"), question("b", "猫")],
    index: 1,
    selected: null,
    mistakes: [question("a", "犬")],
    correctCount: 0,
  };
  const context = { cardIds: ["a", "b"], quizColumns: ["意味"] };

  it("今の単語帳と合う途中経過はそのまま戻す", () => {
    expect(restoreQuizProgress(base, context)).toEqual(base);
    const answered = { ...base, selected: "猫" };
    expect(restoreQuizProgress(answered, context)).toEqual(answered);
  });

  it("答える列が出題できなくなっていたら null", () => {
    expect(restoreQuizProgress(base, { ...context, quizColumns: ["発音"] })).toBeNull();
  });

  it("出題元の単語が削除されていたら null", () => {
    expect(restoreQuizProgress(base, { ...context, cardIds: ["b"] })).toBeNull();
  });

  it("数が合わない・選んだ選択肢が無い・形が壊れているときは null", () => {
    expect(restoreQuizProgress({ ...base, index: 2 }, context)).toBeNull();
    expect(restoreQuizProgress({ ...base, correctCount: 2 }, context)).toBeNull();
    expect(restoreQuizProgress({ ...base, selected: "鳥" }, context)).toBeNull();
    expect(restoreQuizProgress({ ...base, phase: "settings" }, context)).toBeNull();
    expect(restoreQuizProgress("broken", context)).toBeNull();
  });
});
