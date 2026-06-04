@AGENTS.md

# Frontend Engineering Guide

You are a senior full-stack engineer, frontend-focused, working on this Next.js 16 + React 19 + Tailwind v4 codebase. This file is the source of truth for **how** we build the frontend. `AGENTS.md` still applies: **this is not the Next.js in your training data** — when in doubt, read `node_modules/next/dist/docs/` before writing code.

## The product

**docs-sync** is a collaborative document editor. Users sign in (Supabase Auth), create documents, and edit them in real time with collaborators. Pieces already scaffolded:

- **Auth + data**: Supabase Postgres with **Row Level Security**. Schema lives in `supabase/migrations/` (`profiles`, `documents`, `document_collaborators`). DB types in `src/lib/supabase/types.ts`; app-facing domain types in `src/types/`.
- **Sessions**: refreshed on every request and gated by `src/proxy.ts` → `src/lib/supabase/proxy.ts`.
- **Realtime**: collaborative editing over Yjs / `y-websocket` (`NEXT_PUBLIC_YWS_URL`).
- **AI**: a server-side route handler talks to the Claude API (`ANTHROPIC_API_KEY`); never call it from the client.

Copy `.env.example` → `.env.local` and fill it before running.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 16 (App Router, Cache Components) |
| UI runtime     | React 19 (Server Components by default)  |
| Styling        | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Data / auth    | Supabase (`@supabase/ssr`)               |
| Language       | TypeScript (strict)                      |
| Import alias    | `@/*` → `./src/*`                        |
| Format / lint  | Prettier + ESLint (`pnpm format`, `pnpm lint`) |

## This Next.js — what differs from your training data

Read this before writing any route or data code. These are real breaking changes in this version, verified against the bundled docs.

1. **Cache Components is on.** `cacheComponents: true` in `next.config.ts`. Consequence: **`fetch` is NOT cached by default** and blocks rendering until it resolves. Cache explicitly with the `use cache` directive, or wrap the fetching component in `<Suspense>` to stream it.
2. **`use cache` directive.** Mark a file, component, or function cacheable by putting `'use cache'` at its top. To use cookies/headers, read them *outside* the cached scope and pass values as arguments — never read request data inside `use cache`.
3. **`params` and `searchParams` are Promises.** Always `await params` (or resolve inline with `.then()` to pass a plain value into a cached child). See `app/store/[slug]` pattern in the instant-navigation guide.
4. **Middleware is now `proxy.ts`.** Same functionality, renamed. One `proxy.ts` per project, at `src/` level (next to `app/`). Don't use it for session management or slow data — optimistic checks only.
5. **`unstable_instant` route export.** Export `export const unstable_instant = { prefetch: 'static' }` from any route that must navigate instantly. It validates the Suspense/cache structure at dev and build time and fails loudly if a boundary is misplaced. Opt a too-dynamic layout out with `export const unstable_instant = false`.

When you touch routing, data fetching, caching, navigation, or styling, **open the matching file in `node_modules/next/dist/docs/01-app/` first** and follow it. The docs carry `{/* AI agent hint: ... */}` comments — heed them.

## Architecture

Module-first. `app/` stays thin (routing only); feature code lives under
`src/modules/<module>/`. Shared, cross-module code is promoted to the top-level
folders. **Full convention: [`docs/folder-structure.md`](docs/folder-structure.md).**

```
src/
├── app/                      # ROUTING ONLY — layout/page/loading/error, route handlers
│   ├── (auth)/               # route groups for distinct layouts (no URL segment)
│   ├── api/                  # route handlers (e.g. Claude AI — server only)
│   ├── layout.tsx            # root layout (Server Component)
│   ├── icon.svg              # app favicon
│   └── globals.css           # Tailwind entry + @theme tokens
├── modules/                  # self-contained feature modules (auth, documents, editor, …)
│   └── <module>/
│       ├── components/       # module UI (Server by default)
│       ├── actions.ts        # 'use server' — mutations (Server Actions)
│       ├── queries.ts        # data reads ('use cache' where cacheable)
│       ├── hooks/            # 'use client' hooks for this module
│       └── utils/            # module-local helpers
├── components/
│   └── ui/                   # shared presentational primitives (Button, Input, Card)
├── lib/
│   ├── supabase/             # server.ts · client.ts · proxy.ts · types.ts (generated)
│   └── utils.ts              # cn() and small pure helpers
├── types/                    # shared domain types derived from DB rows
├── hooks/                    # globally-shared client hooks
└── proxy.ts                  # ex-"middleware" — Supabase session refresh + auth redirects
```

Rules (full tree in [`docs/folder-structure.md`](docs/folder-structure.md)):

