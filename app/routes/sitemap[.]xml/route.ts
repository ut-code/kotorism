import { buildSitemapXml, SITEMAP_PATHS } from "@/lib/shared/sitemap";

// 検索エンジン向けの /sitemap.xml。アプリのオリジンは認証と同じ環境変数を使う
export function loader() {
  const xml = buildSitemapXml(
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    SITEMAP_PATHS,
  );
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
