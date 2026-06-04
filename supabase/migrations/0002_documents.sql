-- Documents: the editable content. `content` holds the Tiptap JSON document.
-- Collaboration sync lives in y-websocket; this table is the durable snapshot.

create table public.documents (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  title      text not null default 'Untitled',
  content    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dashboard lists a user's own documents, ordered by recency.
create index documents_owner_id_idx on public.documents (owner_id);
create index documents_updated_at_idx on public.documents (updated_at desc);

-- Keep updated_at fresh on every write (drives dashboard ordering + auto-save).
create function public.set_updated_at()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();

alter table public.documents enable row level security;

-- Owner-only policies. Collaborator (shared) access is layered on in 0003.
create policy "Owners can read their documents"
  on public.documents
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owners can insert their documents"
  on public.documents
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their documents"
  on public.documents
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their documents"
  on public.documents
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);
