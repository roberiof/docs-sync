-- Collaborators: who (besides the owner) can access a document, and how.
-- The owner is stored on documents.owner_id and is NOT duplicated here.

create table public.document_collaborators (
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'editor' check (role in ('editor', 'viewer')),
  created_at  timestamptz not null default now(),
  primary key (document_id, user_id)
);

-- "Documents shared with me" lookups.
create index document_collaborators_user_id_idx
  on public.document_collaborators (user_id);

-- Ownership helper used by the collaborator-table policies. SECURITY DEFINER so
-- it bypasses RLS, preventing recursion between the documents and
-- document_collaborators policies.
create function public.is_document_owner(doc_id uuid)
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (
    select 1 from public.documents d
    where d.id = doc_id and d.owner_id = (select auth.uid())
  );
$$;

-- Broaden document access from owner-only (0002) to owner + collaborators.
-- The owner check reads owner_id directly off the row (NOT via a function that
-- re-queries documents) so `INSERT ... RETURNING` can see the in-flight row.
-- The collaborator branch queries document_collaborators, whose own RLS lets a
-- user see their own rows, so there is no recursion into this policy.
drop policy "Owners can read their documents" on public.documents;
create policy "Members can read documents"
  on public.documents
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.document_collaborators c
      where c.document_id = id and c.user_id = (select auth.uid())
    )
  );

drop policy "Owners can update their documents" on public.documents;
create policy "Editors can update documents"
  on public.documents
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.document_collaborators c
      where c.document_id = id and c.user_id = (select auth.uid()) and c.role = 'editor'
    )
  )
  with check (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.document_collaborators c
      where c.document_id = id and c.user_id = (select auth.uid()) and c.role = 'editor'
    )
  );

-- Collaborator-table policies.
alter table public.document_collaborators enable row level security;

-- A collaborator can see their own row; an owner can see all rows for the doc.
create policy "Owner and collaborator can read collaborators"
  on public.document_collaborators
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_document_owner(document_id));

-- Only the document owner manages who collaborates.
create policy "Owner can add collaborators"
  on public.document_collaborators
  for insert
  to authenticated
  with check (public.is_document_owner(document_id));

create policy "Owner can update collaborators"
  on public.document_collaborators
  for update
  to authenticated
  using (public.is_document_owner(document_id))
  with check (public.is_document_owner(document_id));

create policy "Owner can remove collaborators"
  on public.document_collaborators
  for delete
  to authenticated
  using (public.is_document_owner(document_id));
