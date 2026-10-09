const vocabularyWords = ["vocabulary", "词汇", "vocabulaire", "Wortschatz", "vocabulario"];

const bookWords = ["book", "书", "livre", "Buch", "libro"];

// 単語ごとの見た目上の横幅を文字数から概算（1文字あたりのem係数。
// CJKは全角文字なので、フォントによらず送り幅がちょうど1emになる）
function estimateWidthEm(word: string) {
  let width = 0;
  for (const ch of word) {
    width += /[\u4E00-\u9FFF]/.test(ch) ? 1 : 0.72;
  }
  return width;
}

// VOCABOOKの見出し(h1)の中心に、流れる文字の縦の中心を合わせるための計算。
// h1の行ボックス上端の位置（ヒーロー上端からの距離）は、globals.cssの.vb-heroで
// --vb-h1-topとして画面幅ごとに定義している（page.tsxの上padding・バッジ・gapから算出）。

// VOCABOOKの「見た目の高さの中心」＝実際に文字が塗られているピクセル（インク）の
// 上端と下端の中間点。h1の行ボックス上端からの距離を、フォントサイズに対する比率で
// 表したもの。
//   line-height比 = 1.5
//   fontBoundingBoxAscent比 = 0.90、fontBoundingBoxDescent比 = 0.30
//   actualBoundingBoxAscent比（インク上端） = 0.71、actualBoundingBoxDescent比（インク下端） = 0.01
// これらから、インクの中心は行ボックス上端からフォントサイズのちょうど0.70倍の位置になる
// （h1のフォントや文字列を変えたら、この値も実測し直すこと）
const VOCABOOK_INK_CENTER_RATIO = 0.7;

// VOCABOOKのインクの高さ（上端〜下端）は、上と同じ実測により
// actualBoundingBoxAscent比(0.71) + actualBoundingBoxDescent比(0.01) = フォントサイズの0.72倍
const VOCABOOK_INK_HEIGHT_RATIO = 0.72;

// VOCABOOKのフォントサイズはglobals.cssの.vb-heroで定義しているCSS変数--vb-title。
// 縦方向の位置はすべてその倍数で指定する
// VOCABOOKの視覚的な縦中心（背景コンテナ上端からの距離、px + --vb-titleの倍数）
const VOCABOOK_CENTER = `calc(var(--vb-h1-top) + ${VOCABOOK_INK_CENTER_RATIO} * var(--vb-title))`;

// 二次曲線の頂点（画面中央、単語がVOCABOOKの前を横切る瞬間）どうしの距離は、
// 元のデザイン（見出しが18.7vw）でのVOCABOOKの実際の文字の高さ（インクの上端〜下端）の2倍。
// 見出しを小さくした後も、弧の大きさは元のデザインのまま保っている。
// 頂点は中心から一番遠い位置（弧の基準位置＝画面外の待機列にいる間は中心に寄り、
// 中央で最も離れる向き）になるようにし、そこから中心までの距離はその半分
// （globals.cssの@keyframes vb-wave-dip/vb-wave-peakの振れ幅と連動しているので、
// 変更する場合は両方を合わせて直すこと）
const ORIGINAL_VOCABOOK_FONT_SIZE_VW = 18.7;
const VERTEX_OFFSET_VW = VOCABOOK_INK_HEIGHT_RATIO * ORIGINAL_VOCABOOK_FONT_SIZE_VW;

type Curve = {
  // "dip"は画面中央で下に凸（谷）、"peak"は画面中央で上に凸（山）。
  // 頂点はどちらも画面横幅の中心。振れ幅を抑えて互いに交差しないようにする
  shape: "dip" | "peak";
  // 弧の基準位置（アニメーション開始・終了時点の高さ。背景コンテナ上端からの距離）
  baselineTop: string;
  // 単語がスタート地点からゴール地点まで移動する距離（画面外の余白を含む、vw）
  travelVw: number;
  // フォントサイズ（vw指定。画面幅に比例させることで、どの画面幅でも
  // 1emあたりのvw換算値が変わらず、単語間隔の計算が崩れないようにする）
  fontSizeVw: number;
  fontSizeMinRem: number;
  fontSizeMaxRem: number;
  // 単語と単語の間に空けるスペース（em）
  gapEm: number;
  durationSeconds: number;
  direction: "normal" | "reverse";
};

