-- Persist Yjs binary state alongside the JSON snapshot.
-- Applied on every autosave; used to seed a fresh Y.Doc on page load,
-- eliminating the concurrent-reload duplication race.
alter table public.documents
  add column ydoc_state text default null;
