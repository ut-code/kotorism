import type { ImeKeyAction } from "./engine";

// ピンイン入力で、押したキーをどう扱うか。
// action: IME の操作として扱う、page: 候補のページを送る、commitThenPass: 変換を確定してからキーを入力欄に任せる、
// null: IME では扱わず入力欄（とその周りのキー操作）に任せる
export type ImeKeyResult =
  | { kind: "action"; action: ImeKeyAction }
  | { kind: "page"; delta: 1 | -1 }
  | { kind: "commitThenPass" }
  | null;

type KeyInput = {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

const action = (a: ImeKeyAction): ImeKeyResult => ({ kind: "action", action: a });

// state.pageStart は、いま見えている候補のページの先頭の番号（数字キーで選ぶ候補の位置に使う）
export function imeKeyResult(
  { key, shiftKey, ctrlKey, altKey, metaKey }: KeyInput,
  state: { converting: boolean; canCycleTone: boolean; pageStart: number },
): ImeKeyResult {
  if (ctrlKey || altKey || metaKey) return null;
  const isPinyinChar = /^[a-zA-Z']$/.test(key);
  if (!state.converting) return isPinyinChar ? action({ type: "char", char: key }) : null;

  if (isPinyinChar) return action({ type: "char", char: key });
  if (/^[1-9]$/.test(key))
    return action({ type: "select", index: state.pageStart + Number(key) - 1 });
  switch (key) {
    case " ":
      return action({ type: "space" });
    // Enter は選択中の候補（漢字）を、Shift+Enter はピンインのまま確定する
    case "Enter":
      return action({ type: shiftKey ? "commit_raw" : "enter" });
    case "Tab":
      return action({ type: shiftKey ? "prev_candidate" : "next_candidate" });
    case "Backspace":
      return action({ type: "backspace" });
    case "Escape":
      return action({ type: "escape" });
    case "ArrowUp":
    case "ArrowDown":
      // 母音の直後の ↑ / ↓ は声調記号の切り替え
      if (state.canCycleTone)
        return action({ type: "tone", direction: key === "ArrowUp" ? 1 : -1 });
      return action({ type: key === "ArrowUp" ? "arrow_left" : "arrow_right" });
    case "ArrowLeft":
      return action({ type: "arrow_left" });
    case "ArrowRight":
      return action({ type: "arrow_right" });
    case "PageDown":
    case "=":
      return { kind: "page", delta: 1 };
    case "PageUp":
    case "-":
      return { kind: "page", delta: -1 };
  }
  return key.length === 1 ? { kind: "commitThenPass" } : null;
}
