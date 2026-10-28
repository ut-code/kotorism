import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals を有効にしていないため testing-library の自動 cleanup が効かない。手で外さないと前のテストの DOM が残る
afterEach(cleanup);

// jsdom には matchMedia が無い。PC 幅(マウス操作)として振る舞わせる。スマホ幅の挙動は e2e で確かめる
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
