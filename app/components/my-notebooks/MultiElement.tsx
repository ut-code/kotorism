import React, { useState } from "react";

//カードに使うデータ型の設定
interface MultiElementCardProps {
  faces: React.ReactNode[];
  columnNames?: string[];
  width?: number;
  height?: number;
  showHint?: boolean;
}

//以下多要素単語帳のカード
const MultiElementCard: React.FC<MultiElementCardProps> = ({
  faces,
  columnNames = [],
  width = 340,
  height = 220,
  showHint = true,
}) => {
  //回転回数の記録
  const [rotationStep, setRotationStep] = useState(0);

  // 面の数と1ステップの回転数を用意しておく
  const numFaces = faces.length;
  const angleStep = 360 / numFaces;

  // 正多角形の重心から面までの距離（奥行き押し出し量）
  const tz = Math.round(width / (2 * Math.tan(Math.PI / numFaces)));

  // 視点を上に持ち上げて見下ろす量。カードの高さに比例させることで、
  // サイズを変えても常に同じ見下ろし角度・全体像が収まるようにする
  const perspectiveOriginY = Math.round(height * -0.73);

  // クリック位置（左側か右側か）に応じて回転方向を分岐
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;
    //回転回数の更新
    if (clickX < halfWidth) {
      setRotationStep((prev) => prev - 1);
    } else {
      setRotationStep((prev) => prev + 1);
    }
  };
  //表示角度の決定
  const targetAngle = rotationStep * -angleStep;

  // 今見ている面を割り出す
  const currentIndex = ((rotationStep % numFaces) + numFaces) % numFaces;

  // 左クリック（前へ）で行く面の名前を取得
  const prevIndex = (currentIndex - 1 + numFaces) % numFaces;
  const prevLabel = columnNames[prevIndex] || "前へ";

  // 右クリック（次へ）で行く面の名前を取得
  const nextIndex = (currentIndex + 1) % numFaces;
  const nextLabel = columnNames[nextIndex] || "次へ";

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 3D 視界領域 (perspective) */}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          perspective: "1000px",
          perspectiveOrigin: `50% ${perspectiveOriginY}px`, //  視点を上に持ち上げて見下ろす
          cursor: "pointer",
          userSelect: "none",
        }}
        className="group relative my-8" // 上部に上面が見えるスペースを確保
        onClick={handleClick}
      >
        {/* 多角柱本体 */}
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
            // targetAngle だけ回転させる
            transform: `translateZ(-${tz}px) rotateY(${targetAngle}deg)`,
          }}
        >
          {faces.map((content, index) => {
            const angle = index * angleStep;
            return (
              <div
                key={index}
                style={{
                  transform: `rotateY(${angle}deg) translateZ(${tz}px)`,
                }}
                className="absolute h-full w-full flex items-center justify-center p-6 rounded-2xl [backface-visibility:visible] border border-black/18 border-t-black/30 bg-white shadow-xl shadow-black/10 inset-shadow-sm dark:border-coral-800 dark:border-t-coral-600 dark:bg-coral-900/60 dark:shadow-none"
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* 左側ホバー時の矢印ガイド（前へ＋前の要素）。本文と重ならないようカード下端に置き、列名の長さに合わせて幅が伸び、はみ出す分は省略する */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 items-end justify-start pl-2 pb-2 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-6 max-w-full items-center gap-1 rounded-full bg-black/10 px-2 text-xs font-bold whitespace-nowrap text-black backdrop-blur-sm dark:bg-white/10 dark:text-white">
            <span className="shrink-0">◀</span>
            <span className="truncate">{prevLabel}</span>
          </span>
        </div>

        {/* 右側ホバー時の矢印ガイド（次の要素＋次へ） */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 items-end justify-end pr-2 pb-2 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-6 max-w-full items-center gap-1 rounded-full bg-black/10 px-2 text-xs font-bold whitespace-nowrap text-black backdrop-blur-sm dark:bg-white/10 dark:text-white">
            <span className="truncate">{nextLabel}</span>
            <span className="shrink-0">▶</span>
          </span>
        </div>
      </div>

      {/* 操作ガイド。カードの左右をクリックしたときと同じく、ここをクリックしても前後の面へ回転する */}
      {showHint && (
        <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <button
            type="button"
            onClick={() => setRotationStep((prev) => prev - 1)}
            className="rounded px-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            ◀ 左: 戻る
          </button>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            onClick={() => setRotationStep((prev) => prev + 1)}
            className="rounded px-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            右: 進む ▶
          </button>
        </div>
      )}

      {/* 回転は見た目でしか分からないため、今どの面を向いているかを読み上げ用に伝える */}
      <p role="status" className="sr-only">
        表示中の面: {columnNames[currentIndex] || `${currentIndex + 1}面目`}
      </p>
    </div>
  );
};

export default MultiElementCard;
