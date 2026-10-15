import type { ImgHTMLAttributes } from "react";

// next/image 相当の最小実装(最適化はせず <img> を出すだけ)
type Props = ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  preload?: boolean;
  fill?: boolean;
};

export default function Image({ priority, preload, fill, style, alt, ...props }: Props) {
  return (
    <img
      alt={alt}
      loading={priority || preload ? "eager" : "lazy"}
      style={
        fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style
      }
      {...props}
    />
  );
}
