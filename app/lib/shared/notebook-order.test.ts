import { describe, expect, it } from "vite-plus/test";

import { clampToGroup, notebookGroup, sortNotebooks } from "./notebook-order";

const notebook = (
  id: string,
  favorite: boolean,
  listPosition: number,
  createdAt: string,
  studied = false,
) => ({ id, favorite, studied, listPosition, createdAt: new Date(createdAt) });

describe("sortNotebooks", () => {
  it("お気に入りを上にまとめ、それぞれの中では並び順、同じ並び順なら作成日の新しい順に並べる", () => {
    const sorted = sortNotebooks([
      notebook("old", false, 0, "2026-01-01"),
      notebook("new", false, 0, "2026-03-01"),
      notebook("fav-2", true, 2, "2026-02-01"),
      notebook("top", false, -1, "2026-01-15"),
      notebook("fav-1", true, 1, "2026-01-10"),
    ]);
    expect(sorted.map((n) => n.id)).toEqual(["fav-1", "fav-2", "top", "new", "old"]);
  });

  it("学習済みは、お気に入りでも一番下にまとめる", () => {
    const sorted = sortNotebooks([
      notebook("done", false, -5, "2026-03-01", true),
      notebook("plain", false, 0, "2026-01-01"),
      notebook("fav-done", true, 0, "2026-02-01", true),
      notebook("fav", true, 0, "2026-01-01"),
    ]);
    expect(sorted.map((n) => n.id)).toEqual(["fav", "plain", "done", "fav-done"]);
  });
});

describe("notebookGroup", () => {
  it("お気に入り（0）・それ以外（1）・学習済み（2）のまとまりに分ける", () => {
    expect(notebookGroup({ favorite: true, studied: false })).toBe(0);
    expect(notebookGroup({ favorite: false, studied: false })).toBe(1);
    expect(notebookGroup({ favorite: true, studied: true })).toBe(2);
  });
});

describe("clampToGroup", () => {
  // 0,1 番がお気に入り、2,3 番がそれ以外、4 番が学習済み
  const groups = [0, 0, 1, 1, 2];

  it("同じまとまりの中なら、入れる位置をそのまま使う", () => {
    expect(clampToGroup(groups, 3, 2)).toBe(2);
    expect(clampToGroup(groups, 0, 2)).toBe(2);
  });

  it("まとまりの境目をまたぐときは、自分のまとまりの端に入れる", () => {
    // それ以外（3番）をいちばん上へ → それ以外の先頭（2番の間）
    expect(clampToGroup(groups, 3, 0)).toBe(2);
    // それ以外（2番）をいちばん下へ → それ以外の最後（4番の間）
    expect(clampToGroup(groups, 2, 5)).toBe(4);
    // お気に入り（0番）をいちばん下へ → お気に入りの最後（2番の間）
    expect(clampToGroup(groups, 0, 5)).toBe(2);
    // 学習済み（4番）をいちばん上へ → 学習済みの先頭（4番の間）
    expect(clampToGroup(groups, 4, 0)).toBe(4);
  });
});
