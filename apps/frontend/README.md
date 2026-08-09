# InterviewOS Frontend

Next.js 16 (App Router) + React 19 + Tailwind v4 frontend for the InterviewOS
platform. Runs at `http://localhost:3000`.

## Stack

- **Framework**: Next.js 16 App Router
- **State**: Zustand (`src/store/*`)
- **Styling**: Tailwind CSS v4 (CSS-first tokens in `src/app/globals.css`), shadcn-style primitives on `@base-ui/react`
- **Realtime**: `socket.io-client` + hand-rolled WebRTC (`src/hooks/useWebRTC.ts`)
- **Editor**: Monaco (`@monaco-editor/react`) + Shiki (read-only/portable views)
- **Motion**: Framer Motion + `motion/react`
- **Observability**: Sentry, PostHog

## Run

```bash
npm install            # from repo root (workspaces)
npm run dev --workspace=apps/frontend   # port 3000
```

The frontend proxies `/api/*` to the backend (see `next.config.ts` rewrites) and
connects to the Socket.io gateway at `http://localhost:3001`.

## Scripts

| Script | Purpose |
|--------|---------|
| `test` | vitest unit/integration tests |
| `lint` | eslint |
| `typecheck` | `tsc --noEmit` |
| `lint:design` | Tailwind arbitrary-value audit |
| `analyze` | bundle analyzer build |

## Conventions

- No arbitrary Tailwind values — see `eslint-rules/` + `scripts/audit-tailwind.mjs`
- All API calls route through the patched global fetch (`src/lib/patchFetch.ts`)
  which injects the Bearer token and handles one 401 refresh