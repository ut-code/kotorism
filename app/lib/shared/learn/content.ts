export type SectionSummary = {
  sectionSlug: string;
  title: string;
  // セクションの冒頭に出す説明（1〜2文）。セクションのページ自体には見出し・説明を書かず、
  // app/components/learn/SectionLayout.tsx がこの title と description から表示する
  description: string | null;
};

// 各セクションのルート(app/routes/learn._<言語>.<言語>.<番号>/route.tsx)が export している title・description を、
// ビルド時にまとめて取り込む。静的な教材は route.tsx が content.mdx の title・description を再 export する
const titles = import.meta.glob<string>("../../../routes/learn._*.*.*/route.tsx", {
  eager: true,
  import: "title",
});
const descriptions = import.meta.glob<string | undefined>(
  "../../../routes/learn._*.*.*/route.tsx",
  {
    eager: true,
    import: "description",
  },
);

const SECTION_ROUTE = /\/learn\._([a-z]+)\.\1\.(\d+)\/route\.tsx$/;

// 任意の言語について、セクションの番号とタイトルの配列を返す関数
export async function getSections(languageSlug: string): Promise<SectionSummary[]> {
  return (
    Object.entries(titles)
      .flatMap(([file, title]) => {
        const match = SECTION_ROUTE.exec(file);
        return match && match[1] === languageSlug
          ? [{ sectionSlug: match[2], title, description: descriptions[file] ?? null }]
          : [];
      })
      // 番号順に並べる
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
