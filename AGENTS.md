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
- Validate every external input (form data, JSON bodies, query params) on the server with a Zod schema before using it. Schemas live in `lib/shared` (`*-schema.ts`, parse helpers return `{ success, data | error }`), so the form's `maxLength` and the server share the same limits.
- Keep logic that can be pure in `lib/shared` and call it from `lib/server`, so it can be unit-tested without a DB.

# Development: TDD

Work test-first. For any new behaviour or bug fix:

1. Write a failing test that describes it (red) and run it to see it fail for the right reason.
2. Write the minimum code to make it pass (green).
3. Refactor with the tests green.

- For a bug, reproduce it in a failing test first, then fix it.

## Which kind of test

Pick the cheapest test that can catch the bug. E2E is slow and runs on every PR, so it is the last resort, not the default.

1. Unit test (Vitest, `<name>.test.ts`, node). Pure functions in `app/lib/shared`, server code in `app/lib/server` (in-memory DB), and properties of static data (quiz questions, section lists, verb lists). If a check only reads data, it belongs here, even if the bug was seen in the UI.
2. Component test (Vitest + Testing Library, `<Name>.test.tsx` next to the component, jsdom). Behaviour that stays inside one screen and needs no server: opening/closing, input validation, keyboard handling, what is shown for a given prop/state. Mock callbacks instead of hitting an `action`.
3. E2E (Playwright, `e2e/`). Only for:
   - user scenarios that cross the server: auth, saving and reloading data, sharing, permissions — one happy path plus the error paths that matter;
   - things jsdom cannot do: real layout (positions, sizes, overflow) and touch gestures. Add these only for a regression that actually happened, not for every screen.

Do not add an E2E test for something a unit or component test can cover. Run all Vitest tests with `npx vitest run` (or `--project unit` / `--project component`).

- Before finishing, run `npm run lint`, `npm run typecheck` and the tests.
