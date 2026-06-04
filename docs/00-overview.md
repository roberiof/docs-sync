# DocSync — Visão Geral do Projeto

## O que é

DocSync é um editor de texto colaborativo em tempo real. Vários usuários
editam o mesmo documento simultaneamente, com cursores ao vivo, persistência
automática e um assistente de IA (Claude) embutido no editor.

Projeto de portfólio inspirado em casos de uso reais de _AI workspaces_
corporativos (ex.: Pasito — workspace de IA para benefícios corporativos).

## Objetivos

- Demonstrar domínio de colaboração em tempo real (CRDT via Yjs).
- Integrar editor rico (Tiptap) com sincronização e persistência separadas.
- Mostrar uso de IA assistiva contextual dentro de um produto real.
- Código limpo, tipado e arquitetura clara o suficiente para servir de referência.

## Stack

| Camada            | Tecnologia                          |
| ----------------- | ----------------------------------- |
| Framework         | Next.js (App Router) + TypeScript   |
| Editor            | Tiptap                              |
| Colaboração       | Yjs + y-websocket                   |
| Auth + Persistência | Supabase (Postgres + Auth)        |
| IA                | Claude API (`@anthropic-ai/sdk`)    |
| UI                | Tailwind CSS + shadcn/ui            |

## Funcionalidades (MVP)

1. **Autenticação** — email/senha + OAuth via Supabase Auth.
2. **Dashboard** — lista documentos do usuário, criar/abrir/excluir.
3. **Editor colaborativo** — Tiptap + Yjs, múltiplos usuários ao vivo.
4. **Cursores de colaboradores** — presença e seleção em tempo real.
5. **Auto-save** — debounce, persiste JSON do Tiptap no Supabase.
6. **Assistente de IA** — seleciona texto → Claude sugere → insere no editor.

## Fora do escopo (MVP)

- Versionamento/histórico de revisões.
- Comentários e sugestões (track changes).
- Exportação (PDF/Markdown).
- Permissões granulares por bloco.
- Times/organizações (apenas owner + colaboradores diretos).

## Fluxo do usuário

1. Login via Supabase Auth.
2. Dashboard lista documentos do usuário.
3. Abre `/doc/[id]` → carrega conteúdo do Supabase.
4. Conecta ao y-websocket para colaboração ao vivo.
5. Edita → auto-save no Supabase com debounce.
6. Chama IA → Claude responde → conteúdo inserido no editor.

## Documentos relacionados

- [`01-architecture.md`](./01-architecture.md) — arquitetura e responsabilidades.
- [`02-database.md`](./02-database.md) — schema do Supabase e RLS.
