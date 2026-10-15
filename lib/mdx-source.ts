// 教材の MDX ファイル(app/learn/<言語>/<セクション>/page.mdx)の生テキストをビルド時に取り込む。
// 練習問題のデータを教材ファイル自身から抽出するために使う(実行時の fs 読み込みに依存しない)
const sources = import.meta.glob<string>("/app/learn/*/*/page.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

// 指定セクションの MDX 生テキスト。存在しなければ空文字
export function readMdxSource(languageSlug: string, sectionSlug: string): string {
  return sources[`/app/learn/${languageSlug}/${sectionSlug}/page.mdx`] ?? "";
}

// 指定言語の全セクションの MDX 生テキスト(セクション番号順)
export function listMdxSources(languageSlug: string): { name: string; content: string }[] {
  const prefix = `/app/learn/${languageSlug}/`;
  return Object.entries(sources)
    .filter(([file]) => file.startsWith(prefix))
    .map(([file, content]) => ({ name: file.slice(prefix.length).split("/")[0], content }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Markdown のバックスラッシュエスケープ（表の中で "_" を書くための "\_" など）を外した文字列にする。
// 生テキストから表のセルを読み取るときに使う（MDX として表示されるときは自動で外れるが、生テキストには残るため）
export function unescapeMarkdown(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|<>~])/g, "$1");
}
