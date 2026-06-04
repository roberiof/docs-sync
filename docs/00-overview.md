# DocSync — Project Overview

## What it is

DocSync is a real-time collaborative text editor. Multiple users edit the same
document simultaneously, with live cursors, automatic persistence, and an AI
assistant (Claude) embedded in the editor.

Portfolio project inspired by real-world corporate _AI workspace_ use cases
(e.g. Pasito — an AI workspace for corporate benefits).

## Goals

- Demonstrate command of real-time collaboration (CRDT via Yjs).
- Integrate a rich editor (Tiptap) with separate sync and persistence layers.
- Show contextual, assistive AI inside a real product.
- Clean, typed code with an architecture clear enough to serve as a reference.

## Stack

| Layer               | Technology                          |
| ------------------- | ----------------------------------- |
| Framework           | Next.js (App Router) + TypeScript   |
| Editor              | Tiptap                              |
| Collaboration       | Yjs + y-websocket                   |
| Auth + Persistence  | Supabase (Postgres + Auth)          |
| AI                  | Claude API (`@anthropic-ai/sdk`)    |
| UI                  | Tailwind CSS + shadcn/ui            |

## Features (MVP)

1. **Authentication** — email/password + OAuth via Supabase Auth.
2. **Dashboard** — lists the user's documents; create/open/delete.
3. **Collaborative editor** — Tiptap + Yjs, multiple live users.
4. **Collaborator cursors** — real-time presence and selection.
5. **Autosave** — debounced; persists the Tiptap JSON to Supabase.
6. **AI assistant** — select text → Claude suggests → inserted into the editor.

## Out of scope (MVP)

- Versioning / revision history.
- Comments and suggestions (track changes).
- Export (PDF/Markdown).
- Block-level granular permissions.
- Teams/organizations (owner + direct collaborators only).

## User flow

1. Sign in via Supabase Auth.
2. Dashboard lists the user's documents.
3. Open `/doc/[id]` → load content from Supabase.
4. Connect to y-websocket for live collaboration.
5. Edit → debounced autosave to Supabase.
6. Call the AI → Claude responds → content inserted into the editor.

## Related documents

- [`01-architecture.md`](./01-architecture.md) — architecture and responsibilities.
- [`02-database.md`](./02-database.md) — Supabase schema and RLS.
