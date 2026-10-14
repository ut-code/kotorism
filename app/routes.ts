import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { index, layout, prefix, route, type RouteConfigEntry } from "@react-router/dev/routes";

// Next.js 風のファイル規約(page / layout / route / opengraph-image、[param]、[...splat])から
// ルート設定を組み立てる。ページの配置を変えずに React Router へ移行するためのもの。
const appDir = import.meta.dirname;

// ルートに数えないディレクトリ・ファイル
const IGNORED = new Set(["generated", "root.tsx", "routes.ts", "globals.css"]);

function toSegment(dirName: string): string {
  if (dirName.startsWith("[...") && dirName.endsWith("]")) return "*";
  if (dirName.startsWith("[") && dirName.endsWith("]")) return `:${dirName.slice(1, -1)}`;
  return dirName;
}

function findFile(dir: string, base: string): string | undefined {
  return ["tsx", "ts", "mdx"]
    .map((ext) => `${base}.${ext}`)
    .find((f) => existsSync(path.join(dir, f)));
}

function build(dir: string, segment: string): RouteConfigEntry[] {
  const rel = (file: string) => `./${path.relative(appDir, path.join(dir, file))}`;
  const children: RouteConfigEntry[] = [];

  const pageFile = findFile(dir, "page");
  if (pageFile) children.push(index(rel(pageFile)));

  // 画像・ファイルを返すリソースルート(route.ts / opengraph-image.tsx)
  const resourceFile = findFile(dir, "route");
  if (resourceFile) children.push(index(rel(resourceFile)));
  const ogFile = findFile(dir, "opengraph-image");
  if (ogFile) children.push(route("opengraph-image", rel(ogFile)));

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || IGNORED.has(entry.name)) continue;
    children.push(...build(path.join(dir, entry.name), toSegment(entry.name)));
  }

  const layoutFile = findFile(dir, "layout");
  if (layoutFile) {
    if (!segment) return [layout(rel(layoutFile), children)];
    // page が無いディレクトリの layout は pathless にする。パス付きにすると layout 単体が
    // そのURLにマッチしてしまい、同じURLを担当する動的ルート(learn/[language])に届かなくなる
    if (!pageFile) return [layout(rel(layoutFile), prefix(segment, children))];
    return [route(segment, rel(layoutFile), children)];
  }
  return segment ? prefix(segment, children) : children;
}

export default build(appDir, "") satisfies RouteConfigEntry[];
