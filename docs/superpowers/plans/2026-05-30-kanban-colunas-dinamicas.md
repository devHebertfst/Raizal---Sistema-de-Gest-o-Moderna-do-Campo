# Kanban com colunas dinâmicas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir arrastar tarefas no Kanban e gerenciar colunas extras persistidas localmente.

**Architecture:** Separar regras de movimentação em um helper testável. Manter status fixos para compatibilidade e persistir colunas extras no contexto local existente.

**Tech Stack:** React, TypeScript, HTML Drag and Drop API, Vitest, localStorage.

---

### Task 1: Regras do quadro

**Files:**
- Create: `src/lib/task-board.ts`
- Test: `src/test/task-board.test.ts`

- [ ] Criar testes para resolver a coluna visual e a movimentação para colunas fixas ou extras.
- [ ] Executar `npm run test -- src/test/task-board.test.ts` e confirmar falha.
- [ ] Implementar helpers puros mínimos.
- [ ] Executar `npm run test -- src/test/task-board.test.ts` e confirmar sucesso.

### Task 2: Persistência

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/context/FarmContext.tsx`

- [ ] Adicionar `TaskColumn` e `columnId` opcional.
- [ ] Persistir `taskColumns` junto ao estado local.
- [ ] Adicionar criação, edição e exclusão de coluna.
- [ ] Reposicionar tarefas em `Pendente` ao excluir coluna.

### Task 3: Interações do Kanban

**Files:**
- Modify: `src/pages/modules/Tarefas.tsx`

- [ ] Renderizar colunas fixas e extras em faixa horizontal responsiva.
- [ ] Adicionar drag-and-drop nativo aos cartões e colunas.
- [ ] Adicionar criação, renomeação e exclusão de colunas extras.
- [ ] Manter formulário, lista e filtros compatíveis.

### Task 4: Verificação

- [ ] Executar `npx tsc -p tsconfig.app.json --noEmit`.
- [ ] Executar `npm run build`.
- [ ] Executar `npm run lint`.
- [ ] Executar `npm run test`.
- [ ] Executar `git diff --check`.

### Task 5: Ordenação e status dinâmicos

**Files:**
- Modify: `src/lib/task-board.ts`
- Modify: `src/context/FarmContext.tsx`
- Modify: `src/pages/modules/Tarefas.tsx`
- Modify: `src/pages/modules/Relatorios.tsx`
- Modify: `src/pages/modules/Propriedades.tsx`
- Test: `src/test/task-board.test.ts`

- [ ] Persistir todas as colunas em ordem e migrar o formato anterior.
- [ ] Permitir arrastar qualquer coluna para reordenar.
- [ ] Exibir o nome da coluna extra como status em listas, detalhes e relatórios.
- [ ] Executar a verificação completa novamente.
