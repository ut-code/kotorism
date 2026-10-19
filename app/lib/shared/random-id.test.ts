import { describe, expect, it } from "vitest";

import { createRandomId } from "./random-id";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("createRandomId", () => {
  it("crypto.randomUUID が使えるときはそれを使う", () => {
    const fakeCrypto = {
      randomUUID: () => "00000000-0000-4000-8000-000000000000" as const,
      getRandomValues: crypto.getRandomValues.bind(crypto),
    };
    expect(createRandomId(fakeCrypto)).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("crypto.randomUUID が無い（http で開いた・古いブラウザ）ときも UUID の形で作れる", () => {
    const noUuidCrypto = { getRandomValues: crypto.getRandomValues.bind(crypto) };
    const ids = new Set(Array.from({ length: 100 }, () => createRandomId(noUuidCrypto)));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id).toMatch(UUID_PATTERN);
  });
});
