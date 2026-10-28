import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { createRoutesStub } from "react-router";
import { vi } from "vitest";

// 教材のページ(app/routes/learn._<言語>.<言語>.<番号>/route.tsx)を、番号から引けるようにする
const pages = import.meta.glob<{ default: ComponentType }>("./routes/learn._*.*.*/route.tsx", {
  eager: true,
});

export function learnPage(language: string, section: string): ComponentType {
  const page = pages[`./routes/learn._${language}.${language}.${section}/route.tsx`];
  if (!page) throw new Error(`教材が見つからない: ${language}/${section}`);
  return page.default;
}

// ページは useFetcher などルーターの文脈を前提にするため、ルートのスタブの中で描画する
export function renderPage(Page: ComponentType) {
  const Stub = createRoutesStub([{ path: "/", Component: Page }]);
  return render(<Stub />);
}

// 作文・翻訳は開いたときに過去の提出を /api/* から読む。サーバーは立てないので、ログイン済みで提出が無い結果を返す
export function stubApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ isLoggedIn: true, submissions: [] })),
  );
}

// ブラウザの読み上げを差し替え、読み上げた文字列を記録する。jsdom には読み上げが無いため
export function recordSpeech(): string[] {
  const spoken: string[] = [];
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      lang = "";
      voice = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  vi.stubGlobal("speechSynthesis", {
    speak(utterance: SpeechSynthesisUtterance) {
      spoken.push(utterance.text);
      setTimeout(() => utterance.onend?.(new Event("end") as SpeechSynthesisEvent), 10);
    },
    cancel() {},
    getVoices: () => [],
  });
  return spoken;
}
