# opti-front

The container of the OptiView interface. Presents four independent portals as a single
application (React 19 + Vite + Module Federation) and owns everything that must not be
repeated in each one: the HTTP client, the session, the navigation and the shared components.

Part of the OptiView distributed system (team `opti`). Governance and documentation live in
[`opti-docs`](https://github.com/code-corhuila/opti-docs).

## The rule every portal follows

**The HTTP client and the session live here, and only here.** A portal receives them as a prop
(`shell.api`, `shell.ui`) and never creates its own — a portal with its own client duplicates the
hardest part of the interface and ends with as many token handlers as screens.

| Concern | Where |
|---|---|
| HTTP client to the gateway, token, correlation id, 10 s timeout | `src/core/http/apiClient.ts` |
| Session (sign in, sign out, expiry) | `src/core/auth/session.ts` |
| Route guard and role guard | `src/core/auth/RequireAuth.tsx` |
| Isolation of each portal | `src/core/errors/RemoteBoundary.tsx` |
| Which portals exist and where they mount | `src/remotes/registry.ts` + `vite.config.ts` |
| Navigation, layout, theme | `src/layout/` |
| Shared components and hooks (`DataState`, `Field`, `useSubmit`…) | `src/shared/ui/` |
| The contract every portal copies (`src/shell-contract.ts`) | `src/shared/contract.ts` |

## A portal that is down does not take down the app

Loading strategy `loaded-first`: a portal is only downloaded when its route opens. Each one
renders inside its own `RemoteBoundary`; if it throws or fails to load, only its area shows an
error with a retry — the menu and the other portals keep working.

## Run

The whole platform is started from `opti-infra`. To work on the container alone (with the
portals already running, from `opti-infra` or from each portal's own `npm run dev`):

```bash
npm ci
npm run dev          # http://localhost:3000
npm test
npm run build
```

`GATEWAY_URL` (see `.env.example`) is written to `/config.js` by the image's entrypoint, so the
same build runs in develop, qa and main — only the environment variable changes.

## Depends on

The four portals (`opti-auth-portal`, `opti-customers-portal`, `opti-products-portal`,
`opti-sales-portal`) as remotes, and `opti-api-gateway` as the only door to the domains.
