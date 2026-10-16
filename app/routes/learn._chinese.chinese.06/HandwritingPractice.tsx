import { useCallback, useEffect, useRef, useState } from "react";

import { apiPost } from "@/lib/shared/api-client";
import { Glyph, SpeakButton } from "./CompareCard";
import { compareList, type CharacterCompare } from "./compare-data";
import {
  MAX_SAVED_HANDWRITINGS,
  useSavedHandwritings,
  type SavedHandwriting,
} from "./handwriting-storage";

// 手書き練習（スマホ向け）。日本語の漢字を見て簡体字をキャンバスに書き、答え合わせでお手本と見比べる。
// 手書き文字の自動認識はせず、自分の目で見比べて「書けた／もう一度」を付ける

type Point = { x: number; y: number };
// 線は 0〜1 の相対座標で持ち、キャンバスの大きさが変わっても描き直せるようにする
type Stroke = Point[];

// 保存する画像の一辺（px）。localStorage に多く残せるよう小さめにする
const SAVED_IMAGE_SIZE = 240;
// 線の太さ（キャンバスの一辺に対する割合）
const LINE_WIDTH_RATIO = 0.035;
const INK_COLOR = "#18181b";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], size: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK_COLOR;
  ctx.fillStyle = INK_COLOR;
  ctx.lineWidth = size * LINE_WIDTH_RATIO;
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      // 点（タップだけ）は小さな丸として描く
      ctx.beginPath();
      ctx.arc(stroke[0].x * size, stroke[0].y * size, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    stroke.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x * size, point.y * size);
      else ctx.lineTo(point.x * size, point.y * size);
    });
    ctx.stroke();
  }
}

// 白地に線だけを描いた PNG（保存・ダウンロード用）
function exportImage(strokes: Stroke[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = SAVED_IMAGE_SIZE;
  canvas.height = SAVED_IMAGE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SAVED_IMAGE_SIZE, SAVED_IMAGE_SIZE);
  drawStrokes(ctx, strokes, SAVED_IMAGE_SIZE);
  return canvas.toDataURL("image/png");
}

function recordAnswer(correct: boolean) {
  apiPost("/api/learn", {
    intent: "quizAnswer",
    language: "chinese",
    sectionSlug: "06",
    correct,
  }).catch(() => {});
}

// 田の字の補助線（中心の縦横の点線）。キャンバスとお手本の両方の下敷きに使う
function GuideLines() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-rose-200" />
      <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-rose-200" />
    </div>
  );
}

// ---- 手書きのキャンバス ----

