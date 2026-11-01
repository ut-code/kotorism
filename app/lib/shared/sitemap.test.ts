import { describe, expect, it } from "vite-plus/test";

import { buildRobotsTxt, buildSitemapXml } from "./sitemap";

describe("buildSitemapXml", () => {
  it("パスを origin つきの絶対URLにして loc に入れる", () => {
    const xml = buildSitemapXml("https://example.com", ["/", "/login"]);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/login</loc>");
  });

  it("XML の特殊文字をエスケープする", () => {
    expect(buildSitemapXml("https://example.com", ["/a?x=1&y=2"])).toContain(
      "<loc>https://example.com/a?x=1&amp;y=2</loc>",
    );
  });
});

describe("buildRobotsTxt", () => {
  it("Disallow と sitemap の絶対URLを書く", () => {
    const txt = buildRobotsTxt("https://example.com", ["/api/"]);
    expect(txt).toContain("Disallow: /api/");
    expect(txt).toContain("Sitemap: https://example.com/sitemap.xml");
  });
});
