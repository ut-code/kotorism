// サービス名「ことりずむ」のロゴ文字。「りずむ」の由来はプリズム（prism）で、
// 言葉（こと）が光のように分かれて広がる様子を、やわらかい明朝の「こと」（Hina Mincho）と、
// サイトの2色（コーラル→青緑）のグラデーションをかけた幾何学的なゴシックの「りずむ」（Murecho）の対比で表す。
// 「りずむ」の縁には、プリズムで分かれた光として細い虹色の線（外側0.5px）を付ける。
// 大きさ・字間・色（「こと」側）は親要素から受け継ぐ
export default function BrandName() {
  return (
    <>
      <span className="font-brand-koto">こと</span>
      {/* 文字を透明にして背景のグラデーションを文字の形に切り抜いているため、
      親の text-shadow が透けて文字が濁らないよう、影を消している */}
      <span className="relative inline-block font-brand-rism font-light [text-shadow:none]">
        {/* 縁：虹色の背景を、透明な1pxの線を引いた文字の形（線の分だけ太い）で切り抜き、後ろに敷く。
        手前の文字が線の内側半分を隠すため、外側に0.5pxだけ虹色が見える。
        CSSの縁取り(-webkit-text-stroke)は単色しか指定できないため、この重ね方にしている */}
        <span
          aria-hidden="true"
          className="vb-brand-rainbow pointer-events-none absolute inset-0 bg-clip-text text-transparent select-none [-webkit-text-stroke:1px_transparent]"
        >
          りずむ
        </span>
        <span className="relative bg-linear-100 from-coral-500 via-tealblue-300 via-55% to-tealblue-600 bg-clip-text text-transparent">
          りずむ
        </span>
      </span>
    </>
  );
}
