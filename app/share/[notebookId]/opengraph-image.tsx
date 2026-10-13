import { ImageResponse } from "next/og";

import { prisma } from "@/lib/prisma";

export const alt = "Vocabook の共有された単語帳";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 公開状態はDBの最新値を見る必要があるため、ページと同様に静的化しない
export const dynamic = "force-dynamic";

// ImageResponseは日本語のグリフを持つフォントを自前で渡さないと文字化けするため、
// Google FontsからNoto Sans JPを、画像に使う文字のぶんだけ取得する（文字数が少ないので軽い）。
// UAを指定しないとtruetypeで返ってくる（ImageResponseはwoff2に非対応）
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`,
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

const MAX_TITLE_LENGTH = 40;

export default async function Image({ params }: { params: Promise<{ notebookId: string }> }) {
  const { notebookId } = await params;

  // 非公開・存在しない単語帳のタイトルは画像に載せない（共通の見た目にする）
  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId, isPublic: true },
    select: { title: true, _count: { select: { cards: true } } },
  });

  const title = notebook
    ? notebook.title.length > MAX_TITLE_LENGTH
      ? `${notebook.title.slice(0, MAX_TITLE_LENGTH)}…`
      : notebook.title
    : "Vocabook";
  const subtitle = notebook ? `${notebook._count.cards}語の単語帳` : "多言語対応の暗記学習アプリ";

  const fontData = await loadFont(`${title}${subtitle}Vocabook共有された単語帳`);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#fff7f3",
        borderLeft: "24px solid #FF7F50",
        fontFamily: fontData ? "Noto Sans JP" : undefined,
      }}
    >
      <div style={{ display: "flex", fontSize: 36, color: "#FF7F50", fontWeight: 700 }}>
        Vocabook ・ 共有された単語帳
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 20 ? 64 : 88,
            fontWeight: 700,
            color: "#27272a",
            lineHeight: 1.25,
            wordBreak: "break-all",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#71717a", fontWeight: 700 }}>
          {subtitle}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans JP", data: fontData, style: "normal", weight: 700 }]
        : undefined,
    },
  );
}
