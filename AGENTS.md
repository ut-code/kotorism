# This is React Router 8 (framework mode)

This project uses React Router 8, which is newer than most training data. Read the relevant guide in `node_modules/react-router/docs/` before writing any code, and heed deprecation notices.

- Routes are generated from the file layout by `app/routes.ts` (`page` / `layout` / `route` / `[param]`, Next.js-style). Route types come from `./+types/<file>` (run `npx react-router typegen`).
- Data goes through `loader` / `action` in route modules. Updates are sent with `useFetcher` / `IntentForm` to a route's `action`, which dispatches on `intent`. Loaders are revalidated automatically after an action.
- Server-only code lives in `*.server.ts`. Auth helpers (`requireUser`, `getCurrentUser`) read the request from `AsyncLocalStorage`, set up by the middleware in `app/root.tsx`.