function HandwritingCanvas({
  strokes,
  onChange,
  overlay,
}: {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  // 薄く重ねて表示するお手本の字（なぞり書き用）
  overlay: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef(0);
  // 書いている途中の線。描画のたびに再レンダリングしないよう ref で持つ
  const drawingRef = useRef<Stroke | null>(null);
  // ポインター操作のハンドラーから最新の線を参照するための控え（描画のたびに effect で更新する）
  const strokesRef = useRef(strokes);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sizeRef.current, sizeRef.current);
    const current = drawingRef.current;
    drawStrokes(
      ctx,
      current ? [...strokesRef.current, current] : strokesRef.current,
      sizeRef.current,
    );
  }, []);

  // 表示サイズに合わせて、キャンバスの解像度（端末のピクセル密度込み）を合わせる
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      const size = entry.contentRect.width;
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = size;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      redraw();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    strokesRef.current = strokes;
    redraw();
  }, [strokes, redraw]);

  function pointOf(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = [pointOf(event)];
    redraw();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current.push(pointOf(event));
    redraw();
  }

  function handlePointerUp() {
    const stroke = drawingRef.current;
    drawingRef.current = null;
    if (stroke) onChange([...strokesRef.current, stroke]);
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-rose-200 bg-white">
      <GuideLines />
      {overlay && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-zinc-200"
          aria-hidden="true"
        >
          <Glyph char={overlay} kind="simplified" className="text-[min(60vw,18rem)] font-normal" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-label="ここに簡体字を書いてください"
        // 指で書いている間にページがスクロール・拡大しないようにする
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}

// ---- 練習の画面 ----

const toolButtonClass =
  "rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

function PracticeView({
  queue,
  onClose,
  onSave,
}: {
  queue: CharacterCompare[];
  onClose: () => void;
  onSave: (entry: Omit<SavedHandwriting, "id" | "savedAt">) => boolean;
}) {
  const [index, setIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [selfCheck, setSelfCheck] = useState<"ok" | "retry" | null>(null);
  const [saved, setSaved] = useState<"saved" | "failed" | null>(null);
  const item = queue[index % queue.length];

  function resetForNext(nextIndex: number) {
    setIndex(nextIndex);
    setStrokes([]);
    setRevealed(false);
    setShowModel(false);
    setSelfCheck(null);
    setSaved(null);
  }

  function judge(result: "ok" | "retry") {
    if (selfCheck === null) recordAnswer(result === "ok");
    setSelfCheck(result);
  }

  function save() {
    const ok = onSave({
      itemId: item.id,
      japanese: item.japanese,
      simplified: item.simplified,
      image: exportImage(strokes),
      selfCheck,
    });
    setSaved(ok ? "saved" : "failed");
  }

  return (
    // スマホでは画面いっぱい（フルスクリーン）に、PCではページ内に表示する
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white px-4 pt-4 pb-8 md:static md:z-auto md:overflow-visible md:rounded-2xl md:border md:border-tealblue-200 md:p-6 dark:bg-zinc-950 md:dark:border-tealblue-900/40">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {(index % queue.length) + 1} / {queue.length}
        </span>
        <button type="button" onClick={onClose} className={toolButtonClass}>
          練習を終える
        </button>
      </div>

      <div className="mx-auto mt-3 flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
            <Glyph char={item.japanese} kind="japanese" className="text-5xl" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              この漢字を簡体字で書いてみましょう
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              {item.meaning}（{item.reading}）・{item.pinyin}
              <SpeakButton text={item.simplified} label={`「${item.pinyin}」の発音を聞く`} />
            </p>
          </div>
        </div>

        {/* 縦に長いスマホでも、キャンバスと操作ボタンが一画面に収まる大きさにする。
            答え合わせ中は下の比較表示に自分の字を出すので、キャンバスは隠す */}
        {!revealed && (
          <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-20rem))] md:max-w-sm">
            <HandwritingCanvas
              strokes={strokes}
              onChange={setStrokes}
              overlay={showModel ? item.simplified : null}
            />
          </div>
        )}

        {!revealed ? (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setStrokes((s) => s.slice(0, -1))}
              disabled={strokes.length === 0}
              className={toolButtonClass}
            >
              1画もどす
            </button>
            <button
              type="button"
              onClick={() => setStrokes([])}
              disabled={strokes.length === 0}
              className={toolButtonClass}
            >
              すべて消す
            </button>
            <button
              type="button"
              onClick={() => setShowModel((v) => !v)}
              aria-pressed={showModel}
              className={toolButtonClass}
            >
              {showModel ? "お手本を隠す" : "お手本をなぞる"}
            </button>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              disabled={strokes.length === 0}
              className="w-full rounded-full bg-tealblue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-tealblue-700 disabled:opacity-40"
            >
              答え合わせ
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 自分の字とお手本を同じ大きさの枠に並べて見比べる */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">あなたの字</div>
                <div className="relative aspect-square overflow-hidden rounded-xl border border-rose-200 bg-white">
                  <GuideLines />
                  <img
                    src={exportImage(strokes)}
                    alt="あなたが書いた字"
                    className="relative h-full w-full mix-blend-multiply"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                  お手本（簡体字）
                </div>
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-tealblue-300 bg-white text-zinc-900">
                  <GuideLines />
                  <Glyph
                    char={item.simplified}
                    kind="simplified"
                    className="relative text-[min(30vw,9rem)] font-normal"
                  />
                </div>
              </div>
            </div>
            {item.difference && (
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {item.difference}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => judge("ok")}
                aria-pressed={selfCheck === "ok"}
                className={`rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                  selfCheck === "ok"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "border-zinc-200 text-zinc-700 hover:border-green-400 dark:border-zinc-700 dark:text-zinc-200"
                }`}
              >
                ○ 書けた
              </button>
              <button
                type="button"
                onClick={() => judge("retry")}
                aria-pressed={selfCheck === "retry"}
                className={`rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                  selfCheck === "retry"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "border-zinc-200 text-zinc-700 hover:border-red-400 dark:border-zinc-700 dark:text-zinc-200"
                }`}
              >
                × もう少し
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saved === "saved"}
                className={toolButtonClass}
              >
                {saved === "saved" ? "保存しました" : "この字を保存"}
              </button>
              <button type="button" onClick={() => resetForNext(index)} className={toolButtonClass}>
                もう一度書く
              </button>
              <button
                type="button"
                onClick={() => resetForNext(index + 1)}
                className="rounded-full bg-tealblue-600 px-6 py-2 text-sm font-bold text-white hover:bg-tealblue-700"
              >
                次の字へ
              </button>
            </div>
            {saved === "failed" && (
              <p className="text-center text-xs text-red-600 dark:text-red-400" role="alert">
                保存できませんでした。ブラウザの保存容量がいっぱいの可能性があります。古い保存を削除してください。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- 保存した手書きの一覧 ----

function SavedGallery({
  items,
  onDelete,
  onClear,
}: {
  items: SavedHandwriting[];
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        まだ保存した手書きはありません。答え合わせのあとに「この字を保存」を押すと、ここで見返せます。
      </p>
    );
  }
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((entry) => (
          <li key={entry.id} className="rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
            <div className="grid grid-cols-2 gap-1">
              <img
                src={entry.image}
                alt={`「${entry.simplified}」の手書き`}
                className="aspect-square w-full rounded-lg border border-rose-100"
              />
              <div className="flex aspect-square items-center justify-center rounded-lg bg-tealblue-50 text-zinc-900 dark:bg-tealblue-950/40 dark:text-zinc-50">
                <Glyph char={entry.simplified} kind="simplified" className="text-4xl font-normal" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                <Glyph char={entry.japanese} kind="japanese" className="text-sm font-normal" />
                {entry.selfCheck === "ok" && (
                  <span className="ml-1 text-green-600 dark:text-green-400">○</span>
                )}
                {entry.selfCheck === "retry" && (
                  <span className="ml-1 text-red-600 dark:text-red-400">×</span>
                )}
                <span className="ml-1">{new Date(entry.savedAt).toLocaleDateString("ja-JP")}</span>
              </span>
              <span className="flex gap-2">
                <a
                  href={entry.image}
                  download={`handwriting-${entry.simplified}.png`}
                  className="hover:underline"
                >
                  ダウンロード
                </a>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  className="hover:underline"
                >
                  削除
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>このブラウザに最新{MAX_SAVED_HANDWRITINGS}件まで保存されます</span>
        <button type="button" onClick={onClear} className="hover:underline">
          すべて削除
        </button>
      </div>
    </div>
  );
}

export default function HandwritingPractice() {
  const [queue, setQueue] = useState<CharacterCompare[] | null>(null);
  const saved = useSavedHandwritings();

  // スマホのフルスクリーン表示中は、後ろのページがスクロールしないようにする
  useEffect(() => {
    if (!queue || !window.matchMedia("(max-width: 767px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [queue]);

  if (queue) {
    return <PracticeView queue={queue} onClose={() => setQueue(null)} onSave={saved.add} />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-tealblue-200 bg-white p-6 text-center dark:border-tealblue-900/40 dark:bg-zinc-950">
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          日本語の漢字を見て、簡体字を指やペンで書いてみましょう。答え合わせでお手本と見比べて、書けたかどうかを自分で判定します。
          スマホでは画面いっぱいのキャンバスで練習できます。
        </p>
        <button
          type="button"
          onClick={() => setQueue(shuffle(compareList))}
          className="mt-5 rounded-full bg-tealblue-600 px-10 py-3 font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-tealblue-700"
        >
          手書き練習を始める
        </button>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-bold text-zinc-800 dark:text-zinc-100">
          保存した手書き（{saved.items.length}件）
        </h3>
        <SavedGallery items={saved.items} onDelete={saved.remove} onClear={saved.clear} />
      </section>
    </div>
  );
}
