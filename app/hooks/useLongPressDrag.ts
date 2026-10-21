import { useCallback, useEffect, useRef } from "react";

// 長押しと判定するまでの時間（ミリ秒）
const LONG_PRESS_MS = 450;
// 長押しと判定する前にこれ以上動いたら、スクロールなど別の操作とみなして長押しをやめる（px）
const MOVE_TOLERANCE = 8;
// 長押しのあと、これ以上動いたらドラッグ（並べ替え）を始める（px）
const DRAG_THRESHOLD = 6;

export type Point = { x: number; y: number };

export type LongPressDragHandlers = {
  // 長押しして、動かさずに離したとき（スマホで列名を変えるときなど）
  onLongPress?: () => void;
  // 長押しになったとき（true）・長押しが終わったとき（false）。複数の行にまたがる単語を、まとめて色付けするときなど
  onPressChange?: (pressed: boolean) => void;
  // 長押ししたまま動かし始めたとき・動かしている間・離したとき（並べ替え）
  onDragStart?: (point: Point) => void;
  onDragMove?: (point: Point) => void;
  onDragEnd?: (point: Point) => void;
};

// ボタン・入力欄などの上で押したときは、そちらの操作を優先して長押しを扱わない（既定）
const DEFAULT_IGNORE = "button, a, input, textarea, select";

function startsOn(target: EventTarget | null, selector: string) {
  return target instanceof Element && !!target.closest(selector);
}

// 要素を長押し（タッチ・マウスとも）したまま動かす操作を扱う。返す ref を要素に付ける。
// タッチでは、長押しと判定するまでは普通にスクロールでき、判定したあとはスクロールを止めてドラッグに使う
// （そのため touchmove は passive: false で登録して preventDefault する。React の onTouchMove では止められない）
// ignore: 長押しを扱わない要素（CSS セレクタ）。一覧の項目全体がリンクのときなどは、リンクの上でも扱うよう変える
export function useLongPressDrag(
  handlers: LongPressDragHandlers,
  disabled = false,
  { ignore = DEFAULT_IGNORE }: { ignore?: string } = {},
) {
  // 毎回変わるハンドラは ref で持ち、リスナーを付け直さずに最新のものを呼ぶ
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  });
  const ignoreRef = useRef(ignore);
  useEffect(() => {
    ignoreRef.current = ignore;
  });
  const cleanupRef = useRef<(() => void) | null>(null);

  const ref = useCallback((element: HTMLElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!element) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let start: Point | null = null;
    let pressed = false;
    let dragging = false;
    // 長押しのあとに続けて起きるクリック（リンクを開くなど）を無視するか
    let swallowClick = false;

    function reset() {
      clearTimeout(timer);
      start = null;
      if (pressed) handlersRef.current.onPressChange?.(false);
      pressed = false;
      dragging = false;
      element!.removeAttribute("data-long-pressed");
    }
    function begin(point: Point) {
      reset();
      start = point;
      timer = setTimeout(() => {
        pressed = true;
        // 長押しになったことを見た目で伝える（CSS の [data-long-pressed]）
        element!.setAttribute("data-long-pressed", "");
        handlersRef.current.onPressChange?.(true);
        navigator.vibrate?.(10);
      }, LONG_PRESS_MS);
    }
    // 動いたとき。長押しの最中ならドラッグとして扱った（true）かを返す
    function move(point: Point): boolean {
      if (!start) return false;
      const distance = Math.hypot(point.x - start.x, point.y - start.y);
      if (!pressed) {
        if (distance > MOVE_TOLERANCE) reset();
        return false;
      }
      if (!dragging && distance > DRAG_THRESHOLD) {
        dragging = true;
        handlersRef.current.onDragStart?.(point);
      }
      if (dragging) {
        // マウスで押したままだと文字の範囲選択が始まるので、並べ替えている間は選択を消す
        window.getSelection()?.removeAllRanges();
        handlersRef.current.onDragMove?.(point);
      }
      return true;
    }
    function end(point: Point | null) {
      const wasPressed = pressed;
      const wasDragging = dragging;
      reset();
      if (wasPressed) {
        swallowClick = true;
        setTimeout(() => (swallowClick = false), 400);
      }
      if (wasDragging && point) handlersRef.current.onDragEnd?.(point);
      else if (wasPressed) handlersRef.current.onLongPress?.();
      return wasPressed;
    }

    let lastTouch: Point | null = null;
    const onTouchStart = (event: TouchEvent) => {
      if (
        disabledRef.current ||
        event.touches.length !== 1 ||
        startsOn(event.target, ignoreRef.current)
      ) {
        return;
      }
      const touch = event.touches[0];
      lastTouch = { x: touch.clientX, y: touch.clientY };
      begin(lastTouch);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      lastTouch = { x: touch.clientX, y: touch.clientY };
      if (move(lastTouch)) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      // 長押しのあとに離したときは、そのあとのクリックや文字の選択を起こさない
      if (end(lastTouch)) event.preventDefault();
    };
    const onTouchCancel = () => reset();
    // 長押しで出るメニュー（Android の右クリック相当）を、長押しの最中は出さない
    const onContextMenu = (event: Event) => {
      if (pressed || start) event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (move({ x: event.clientX, y: event.clientY })) event.preventDefault();
    };
    const onMouseUp = (event: MouseEvent) => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      end({ x: event.clientX, y: event.clientY });
    };
    const onMouseDown = (event: MouseEvent) => {
      if (disabledRef.current || event.button !== 0 || startsOn(event.target, ignoreRef.current))
        return;
      begin({ x: event.clientX, y: event.clientY });
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onClick = (event: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    element.addEventListener("click", onClick, true);
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd);
    element.addEventListener("touchcancel", onTouchCancel);
    element.addEventListener("contextmenu", onContextMenu);
    element.addEventListener("mousedown", onMouseDown);
    cleanupRef.current = () => {
      reset();
      element.removeEventListener("click", onClick, true);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchCancel);
      element.removeEventListener("contextmenu", onContextMenu);
      element.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return ref;
}
