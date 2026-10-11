export default function BrandName() {
  return (
    <>
      <span className="font-brand">こと</span>
      {/* 文字を透明にして背景のグラデーションを文字の形に切り抜いているため、
      親の text-shadow が透けて文字が濁らないよう、影を消している */}
      <span className="relative inline-block font-brand [text-shadow:none]">
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
