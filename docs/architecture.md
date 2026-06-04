# DocSync — Architecture

## Core principle: separate sync from persistence

Two distinct channels act on the same document:

- **y-websocket** handles **live sync** (ephemeral state, presence, merging of
  concurrent edits via CRDT). It persists nothing.
- **Supabase** handles **persistence** (durable state: the saved document, auth,
  metadata, collaborators).

The editor is the bridge: it reads the initial state from Supabase, connects to
Yjs to collaborate, and periodically writes the state back to Supabase (autosave).

```
┌──────────┐   live edits      ┌──────────────────┐
│ Browser  │ ◄──────────────►  │ y-websocket (Node)│  ephemeral state
│ (Tiptap) │   (Yjs/CRDT)      └──────────────────┘  not persisted
│          │
│          │   initial load    ┌──────────────────┐
│          │ ◄──────────────   │ Supabase Postgres│  durable state
│          │   autosave →      │  + Auth          │
└────┬─────┘                   └──────────────────┘
     │  selected text
     ▼
┌──────────────────┐  →  Claude API  →  suggestion back to the editor
│ /api/ai (route)  │
└──────────────────┘
```

## Components

### 1. Next.js (App Router)

- **Server Components** to load data (document, dashboard list) with the
  server-side Supabase client (cookies/SSR).
- **Client Components** for the editor (Tiptap/Yjs need the browser).
- **Route Handler** `/api/ai` runs on the server, holds the `ANTHROPIC_API_KEY`,
  and talks to the Claude API. The key never reaches the browser.

### 2. y-websocket server

- A Node.js process **separate** from Next.js (`y-websocket-server/server.js`).
- Each document = one Yjs "room" identified by `document.id`.
- Responsible only for relaying/merging updates and _awareness_ (cursors/presence).
- No database, no heavy auth. In production, validating room access is desirable
  (out of MVP scope; see "Security").

### 3. Supabase

- **Auth**: email/password + OAuth. Session via cookies (SSR helpers).
- **Postgres**: tables `documents`, `document_collaborators`, `profiles`.
- **RLS**: ensures each user only reads/writes what they are allowed to.
- See [`database.md`](./database.md).

### 4. Claude API

- Accessed only by the `/api/ai` route handler.
- Input: selected text + action type (improve, summarize, continue…).
- Output: suggested text, inserted into Tiptap at the selection point.

## Code layers

```
src/
├── app/            # routes (server + client components)
├── components/     # UI: editor, dashboard, ui (shadcn)
├── lib/
│   ├── supabase/   # client (browser), server (SSR), generated types
│   ├── yjs/        # y-websocket provider
│   └── ai/         # Claude API wrapper
├── hooks/          # useEditor, useCollaboration, useDocument
└── types/          # shared domain types
```

## Editor data flow

1. The Server Component (`/doc/[id]`) fetches the document from Supabase (RLS checks access).
2. It passes the initial content (Tiptap JSON) to the editor Client Component.
3. `useCollaboration` creates the `Y.Doc` and connects to y-websocket (room = doc id).
4. Tiptap uses the Collaboration extension bound to the `Y.Doc`.
5. `useDocument` observes changes and triggers autosave (debounce ~1–2s) to Supabase.
6. Yjs awareness feeds `CollaboratorsCursors`.

### On the "source of truth"

- While collaborators are connected, **Yjs is the source of truth** for content.
- Supabase keeps the **last known snapshot** (for loading when nobody is connected
  and as a durable backup).
- MVP decision: persist the **Tiptap JSON** (not the Yjs binary). Simple to inspect
  and render. Trade-off documented in "Open decisions".

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, if needed
ANTHROPIC_API_KEY=                # only in the /api/ai route handler
NEXT_PUBLIC_YWS_URL=              # e.g. ws://localhost:1234
```

## Security (notes)

- Sensitive keys (`ANTHROPIC_API_KEY`, service role) live on the server only.
- Postgres RLS is the real data-access barrier.
- In the MVP, y-websocket is open for simplicity; in production, authenticate the
  connection (token in query/handshake) and check room permissions.

## Open decisions

- **Persist Tiptap JSON vs. Yjs binary.** MVP: JSON. If history / strong offline
  merge becomes a requirement, migrate to Yjs binary snapshots (`Y.encodeStateAsUpdate`).
- **Who triggers autosave with multiple clients.** Risk of concurrent writes.
  MVP: each client saves its state with debounce; acceptable because content
  converges via Yjs. Future improvement: elect a "leader" or save via a
  y-websocket webhook.
- **y-websocket hosting** (Railway/Fly/Render). Decide at deploy time.

## Related documents

- [`overview.md`](./overview.md) — overview and scope.
- [`database.md`](./database.md) — schema and RLS policies.
