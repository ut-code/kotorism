import { buildRobotsTxt, ROBOTS_DISALLOW_PATHS } from "@/lib/shared/sitemap";

// 検索エンジン向けの /robots.txt。sitemap.xml の場所もここで知らせる
export function loader() {
  const txt = buildRobotsTxt(
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    ROBOTS_DISALLOW_PATHS,
  );
  return new Response(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
