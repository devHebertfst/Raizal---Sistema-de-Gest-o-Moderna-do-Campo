import { TASK_STATUS_LABEL, type FarmTask, type TaskColumn, type TaskStatus } from "@/data/types";

export const FIXED_TASK_COLUMNS: TaskStatus[] = ["pendente", "em_andamento", "concluida"];
export const DEFAULT_TASK_COLUMNS: TaskColumn[] = FIXED_TASK_COLUMNS.map((fixedStatus) => ({
  id: fixedStatus,
  title: TASK_STATUS_LABEL[fixedStatus],
  fixedStatus,
}));

export const taskColumnId = (task: FarmTask) => task.columnId ?? task.status;

export const taskColumnTitle = (task: FarmTask, columns: TaskColumn[]) =>
  columns.find((column) => column.id === taskColumnId(task))?.title ?? TASK_STATUS_LABEL[task.status];

export const normalizeTaskColumns = (columns: TaskColumn[] = []) => {
  const hasFixedColumns = FIXED_TASK_COLUMNS.every((id) => columns.some((column) => column.id === id));
  return hasFixedColumns ? columns : [...DEFAULT_TASK_COLUMNS, ...columns.filter((column) => !FIXED_TASK_COLUMNS.includes(column.id as TaskStatus))];
};

export const reorderTaskColumns = (columns: TaskColumn[], sourceId: string, targetId: string) => {
  const sourceIndex = columns.findIndex((column) => column.id === sourceId);
  const targetIndex = columns.findIndex((column) => column.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return columns;
  const reordered = [...columns];
  const [source] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, source);
  return reordered;
};

export const moveTaskToColumn = (task: FarmTask, columnId: string): FarmTask => {
  if (FIXED_TASK_COLUMNS.includes(columnId as TaskStatus)) {
    return { ...task, status: columnId as TaskStatus, columnId: undefined };
  }

  return { ...task, status: "pendente", columnId };
};