const TOP_CURVE: Curve = {
  // "peak"（頂点でVERTEX_OFFSET_VW分上に動く）にすることで、画面中央でVOCABOOKから
  // 一番遠ざかる（＝重ならない）向きにする
  shape: "peak",
  // 弧の基準位置（画面外の待機列にいる高さ）はVOCABOOKの縦中心そのもの。
  // 頂点（画面中央）ではそこからVERTEX_OFFSET_VW分上に離れる
  baselineTop: VOCABOOK_CENTER,
  travelVw: 124,
  fontSizeVw: 4.4,
  fontSizeMinRem: 0.8,
  fontSizeMaxRem: 5.5,
  gapEm: 2.2,
  durationSeconds: 34,
  direction: "reverse",
};

const BOTTOM_CURVE: Curve = {
  // "dip"（頂点でVERTEX_OFFSET_VW分下に動く）にすることで、画面中央でVOCABOOKから
  // 一番遠ざかる（＝重ならない）向きにする
  shape: "dip",
  // 弧の基準位置（画面外の待機列にいる高さ）はVOCABOOKの縦中心そのもの。
  // 頂点（画面中央）ではそこからVERTEX_OFFSET_VW分下に離れる
  baselineTop: VOCABOOK_CENTER,
  travelVw: 124,
  fontSizeVw: 3.6,
  fontSizeMinRem: 0.6,
  fontSizeMaxRem: 4.5,
  gapEm: 2.2,
  durationSeconds: 34,
  direction: "normal",
};

function buildChain(words: string[], curve: Curve) {
  const stepVw = curve.fontSizeVw; // 1emあたりのvw換算値
  const chainWords: string[] = [];
  const offsetsVw: number[] = [];

  let cumulativeVw = 0;
  let i = 0;
  // 画面外の待機列も含めて、移動距離全体が単語で埋まるまで並べる
  while (cumulativeVw < curve.travelVw) {
    const word = words[i % words.length];
    const widthVw = estimateWidthEm(word) * stepVw;
    chainWords.push(word);
    // 各単語はtranslate(-50%, -50%)で「その位置」を中心にレンダリングされるため、
    // 枠の開始位置ではなく枠の中心（開始位置 + 単語幅の半分）をオフセットにする。
    // 開始位置をそのまま使うと、単語ごとに幅が違う分だけ隣の単語との間隔が
    // 均等にならない（幅が広い単語ほど左にずれて詰まって見える）
    offsetsVw.push(cumulativeVw + widthVw / 2);
    cumulativeVw += widthVw + curve.gapEm * stepVw;
    i++;
  }

  // ループの継ぎ目（最後の単語→最初の単語）も他と同じ間隔になるよう、
  // 固定のtravelVwではなく実際に単語で埋まった合計幅を1周期として使う
  const loopPeriodVw = cumulativeVw;

  return chainWords.map((word, idx) => {
    const t = offsetsVw[idx] / loopPeriodVw;
    return { word, delaySeconds: -t * curve.durationSeconds };
  });
}

function WaveCurve({
  words,
  curve,
  className,
}: {
  words: string[];
  curve: Curve;
  className: string;
}) {
  const items = buildChain(words, curve);

  return (
    <>
      {items.map(({ word, delaySeconds }, i) => (
        <span
          key={`${word}-${i}`}
          className={`vb-wave-item vb-wave-item--${curve.shape} whitespace-nowrap font-serif ${className}`}
          style={{
            top: curve.baselineTop,
            fontSize: `clamp(${curve.fontSizeMinRem}rem, ${curve.fontSizeVw}vw, ${curve.fontSizeMaxRem}rem)`,
            animationDuration: `${curve.durationSeconds}s`,
            animationDirection: curve.direction,
            animationDelay: `${delaySeconds}s`,
          }}
        >
          {word}
        </span>
      ))}
    </>
  );
}

// 背景の装飾：画面横幅の中心を頂点とする、下に凸／上に凸の2本の弧（交差しない）に沿って単語が連なって流れる
export default function Background() {
  return (
    <div
      aria-hidden="true"
      // 装飾目的なのでaria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
    >
      <WaveCurve
        words={vocabularyWords}
        curve={TOP_CURVE}
        className="text-zinc-300 dark:text-zinc-800"
      />
      <WaveCurve
        words={bookWords}
        curve={BOTTOM_CURVE}
        className="text-zinc-300 dark:text-zinc-800"
      />
    </div>
  );
}
