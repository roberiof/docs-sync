-- Realtime authorization for collaborative editing channels.
--
-- The editor transports Yjs document + awareness updates over a private
-- Supabase Realtime channel named `yjs:<documentId>` (see
-- src/lib/yjs/supabase-provider.ts). Private channels enforce RLS on the
-- `realtime.messages` table: a SELECT policy gates who may *receive* broadcasts,
-- an INSERT policy gates who may *send* them.
--
-- We mirror the document access model already used on `public.documents`:
--   - owner OR any collaborator may receive (read) — matches "Members can read"
--   - owner OR an 'editor' collaborator may send (write) — matches "Editors can
--     update"; viewers are read-only and so cannot inject edits or presence.

-- Extracts the document id from a `yjs:<uuid>` channel topic, or NULL for any
-- other topic (so the policies below never match non-editor channels and never
-- error on a non-uuid cast).
create function public.realtime_doc_id(topic text)
  returns uuid
  language sql
  immutable
as $$
  select case
    when topic ~ '^yjs:[0-9a-fA-F-]{36}$' then substring(topic from 5)::uuid
  end;
$$;

-- Receive: owner or any collaborator of the document behind the topic.
create policy "Members receive yjs broadcasts"
  on realtime.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents d
      where d.id = public.realtime_doc_id(realtime.topic())
        and (
          d.owner_id = (select auth.uid())
          or exists (
            select 1
            from public.document_collaborators c
            where c.document_id = d.id and c.user_id = (select auth.uid())
          )
        )
    )
  );

-- Send: owner or an 'editor' collaborator only. Viewers cannot broadcast.
create policy "Editors send yjs broadcasts"
  on realtime.messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = public.realtime_doc_id(realtime.topic())
        and (
          d.owner_id = (select auth.uid())
          or exists (
            select 1
            from public.document_collaborators c
            where c.document_id = d.id
              and c.user_id = (select auth.uid())
              and c.role = 'editor'
          )
        )
    )
  );
