# DocSync — Banco de Dados (Supabase)

Usuários são gerenciados pelo **Supabase Auth** (`auth.users`). As tabelas abaixo
ficam no schema `public` e referenciam `auth.users(id)`.

## Visão geral das tabelas

| Tabela                   | Para quê                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `profiles`               | Dados públicos do usuário (nome, avatar) p/ cursores e listas.  |
| `documents`              | O documento em si: título + conteúdo (JSON do Tiptap).          |
| `document_collaborators` | Quem tem acesso a quê documento e com qual papel.               |

### Por que `profiles`?

`auth.users` não deve ser consultada diretamente pelo client (dados sensíveis).
Para mostrar nome/avatar de colaboradores e dono nos cursores e na lista,
espelhamos o mínimo público em `public.profiles`, populado por trigger no signup.

## `profiles`

```
id          uuid        PK, FK → auth.users(id) ON DELETE CASCADE
email       text        NOT NULL
full_name   text
avatar_url  text
created_at  timestamptz NOT NULL DEFAULT now()
```

- 1:1 com `auth.users`.
- Criada automaticamente por trigger `on_auth_user_created`.

## `documents`

```
id          uuid        PK DEFAULT gen_random_uuid()
owner_id    uuid        NOT NULL, FK → auth.users(id) ON DELETE CASCADE
title       text        NOT NULL DEFAULT 'Sem título'
content     jsonb       NOT NULL DEFAULT '{}'   -- documento JSON do Tiptap
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()   -- atualizado por trigger
```

- `content` guarda o JSON do Tiptap (ver decisão em `01-architecture.md`).
- `updated_at` mantido por trigger `BEFORE UPDATE` (ordena dashboard por recência).
- Índice em `owner_id` (consultas do dashboard).

## `document_collaborators`

```
document_id uuid        NOT NULL, FK → documents(id) ON DELETE CASCADE
user_id     uuid        NOT NULL, FK → auth.users(id) ON DELETE CASCADE
role        text        NOT NULL DEFAULT 'editor'  -- 'editor' | 'viewer'
created_at  timestamptz NOT NULL DEFAULT now()
PRIMARY KEY (document_id, user_id)
```

- O **owner** vive em `documents.owner_id` (não duplicado aqui).
- Esta tabela lista os **convidados** e o papel deles.
- `role`: `editor` pode escrever, `viewer` só lê. Validado via RLS.
- Índice em `user_id` (listar "documentos compartilhados comigo").

## Modelo de acesso

Um usuário pode acessar um documento se:

- é o `owner_id`, **ou**
- existe linha em `document_collaborators` com aquele `user_id`.

Escrita exige owner ou colaborador com `role = 'editor'`.

> Para evitar recursão entre as policies de `documents` e
> `document_collaborators`, o teste de acesso fica numa função
> `SECURITY DEFINER` (`public.can_access_document`), chamada pelas policies.

## Políticas RLS (resumo)

RLS **habilitado** em todas as tabelas. Resumo da intenção (SQL completo nas
migrations em `supabase/migrations/`):

### `profiles`

- SELECT: qualquer usuário autenticado (precisa para exibir colaboradores).
- UPDATE: só o próprio (`id = auth.uid()`).
- INSERT: feito pelo trigger (service role); sem policy de insert pública.

### `documents`

- SELECT: `owner_id = auth.uid()` OU é colaborador (via função de acesso).
- INSERT: `owner_id = auth.uid()`.
- UPDATE: owner OU colaborador `editor`.
- DELETE: só o owner.

### `document_collaborators`

- SELECT: owner do documento OU o próprio colaborador (`user_id = auth.uid()`).
- INSERT/DELETE: só o owner do documento (gerencia convites).

## Trigger de signup (profiles)

```
-- pseudo: ao inserir em auth.users, cria linha em public.profiles
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

## Trigger de `updated_at`

```
create function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
```

## Ordem das migrations (planejada)

```
supabase/migrations/
├── 0001_profiles.sql            # tabela + trigger de signup + RLS
├── 0002_documents.sql           # tabela + trigger updated_at + índices + RLS
└── 0003_collaborators.sql       # tabela + função can_access_document + RLS
```

## Tipos no front-end

`lib/supabase/types.ts` será gerado via Supabase CLI:

```
supabase gen types typescript --linked > src/lib/supabase/types.ts
```

E tipos de domínio derivados em `src/types/index.ts`.

## Documentos relacionados

- [`00-overview.md`](./00-overview.md) — visão geral e escopo.
- [`01-architecture.md`](./01-architecture.md) — arquitetura e responsabilidades.
