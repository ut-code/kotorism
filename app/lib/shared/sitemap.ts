// 検索エンジン（Googleのクローラなど）に渡す sitemap.xml・robots.txt を組み立てる。
// /learn や /my-notebooks などはログイン必須でクローラが読めないため、未ログインで見られるページだけを載せる
export const SITEMAP_PATHS = ["/", "/login", "/signup"] as const;

// クローラに辿らせないパス。API とログイン必須のページ
export const ROBOTS_DISALLOW_PATHS = [
  "/api/",
  "/history",
  "/learn",
  "/my-notebooks",
  "/invite/",
] as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// origin（例: https://example.com）と パスの一覧から sitemap.xml の本文を返す
export function buildSitemapXml(origin: string, paths: readonly string[]): string {
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(new URL(path, origin).toString())}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobotsTxt(origin: string, disallowPaths: readonly string[]): string {
  const disallow = disallowPaths.map((path) => `Disallow: ${path}`).join("\n");
  return `User-agent: *
${disallow}

Sitemap: ${new URL("/sitemap.xml", origin).toString()}
`;
}
