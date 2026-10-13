import { readMdxSource } from "@/lib/mdx-source";
import SpanishFillInPractice, { type FillInQuestionItem } from "./SpanishFillInPractice";

/**
 * MDX教材ファイル（app/learn/spanish/05/page.mdx）から
 * 穴埋め文法問題データを動的に抽出する関数。
 * データのベタ打ちを排除し、教材ファイルを唯一のデータソースとして使用する。
 */
function getFillInQuestionsFromMdx(): FillInQuestionItem[] {
  const items: FillInQuestionItem[] = [];

  try {
    const content = readMdxSource("spanish", "05");
    const lines = content.split("\n");

    let currentCategory = "文法問題";
    let qIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // 見出し3（###）でカテゴリ切り替え
      if (trimmed.startsWith("###")) {
        currentCategory = trimmed.replace(/^###\s*/, "").trim();
      } else if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        if (cells.length >= 3) {
          // 区切り行（| --- | --- | --- |）やヘッダー行は除外
          if (
            cells.every((c) => /^[-:\s]+$/.test(c)) ||
            cells[0] === "例文 (問題文)" ||
            cells[2] === "正解"
          ) {
            continue;
          }

          qIndex += 1;
          items.push({
            id: `q-${qIndex}`,
            categoryTitle: currentCategory,
            sentence: cells[0],
            translation: cells[1],
            answer: cells[2],
            explanation: cells[3] || undefined,
          });
        }
      }
    }
  } catch {
    // 読込エラー時は空配列を返す
  }

  return items;
}

/**
 * サーバー側でMDXから穴埋め出題データを読み込み、
 * 穴埋め演習コンポーネント（SpanishFillInPractice）へ受け渡すServer Component。
 */
export default function SpanishFillInPracticeLoader() {
  const items = getFillInQuestionsFromMdx();
  return <SpanishFillInPractice items={items} />;
}
