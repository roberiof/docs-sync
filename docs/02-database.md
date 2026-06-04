# DocSync — Database (Supabase)

Users are managed by **Supabase Auth** (`auth.users`). The tables below live in
the `public` schema and reference `auth.users(id)`.

## Tables overview

| Table                    | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `profiles`               | Public user data (name, avatar) for cursors and lists.        |
| `documents`              | The document itself: title + content (Tiptap JSON).           |
| `document_collaborators` | Who has access to which document, and with what role.         |

### Why `profiles`?

`auth.users` should not be queried directly by the client (sensitive data). To
show collaborator and owner names/avatars in cursors and lists, we mirror the
minimal public fields into `public.profiles`, populated by a trigger on signup.

## `profiles`

```
id          uuid        PK, FK → auth.users(id) ON DELETE CASCADE
email       text        NOT NULL
full_name   text
avatar_url  text
created_at  timestamptz NOT NULL DEFAULT now()
```

- 1:1 with `auth.users`.
- Created automatically by the `on_auth_user_created` trigger.

## `documents`

```
id          uuid        PK DEFAULT gen_random_uuid()
owner_id    uuid        NOT NULL, FK → auth.users(id) ON DELETE CASCADE
title       text        NOT NULL DEFAULT 'Untitled'
content     jsonb       NOT NULL DEFAULT '{}'   -- Tiptap JSON document
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()   -- maintained by trigger
```

- `content` holds the Tiptap JSON (see decision in `01-architecture.md`).
- `updated_at` maintained by a `BEFORE UPDATE` trigger (orders the dashboard by recency).
- Index on `owner_id` (dashboard queries).

## `document_collaborators`

```
document_id uuid        NOT NULL, FK → documents(id) ON DELETE CASCADE
user_id     uuid        NOT NULL, FK → auth.users(id) ON DELETE CASCADE
role        text        NOT NULL DEFAULT 'editor'  -- 'editor' | 'viewer'
created_at  timestamptz NOT NULL DEFAULT now()
PRIMARY KEY (document_id, user_id)
```

- The **owner** lives in `documents.owner_id` (not duplicated here).
- This table lists the **invited** users and their role.
- `role`: `editor` can write, `viewer` is read-only. Enforced via RLS.
- Index on `user_id` (listing "documents shared with me").

## Access model

A user can access a document if:

- they are the `owner_id`, **or**
- a row exists in `document_collaborators` with that `user_id`.

Writing requires the owner or a collaborator with `role = 'editor'`.

> To avoid recursion between the `documents` and `document_collaborators`
> policies, the access check lives in a `SECURITY DEFINER` function
> (`public.can_access_document`), called by the policies.

## RLS policies (summary)

RLS is **enabled** on all tables. Intent summary below (full SQL in the
migrations under `supabase/migrations/`):

### `profiles`

- SELECT: any authenticated user (needed to display collaborators).
- UPDATE: only the owner (`id = auth.uid()`).
- INSERT: done by the trigger (service role); no public insert policy.

### `documents`

- SELECT: `owner_id = auth.uid()` OR is a collaborator (via the access function).
- INSERT: `owner_id = auth.uid()`.
- UPDATE: owner OR `editor` collaborator.
- DELETE: owner only.

### `document_collaborators`

- SELECT: the document owner OR the collaborator themselves (`user_id = auth.uid()`).
- INSERT/DELETE: the document owner only (manages invites).

## Signup trigger (profiles)

```
-- pseudo: on insert into auth.users, create a row in public.profiles
create function public.handle_new_user() returns trigger
  security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$ language plpgsql;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## `updated_at` trigger

```
create function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
```

## Migration order (planned)

```
supabase/migrations/
├── 0001_profiles.sql            # table + signup trigger + RLS
├── 0002_documents.sql           # table + updated_at trigger + indexes + RLS
└── 0003_collaborators.sql       # table + can_access_document function + RLS
```

## Front-end types

`lib/supabase/types.ts` will be generated via the Supabase CLI:

```
supabase gen types typescript --linked > src/lib/supabase/types.ts
```

with derived domain types in `src/types/index.ts`.

## Related documents

- [`00-overview.md`](./00-overview.md) — overview and scope.
- [`01-architecture.md`](./01-architecture.md) — architecture and responsibilities.
