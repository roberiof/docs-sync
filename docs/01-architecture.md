# DocSync — Arquitetura

## Princípio central: separar sincronização de persistência

Dois canais distintos atuam sobre o mesmo documento:

- **y-websocket** cuida da **sincronização ao vivo** (estado efêmero, presença,
  merge de edições concorrentes via CRDT). Não persiste nada.
- **Supabase** cuida da **persistência** (estado durável: o documento salvo, auth,
  metadados, colaboradores).

O editor é a ponte: lê o estado inicial do Supabase, conecta ao Yjs para
colaborar, e periodicamente grava o estado de volta no Supabase (auto-save).

```
┌──────────┐   edições live    ┌──────────────────┐
│ Browser  │ ◄──────────────►  │ y-websocket (Node)│  estado efêmero
│ (Tiptap) │   (Yjs/CRDT)      └──────────────────┘  não persiste
│          │
│          │   load inicial    ┌──────────────────┐
│          │ ◄──────────────   │ Supabase Postgres│  estado durável
│          │   auto-save →     │  + Auth          │
└────┬─────┘                   └──────────────────┘
     │  texto selecionado
     ▼
┌──────────────────┐  →  Claude API  →  sugestão volta pro editor
│ /api/ai (route)  │
└──────────────────┘
```

## Componentes

### 1. Next.js (App Router)

- **Server Components** para carregar dados (documento, lista do dashboard) com
  o cliente Supabase server-side (cookies/SSR).
- **Client Components** para o editor (Tiptap/Yjs precisam do browser).
- **Route Handler** `/api/ai` roda no server, guarda a `ANTHROPIC_API_KEY`,
  fala com a Claude API. A chave nunca chega ao browser.

### 2. y-websocket server

- Processo Node.js **separado** do Next.js (`y-websocket-server/server.js`).
- Cada documento = uma "room" Yjs identificada pelo `document.id`.
- Responsável só por relay/merge de updates e _awareness_ (cursores/presença).
- Sem banco, sem auth pesada. Em produção, validar acesso à room é desejável
  (fora do MVP; ver "Segurança").

### 3. Supabase

- **Auth**: email/senha + OAuth. Sessão via cookies (SSR helpers).
- **Postgres**: tabelas `documents`, `document_collaborators`, `profiles`.
- **RLS**: garante que cada usuário só lê/escreve o que tem direito.
- Ver [`02-database.md`](./02-database.md).

### 4. Claude API

- Acessada só pelo route handler `/api/ai`.
- Entrada: texto selecionado + tipo de ação (melhorar, resumir, continuar…).
- Saída: texto sugerido, inserido no Tiptap no ponto da seleção.

## Camadas no código

```
src/
├── app/            # rotas (server + client components)
├── components/     # UI: editor, dashboard, ui (shadcn)
├── lib/
│   ├── supabase/   # client (browser), server (SSR), types gerados
│   ├── yjs/        # provider y-websocket
│   └── ai/         # wrapper da Claude API
├── hooks/          # useEditor, useCollaboration, useDocument
└── types/          # tipos compartilhados do domínio
```

## Fluxo de dados do editor

1. Server Component (`/doc/[id]`) busca o documento no Supabase (RLS valida acesso).
2. Passa o conteúdo inicial (JSON do Tiptap) para o Client Component do editor.
3. `useCollaboration` cria o `Y.Doc` e conecta ao y-websocket (room = id do doc).
4. Tiptap usa a extensão de Collaboration ligada ao `Y.Doc`.
5. `useDocument` observa mudanças e dispara auto-save (debounce ~1–2s) no Supabase.
6. Awareness do Yjs alimenta `CollaboratorsCursors`.

### Sobre a "fonte da verdade"

- Enquanto há colaboradores conectados, o **Yjs é a fonte da verdade** do conteúdo.
- O Supabase guarda o **último snapshot conhecido** (para load quando ninguém está
  conectado e como backup durável).
- Decisão de MVP: persistir o **JSON do Tiptap** (não o binário do Yjs). Simples de
  inspecionar e renderizar. Trade-off documentado em "Decisões em aberto".

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # só server-side, se necessário
ANTHROPIC_API_KEY=                # só no route handler /api/ai
NEXT_PUBLIC_YWS_URL=              # ex.: ws://localhost:1234
```

## Segurança (notas)

- Chaves sensíveis (`ANTHROPIC_API_KEY`, service role) só no server.
- RLS no Postgres é a barreira real de acesso a dados.
- y-websocket no MVP é aberto por simplicidade; em produção, autenticar a conexão
  (token na query/handshake) e checar permissão na room.

## Decisões em aberto

- **Persistir JSON do Tiptap vs. binário do Yjs.** MVP: JSON. Se o histórico/merge
  offline virar requisito, migrar para snapshots binários do Yjs (`Y.encodeStateAsUpdate`).
- **Quem dispara o auto-save com vários clientes.** Risco de gravações concorrentes.
  MVP: cada cliente salva seu estado com debounce; aceitável pois o conteúdo converge
  via Yjs. Melhoria futura: eleger um "leader" ou salvar via webhook do y-websocket.
- **Hospedagem do y-websocket** (Railway/Fly/Render). Decidir no deploy.

## Documentos relacionados

- [`00-overview.md`](./00-overview.md) — visão geral e escopo.
- [`02-database.md`](./02-database.md) — schema e políticas RLS.
