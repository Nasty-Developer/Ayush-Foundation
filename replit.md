# Ayush Medico

Ayush Medico is a responsive Phase 1 foundation for a modern, trustworthy local pharmacy website.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Routing: React Router
- Icons: Lucide React
- Shared API and database packages remain scaffolded for future phases
- Build: Vite

## Where things live

- `artifacts/ayush-medico/src/components/` — reusable header, footer, page framing, and section components
- `artifacts/ayush-medico/src/pages/` — Home, Medicines, Services, About, Contact, and not-found pages
- `artifacts/ayush-medico/src/lib/site-data.ts` — navigation, contact placeholders, service, trust, and availability content
- `artifacts/ayush-medico/src/index.css` — Ayush Medico color tokens, typography, responsive utilities, and motion
- `artifacts/ayush-medico/src/App.tsx` — React Router route map and shared providers

## Architecture decisions

- Phase 1 is intentionally frontend-only; no Firebase, authentication, medicine database, cart, checkout, orders, or admin workflows are included.
- Content that is likely to change is kept in `src/lib/site-data.ts` instead of being repeated across components.
- The app uses React Router with a base-path-aware `BrowserRouter` so routes work in the artifact preview and future deployment.

## Product

The foundation introduces Ayush Medico as a premium neighborhood pharmacy: visitors can learn about its care promise, browse service and availability previews, and reach the pharmacy through responsive navigation and contact CTAs. The Medicines, Services, About, and Contact routes are ready for Phase 2 expansion.

## User preferences

- Keep Phase 1 focused on the polished pharmacy foundation; do not add Phase 2 commerce or administration features without an explicit request.

## Gotchas

- The Vite config requires `PORT` and `BASE_PATH` when running a production build directly; the managed workflow supplies them during preview.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
