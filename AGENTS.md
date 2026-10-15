# This is React Router 8 (framework mode)

This project uses React Router 8, which is newer than most training data. Read the relevant guide in `node_modules/react-router/docs/` before writing any code, and heed deprecation notices.

- Routes come from the file layout via `@react-router/fs-routes` (`flatRoutes()` in `app/routes.ts`; see `node_modules/react-router/docs/how-to/file-route-conventions.md`). One route = one folder `app/routes/<dot.separated.name>/route.tsx`; other files in that folder (components, data, `content.mdx`) are co-located and are not routes. Route types come from `./+types/route` (run `npx react-router typegen`).
- Data goes through `loader` / `action` in route modules. Updates are sent with `useFetcher` / `IntentForm` to a route's `action`, which dispatches on `intent`. Loaders are revalidated automatically after an action.
- Server-only code lives in `*.server.ts`. Auth helpers (`requireUser`, `getCurrentUser`) read the request from `AsyncLocalStorage`, set up by the middleware in `app/root.tsx`.

# Layout

Everything lives under `app/`; the `@/` alias points at `app/`.

- `app/routes/` — route modules only (plus their co-located files).
- `app/components/` — shared components, PascalCase file names. `app/hooks/` — shared hooks (`useX.ts`).
- `app/lib/server/` — code that touches the DB, session or auth (`*.server.ts`). `app/lib/shared/` — code that never touches the DB: pure functions, types, constants. `shared` must not import from `server`.
- Keep logic that can be pure in `lib/shared` and call it from `lib/server`, so it can be unit-tested without a DB.

# Development: TDD

Work test-first. For any new behaviour or bug fix:

1. Write a failing test that describes it (red) and run it to see it fail for the right reason.
2. Write the minimum code to make it pass (green).
3. Refactor with the tests green.

- Pure functions (`app/lib/shared`) get unit tests with Vitest, co-located as `<name>.test.ts`. Run with `npx vitest run`.
- For a bug, reproduce it in a failing test first, then fix it.
- User-facing flows get an end-to-end test (Playwright).
- Before finishing, run `npm run lint`, `npm run typecheck` and the tests.
