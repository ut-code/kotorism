// 矢印キー（← →）で隣の入力欄へ移ってよいか。文字の途中では欄の中でカーソルを動かすだけにするため、
// → は文字の最後、← は文字の先頭にカーソルがある（範囲選択していない）ときだけ移る
export function caretAtEdge(input: HTMLInputElement, forward: boolean): boolean {
  const { selectionStart, selectionEnd, value } = input;
  if (selectionStart !== selectionEnd) return false;
  return forward ? selectionEnd === value.length : selectionStart === 0;
}

// 隣の入力欄へ移る。進んだ向きに合わせて、→ なら先頭、← なら最後にカーソルを置く
export function focusInput(next: HTMLInputElement, forward: boolean) {
  next.focus();
  const caret = forward ? 0 : next.value.length;
  next.setSelectionRange(caret, caret);
}
