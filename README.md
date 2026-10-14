# ことりずむ

## 技術スタック

- フレームワーク: React 19 / React Router 8（framework mode）/ Vite
- 言語: TypeScript
- スタイル: Tailwind CSS 4
- コンテンツ: MDX
- DB: SQLite（libsql）/ Prisma
- 認証: Better Auth
- AI: OpenRouter
- ツール: oxlint / oxfmt

## 前提条件

- Node.js 24
- npm

## 環境構築

```bash
npm ci
cp .env.example .env # OPENROUTER_API_KEY は AI 機能に必須
npx prisma migrate dev # prisma/dev.db を作成・更新。スキーマ変更を取り込んだ後も実行する
npm run dev # http://localhost:3000
```

## 開発のフロー

コミット前に実行する。

```bash
npm run format
npm run lint
npm run typecheck
```

## ルーティング

`app/routes.ts` がファイル配置からルートを生成する（Next.js 風）。`page` / `layout` / `route` / `opengraph-image`、`[param]` / `[...splat]` が使える。型は `./+types/<file>` から import する（`npm run typecheck` で生成）。

データは `loader` / `action` 経由。更新は `useFetcher` / `IntentForm` から `action` に `intent` を送る。サーバー専用コードは `*.server.ts`。
