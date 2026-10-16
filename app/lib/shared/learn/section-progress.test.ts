import { describe, expect, it } from "vitest";

import {
  applyManualToggle,
  applyMarkReviewed,
  applyQuizAnswer,
  AUTO_CLEAR_BOX_THRESHOLD,
  BOX_INTERVAL_DAYS,
  createInitialSectionProgressState,
  MAX_BOX_INDEX,
  relativeReviewLabel,
} from "./section-progress";

const now = new Date("2026-10-01T09:00:00Z");
const initial = () => createInitialSectionProgressState(now);

describe("applyQuizAnswer", () => {
  it("誤答は箱を 0 に戻し、即座に自動タグを立てる", () => {
    const state = applyQuizAnswer(initial(), false, now);
    expect(state).toMatchObject({
      attemptCount: 1,
      correctCount: 0,
      box: 0,
      autoTagged: true,
      needsReview: true,
    });
  });

  it("正解が続くと箱が進み、しきい値に達すると自動タグが外れる", () => {
    let state = applyQuizAnswer(initial(), false, now);
    for (let i = 1; i < AUTO_CLEAR_BOX_THRESHOLD; i += 1) {
      state = applyQuizAnswer(state, true, now);
      expect(state.autoTagged).toBe(true);
    }
    state = applyQuizAnswer(state, true, now);
    expect(state.box).toBe(AUTO_CLEAR_BOX_THRESHOLD);
    expect(state.autoTagged).toBe(false);
    expect(state.needsReview).toBe(false);
  });

  it("箱は最大値を超えず、次回復習日は箱の間隔だけ先になる", () => {
    let state = initial();
    for (let i = 0; i < 20; i += 1) state = applyQuizAnswer(state, true, now);
    expect(state.box).toBe(MAX_BOX_INDEX);
    const days = (state.nextReviewAt.getTime() - now.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(BOX_INTERVAL_DAYS[MAX_BOX_INDEX]);
  });

  it("手動タグは正解しても needsReview を保つ", () => {
    const tagged = applyManualToggle(initial(), now);
    expect(applyQuizAnswer(tagged, true, now).needsReview).toBe(true);
  });
});

describe("applyMarkReviewed", () => {
  it("箱を 1 つ進めるが回答数は変えない", () => {
    const state = applyMarkReviewed(initial(), now);
    expect(state.box).toBe(1);
    expect(state.attemptCount).toBe(0);
    expect(state.lastReviewedAt).toEqual(now);
  });

  it("未回答なら自動タグは立たない", () => {
    expect(applyMarkReviewed(initial(), now).autoTagged).toBe(false);
  });
});

describe("applyManualToggle", () => {
  it("ON にすると箱が 0 に戻り今日中に復習になる", () => {
    const advanced = applyMarkReviewed(applyMarkReviewed(initial(), now), now);
    const state = applyManualToggle(advanced, now);
    expect(state).toMatchObject({ manuallyTagged: true, box: 0, needsReview: true });
    expect(state.nextReviewAt).toEqual(now);
  });

  it("OFF にすると自動タグの有無だけが needsReview に残る", () => {
    const on = applyManualToggle(applyQuizAnswer(initial(), false, now), now);
    expect(applyManualToggle(on, now)).toMatchObject({ manuallyTagged: false, needsReview: true });
    expect(applyManualToggle(applyManualToggle(initial(), now), now).needsReview).toBe(false);
  });
});

describe("relativeReviewLabel", () => {
  it("相対表現に変換する", () => {
    const at = (ms: number) => new Date(now.getTime() + ms);
    const day = 86_400_000;
    expect(relativeReviewLabel(at(-day), now)).toBe("今日中に復習");
    expect(relativeReviewLabel(now, now)).toBe("今日中に復習");
    expect(relativeReviewLabel(at(1), now)).toBe("明日");
    expect(relativeReviewLabel(at(day), now)).toBe("明日");
    expect(relativeReviewLabel(at(3 * day).toISOString(), now)).toBe("3日後");
  });
});
