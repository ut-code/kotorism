export type SectionSummary = {
  sectionSlug: string;
  title: string;
  // セクションの冒頭に出す説明（1〜2文）。セクションのページ自体には見出し・説明を書かず、
  // components/learn/SectionLayout.tsx がこの title と description から表示する
  description: string | null;
};

// 各セクション(page.mdx / page.tsx)が export している title・description を、ビルド時にまとめて取り込む。
// 練習教材のようなインタラクティブなセクションは page.tsx、静的な教材は page.mdx で実装される
const titles = import.meta.glob<string>("./*/*/page.{mdx,tsx}", {
  eager: true,
  import: "title",
});
const descriptions = import.meta.glob<string | undefined>("./*/*/page.{mdx,tsx}", {
  eager: true,
  import: "description",
});

// 任意の言語について、セクションの番号とタイトルの配列を返す関数
export async function getSections(languageSlug: string): Promise<SectionSummary[]> {
  const prefix = `./${languageSlug}/`;
  return (
    Object.entries(titles)
      .filter(([file]) => file.startsWith(prefix))
      .map(([file, title]) => ({
        sectionSlug: file.slice(prefix.length).split("/")[0],
        title,
        description: descriptions[file] ?? null,
      }))
      // 数字のみのディレクトリ名(01, 02, ...)を番号順に並べる
      .filter(({ sectionSlug }) => /^\d+$/.test(sectionSlug))
      .sort((a, b) => a.sectionSlug.localeCompare(b.sectionSlug))
  );
}

// 全言語のセクション情報を保持する型定義（キー: 言語スラッグ, 値: セクション一覧の配列）
export type AllLanguageSections = Record<string, SectionSummary[]>;

/**
 * 指定された複数の言語スラッグに対応するセクション一覧をまとめて取得する関数
 * サイドバー等で全言語のセクション（項目）を一括表示するために使用される
 *
 * @param languageSlugs 取得対象の言語スラッグ配列（例: ["chinese", "french", "german", "spanish"]）
 * @returns 各言語スラッグをキーとするAllLanguageSectionsオブジェクト
 */
export async function getAllLanguageSections(
  languageSlugs: string[],
): Promise<AllLanguageSections> {
  const entries = await Promise.all(
    languageSlugs.map(async (slug) => [slug, await getSections(slug)] as const),
  );
  return Object.fromEntries(entries);
}
