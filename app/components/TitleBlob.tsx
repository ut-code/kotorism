// 見出し「ことりずむ」の後ろ（本の形より手前）に敷く流体シェイプ。blobs.appで作成
// （https://blobs.app/?e=6&gw=6&se=29&g=4ca1af%7Cc4e0e5&ga=315&o=0）。
export default function TitleBlob() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 500 500"
      preserveAspectRatio="none"
      // h1の中心に重ねる。大きさはh1のフォントサイズ(em)基準なので、画面幅に合わせて
      // 見出しと一緒に伸び縮みする。横は文字（約5.3em幅）を覆える幅にしている。
      // h1の直前にあるBookShapeと同じ-z-10だが、DOM上で後に描かれるため本の形の上に重なる
      className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[4.8em] w-[6em] -translate-x-1/2 -translate-y-1/2"
    >
      <defs>
        <linearGradient id="title-blob-gradient" x1="0.854" y1="0.854" x2="0.146" y2="0.146">
          <stop offset="0" stopColor="#4ca1af" />
          <stop offset="1" stopColor="#c4e0e5" />
        </linearGradient>
      </defs>
      <path
        d="M395,339Q353,428,254,421.5Q155,415,101,332.5Q47,250,104.5,173.5Q162,97,263,74.5Q364,52,400.5,151Q437,250,395,339Z"
        fill="url(#title-blob-gradient)"
      />
    </svg>
  );
}