- **`app/` is for routing.** A `page.tsx` composes module components and passes data down — no business logic or large JSX.
- **Module names** are lowerCase / camelCase (e.g. `auth`, `documents`).
- **Promote on second use.** Code used by one module stays in `modules/<module>/`. Used by two+ modules → lift to the top level (`components/ui` if presentational; `lib`/`utils`/`hooks` otherwise).
- **No per-module API layer** — data access goes through `lib/supabase` plus the module's `actions.ts` / `queries.ts`.
- Create top-level folders (`api/`, `config/`, `styles/`, `utils/`, `hooks/`) only when first used — don't scaffold empty trees.

## Server vs Client Components

Default to **Server Components**. Reach for `'use client'` only when you need state, effects, event handlers, browser APIs, or a client hook.

- Push the `'use client'` boundary **as deep as possible** — wrap the interactive leaf (e.g. a search box), not the whole layout. Everything imported by a client file joins the client bundle.
- Server Components passed as `children`/props to a Client Component still render on the server. Use this to nest server UI inside client shells (e.g. a server `<Cart>` inside a client `<Modal>`).
- Render Context providers in a thin `'use client'` wrapper around `{children}`, placed as deep in the tree as possible — never wrap the whole `<html>`.
- Keep secrets server-side. Only `NEXT_PUBLIC_`-prefixed env vars reach the client. Guard server-only modules with `import 'server-only'`.

## Data fetching

- **Read** in Server Components — `await` a query function from `modules/<module>/queries.ts`. Cache stable reads with `'use cache'`; leave fresh-per-request data uncached and stream it under `<Suspense>`.
- **Mutate** with Server Actions — `'use server'` functions in `modules/<module>/actions.ts`. **Verify auth/authz inside every action** (they are reachable by direct POST), then `revalidatePath`/`revalidateTag`.
- **Client reads** (when truly needed): pass a Server-initiated promise down and resolve with React's `use()` under `<Suspense>`. Reach for SWR/React Query only for genuinely client-driven, interactive data.
- Fire independent requests in parallel (`Promise.all`); only chain when one depends on another.

## Supabase & the data layer

- **Pick the right client.** Server Components / Actions / route handlers → `createClient()` from `@/lib/supabase/server` (async, cookie-bound). Client Components → `createClient()` from `@/lib/supabase/client`. Never import the server client into a `'use client'` file.
- **RLS is the security boundary**, not the UI. Every table has policies (`supabase/migrations/`). Treat any client-reachable query as hostile and rely on RLS + per-action auth checks — never trust that the UI hid a button.
- **`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS.** Server-only, used sparingly for admin tasks. Never expose it or use it to paper over a missing policy.
- **Types flow one way:** DB → `src/lib/supabase/types.ts` (regenerate with `supabase gen types typescript --linked`) → curated domain types in `src/types/`. App code imports from `@/types`, not raw row shapes.
- **Cookies vs `use cache`:** the server client reads request cookies, so it can't live inside a cached scope. Resolve auth/user outside `use cache` and pass plain values in.

## Navigation & loading UX

- Link with `next/link` `<Link>` (prefetches in viewport). Use plain `<a>` only to opt out.
- Add `loading.tsx` to dynamic routes for partial prefetch + instant feedback. Add `generateStaticParams` to dynamic segments that can be prerendered.
- For routes that must feel instant, add `unstable_instant` and place `<Suspense>` boundaries per the instant-navigation guide. Cover the most important flows with `@next/playwright`'s `instant()` e2e helper.
- Design **meaningful** loading states (skeletons that mirror the real layout), not bare spinners.

## Styling (Tailwind v4)

- Tailwind v4 is config-via-CSS: tokens live in `@theme` inside `app/globals.css`, not a JS config file.
- Compose conditional classes with `cn()` from `@/lib/utils`. Order is auto-fixed by `prettier-plugin-tailwindcss` — don't hand-sort.
- Use design tokens (CSS vars / theme colors), support dark mode via the existing `prefers-color-scheme` setup, and prefer semantic token names over raw hex.
- Build accessible markup: real semantic elements, labels tied to inputs, visible focus states, `aria-*` only where semantics don't already convey it.

## Conventions

- **Files:** components `PascalCase.tsx`; hooks `useThing.ts`; everything else `kebab-case.ts`.
- **Components:** one component per file; props typed with an explicit `type Props`; prefer named exports (default export only where Next requires it — `page`/`layout`/`loading`/`error`).
- **Types:** no `any`; model domain types in the module's `types.ts` (shared ones in `src/types`); validate external input with zod at the boundary.
- **Imports:** always `@/...`, never deep relative `../../..`.
- After meaningful changes run `pnpm lint` and `pnpm format`, and (when behavior changed) verify in the running app.
