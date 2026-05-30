# Kanban ordenável com status dinâmicos

## Objetivo

Permitir reordenar todas as colunas do Kanban e exibir colunas extras como status próprios em listas e relatórios.

## Modelo

- Persistir todas as colunas em ordem, incluindo `Pendente`, `Em andamento` e `Concluída`.
- Manter `status` fixo internamente para compatibilidade com regras de tarefa aberta e concluída.
- Usar `columnId` como fonte da coluna visual e do nome apresentado como status.
- Marcar as colunas padrão com `fixedStatus`; elas podem ser reordenadas, mas não excluídas ou renomeadas.

## Migração

- Ao carregar dados antigos sem colunas persistidas, criar as três colunas padrão.
- Ao carregar o formato anterior com somente colunas extras, inserir as três colunas padrão antes delas.

## Interações

- Arrastar qualquer cabeçalho de coluna sobre outra coluna para reordenar.
- Continuar permitindo arrastar cartões entre colunas.
- Ao mover tarefa para uma coluna extra, exibir o título dela como status.
- Ao excluir coluna extra, mover suas tarefas para `Pendente`.

## Compatibilidade

- Manter somente `Concluída` como encerrada.
- Atualizar lista de tarefas, detalhes de propriedade e gráfico de tarefas por status.
