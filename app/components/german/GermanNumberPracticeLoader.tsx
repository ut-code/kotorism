import { listMdxSources } from "@/lib/shared/mdx-source";
import GermanNumberPractice, { type GermanNumberItem } from "./GermanNumberPractice";

/**
 * ドイツ語学習教材のMDXファイル群（app/routes/learn._german.german.<番号>/content.mdx）から
 * 数字と表記のペアを動的に抽出する関数。
 *
 * 【設計のポイント】
 * ハードコーディング（ベタ打ち）を回避し、MDX教材ファイル自身を単一のデータソース（Single Source of Truth）
 * として扱うことで、データの二重管理を防止している。
 */
function getGermanNumbersFromMdx(): GermanNumberItem[] {
  const items: GermanNumberItem[] = [];

  try {
    // 全セクションの MDX を取り込む(ビルド時に埋め込み済み)
    const entries = listMdxSources("german");

    for (const entry of entries) {
      if (entry.content) {
        try {
          const content = entry.content;
          const lines = content.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            // マークダウンテーブルの行（"|" で始まり "|" で終わる行）を検出
            if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
              // 先頭と末尾の空要素を除去し、各セルの文字列を取り出す
              const cells = trimmed
                .split("|")
                .slice(1, -1)
                .map((c) => c.trim());

              if (cells.length >= 2) {
                const num = cells[0];
                const german = cells[1];

                // 1列目が数字のみで構成され、かつヘッダー行や区切り行でないデータを抽出
                if (
                  num &&
                  german &&
                  /^\d+$/.test(num) &&
                  german !== "-" &&
                  german !== "綴り" &&
                  german !== "数"
                ) {
                  items.push({ num, german });
                }
              }
            }
          }
        } catch {
          // 指定フォルダ内に content.mdx が存在しない、または読込不能な場合はスキップ
        }
      }
    }
  } catch {
    // ディレクトリ読込エラー時は空配列を返す
  }

  return items;
}

/**
 * サーバー側でMDXデータを読み込み、クライアントUIコンポーネント（GermanNumberPractice）
 * へデータを受け渡すためのReact Server Component。
 */
export default function GermanNumberPracticeLoader() {
  // サーバー側で既存ファイルから出題データ一覧を取得
  const items = getGermanNumbersFromMdx();

  // クライアントコンポーネントへ引き渡し
  return <GermanNumberPractice items={items} />;
}
