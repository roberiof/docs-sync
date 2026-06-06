# docs-sync

> Real-time collaborative document editor. Write together, live. AI helps when you're stuck.

Multiple people edit the same doc at once — cursors, selections, and keystrokes sync instantly. Sign in, create a document, share it, and watch edits land in real time. An AI assistant rewrites, summarizes, and continues your prose on demand.

## Features

- ✍️ **Rich text editor** — Tiptap + ProseMirror, with a formatting toolbar
- 🔄 **Real-time collaboration** — concurrent editing over Yjs CRDTs synced through Supabase Realtime; no merge conflicts, ever, and no extra server to run
- 👥 **Live presence** — see collaborators' cursors and selections as they move
- 🤖 **AI assistant** — `improve`, `summarize`, and `continue` on selected text (server-side, key never touches the browser)
- 🔐 **Auth + access control** — Supabase Auth with Postgres **Row Level Security** as the real security boundary
- 💾 **Autosave** — edits persist without a save button
- ⚡ **Instant navigation** — Next.js Cache Components, Suspense streaming, partial prefetch

## Stack

| Concern       | Choice                                                |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Cache Components)              |
| UI runtime    | React 19 (Server Components by default)               |
| Styling       | Tailwind CSS v4 (config-via-CSS, `@theme` tokens)     |
| Editor        | Tiptap 3 + ProseMirror                                |
| Realtime      | Yjs CRDTs over Supabase Realtime broadcast            |
| Data / auth   | Supabase (Postgres + RLS, `@supabase/ssr`)            |
| AI            | NVIDIA NIM (`meta/llama-3.3-70b-instruct`, OpenAI-compatible API) |
| Language      | TypeScript (strict)                                   |

## Architecture

Module-first. `app/` is routing only; feature code lives in self-contained modules.

```
src/
├── app/              # ROUTING ONLY — pages, layouts, route handlers
│   ├── (app)/        # dashboard, doc/[id] — authed area
│   ├── (auth)/       # login, register
│   └── api/ai/       # AI route handler (server-only)
├── modules/          # self-contained features
│   ├── auth/         # sign-in/up actions + UI
│   ├── documents/    # CRUD, queries, list/cards
│   ├── editor/       # Tiptap, collaboration, AI assistant, autosave
│   └── profile/      # profile editing + avatar upload
├── lib/
│   ├── supabase/     # server · client · proxy · generated types
│   ├── yjs/          # Yjs provider over Supabase Realtime broadcast
│   └── ai/           # NIM client + suggest()
├── components/ui/    # shared presentational primitives
├── types/            # domain types derived from DB rows
└── proxy.ts          # ex-middleware — session refresh + auth redirects
```

- **Read** in Server Components (`queries.ts`), **mutate** via Server Actions (`actions.ts`)
- RLS policies in `supabase/migrations/` are the security boundary — the UI is not trusted
- The AI key is server-only; the client calls `/api/ai`, never the model directly

See [`CLAUDE.md`](CLAUDE.md) and [`docs/folder-structure.md`](docs/folder-structure.md) for full conventions.


## Getting started

### Prerequisites

- Node 20+ and [pnpm](https://pnpm.io)
- A [Supabase](https://supabase.com) project (Realtime enabled — it powers collaboration)
- An [NVIDIA NIM](https://build.nvidia.com) API key (free tier)

### Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
```

`.env.local` needs:

| Var                              | What                                          |
| -------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anon key                             |
| `SUPABASE_SERVICE_ROLE_KEY`      | Server-only; bypasses RLS — never expose      |
| `NVIDIA_API_KEY`                 | NIM key; used only by the `/api/ai` route     |

### Database

```bash
pnpm db:link    # link to your Supabase project
pnpm db:push    # apply migrations
pnpm db:types   # regenerate src/lib/supabase/types.ts
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Collaboration runs through Supabase Realtime — no separate server to start.

## Scripts

| Command            | Does                                      |
| ------------------ | ----------------------------------------- |
| `pnpm dev`         | Dev server                                |
| `pnpm build`       | Production build                          |
| `pnpm start`       | Serve production build                    |
| `pnpm lint`        | ESLint                                    |
| `pnpm type-check`  | `tsc --noEmit`                            |
| `pnpm format`      | Prettier write                            |
| `pnpm db:push`     | Apply Supabase migrations                 |
| `pnpm db:types`    | Regenerate DB types                       |

## How real-time collaboration works

Each open document gets a shared Yjs document synced over a **Supabase Realtime** channel — no standalone websocket server. A custom provider ([`src/lib/yjs/supabase-provider.ts`](src/lib/yjs/supabase-provider.ts)) broadcasts incremental Y.Doc and awareness updates, and replays full state to late joiners. Edits become CRDT operations that merge deterministically — every client converges to the same state regardless of order or latency. Tiptap binds the editor to the Yjs doc; presence (cursors, selections) rides the same channel. Document snapshots persist to Supabase via autosave.

## How AI works

Select text, pick an action (`improve`, `summarize`, `continue`). The client POSTs to `/api/ai`, which verifies the Supabase session, validates input, then calls NVIDIA NIM server-side. The model id and `baseURL` live in [`src/lib/ai/ai.ts`](src/lib/ai/ai.ts) — swap in any OpenAI-compatible provider by editing that one file.

