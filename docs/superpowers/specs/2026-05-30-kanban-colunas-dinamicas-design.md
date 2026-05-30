# Kanban com colunas dinâmicas

## Objetivo

Permitir organizar tarefas por arrastar e soltar no Kanban e criar colunas extras sem alterar os três status operacionais existentes.

## Modelo

- Manter `status` com `pendente`, `em_andamento` e `concluida`.
- Adicionar `columnId` opcional às tarefas.
- Persistir colunas extras com `id` e `title`.
- Considerar tarefas em colunas extras como abertas.

## Interações

- Arrastar tarefas entre colunas fixas e extras.
- Ao soltar em coluna fixa, atualizar `status` e remover `columnId`.
- Ao soltar em coluna extra, definir `columnId` e manter a tarefa aberta.
- Criar, renomear e excluir colunas extras.
- Ao excluir coluna extra, mover suas tarefas para `Pendente`.

## Compatibilidade

- Preservar lista, filtros, relatórios, alertas e indicadores baseados nos três status fixos.
- Usar drag-and-drop nativo do navegador, sem nova dependência.
