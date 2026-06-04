-- Fix: documents SELECT/UPDATE policies re-queried the documents table via
-- can_access_document(id) / can_edit_document(id). During `INSERT ... RETURNING`
-- (what `.insert().select()` does), that re-query cannot see the in-flight row,
-- so the SELECT policy returned false and the insert failed with 42501.
--
-- The owner check must read the row's own `owner_id` column directly. The
-- collaborator branch queries document_collaborators (whose own RLS lets a user
-- see their own rows), so there's no recursion into the documents policy.

drop policy "Members can read documents" on public.documents;
create policy "Members can read documents"
  on public.documents
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.document_collaborators c
      where c.document_id = id and c.user_id = (select auth.uid())
    )
  );

drop policy "Editors can update documents" on public.documents;
create policy "Editors can update documents"
  on public.documents
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.document_collaborators c
      where c.document_id = id and c.user_id = (select auth.uid()) and c.role = 'editor'
    )
  )
  with check (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.document_collaborators c
      where c.document_id = id and c.user_id = (select auth.uid()) and c.role = 'editor'
    )
  );

-- These functions are no longer referenced by any policy.
drop function if exists public.can_access_document(uuid);
drop function if exists public.can_edit_document(uuid);
