# ことりずむ

## 技術スタック

- フレームワーク: React 19 / React Router 8（framework mode）/ Vite
- 言語: TypeScript
- スタイル: Tailwind CSS 4
- コンテンツ: MDX
- DB: SQLite（libsql）/ Prisma
- 認証: Better Auth
- AI: OpenRouter
- テスト: Vitest（単体・統合）/ Playwright（e2e）
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

テストを先に書く（TDD）。コミット前に実行する。

```bash
npm run format
npm run lint
npm run typecheck
npm test
```

## テスト

```bash
npm test          # Vitest: app/lib の単体テスト・統合テスト
npm run test:e2e  # Playwright: 主要な画面の動作（ビルドして起動する。Chrome が必要）
```

- `app/lib/shared` の純粋関数は、そのまま単体テストする。
- `app/lib/server` の DB に触るコードは、インメモリ SQLite にマイグレーションを当てて統合テストする（`app/lib/server/test/db.ts`）。ログイン中のユーザーは `requireUser` をモックして切り替える。
- e2e は実行ごとに新しい SQLite DB を作る。`.env` の DB には触らない。
- テストは `*.test.ts` を対象のファイルの隣に置く。e2e は `e2e/` に置く。

## ディレクトリ構成

すべて `app/` 以下にあり、`@/` は `app/` を指す。

- `app/routes/` — ルート。`<ルート名>/route.tsx` と、同じフォルダに置いたそのルート専用のファイル
- `app/components/` — 共通のコンポーネント（ファイル名は PascalCase）。`app/hooks/` — 共通のフック
- `app/lib/server/` — DB・セッション・認証に触るコード（`*.server.ts`）
- `app/lib/shared/` — DB に触らないコード（純粋関数・型・定数）。`server` を import しない
- `app/generated/` — Prisma が生成するクライアント（コミットしない。`npx prisma generate`）

## ルーティング

`app/routes.ts` は `@react-router/fs-routes` の `flatRoutes()`。`app/routes/` 直下の名前でパスと入れ子が決まる（例: `learn._french.french.04/route.tsx` → `/learn/french/04`）。ルールは `node_modules/react-router/docs/how-to/file-route-conventions.md` を参照。型は `./+types/route` から import する（`npm run typecheck` で生成）。

データは `loader` / `action` 経由。更新は `useFetcher` / `IntentForm` から `action` に `intent` を送る。サーバー専用コードは `*.server.ts`。
