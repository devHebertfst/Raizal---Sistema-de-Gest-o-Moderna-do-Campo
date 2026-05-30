import { describe, expect, it } from "vitest";
import {
  DEFAULT_TASK_COLUMNS,
  moveTaskToColumn,
  normalizeTaskColumns,
  reorderTaskColumns,
  taskColumnId,
  taskColumnTitle,
} from "@/lib/task-board";
import type { FarmTask } from "@/data/types";

const task: FarmTask = {
  id: "task-1",
  title: "Revisar estoque",
  description: "",
  assignee: "Carlos",
  priority: "media",
  dueDate: "2026-05-30",
  sector: "estoque",
  status: "pendente",
};

describe("task board", () => {
  it("uses the extra column when the task has one", () => {
    expect(taskColumnId({ ...task, columnId: "review" })).toBe("review");
  });

  it("uses the task status when there is no extra column", () => {
    expect(taskColumnId(task)).toBe("pendente");
  });

  it("moves a task to a fixed column and clears the extra column", () => {
    expect(moveTaskToColumn({ ...task, columnId: "review" }, "concluida")).toEqual({
      ...task,
      status: "concluida",
      columnId: undefined,
    });
  });

  it("moves an open task to an extra column without completing it", () => {
    expect(moveTaskToColumn(task, "review")).toEqual({
      ...task,
      status: "pendente",
      columnId: "review",
    });
  });

  it("reopens a completed task moved to an extra column", () => {
    expect(moveTaskToColumn({ ...task, status: "concluida" }, "review")).toEqual({
      ...task,
      status: "pendente",
      columnId: "review",
    });
  });

  it("uses the extra column as the visible state instead of keeping an internal progress state", () => {
    expect(moveTaskToColumn({ ...task, status: "em_andamento" }, "review")).toEqual({
      ...task,
      status: "pendente",
      columnId: "review",
    });
  });

  it("adds fixed columns when migrating extra columns from the previous format", () => {
    expect(normalizeTaskColumns([{ id: "review", title: "Revisão" }])).toEqual([
      ...DEFAULT_TASK_COLUMNS,
      { id: "review", title: "Revisão" },
    ]);
  });

  it("reorders fixed and extra columns", () => {
    expect(reorderTaskColumns([
      ...DEFAULT_TASK_COLUMNS,
      { id: "review", title: "Revisão" },
    ], "concluida", "pendente").map((column) => column.id)).toEqual([
      "concluida",
      "pendente",
      "em_andamento",
      "review",
    ]);
  });

  it("uses the extra column title as the visible task status", () => {
    expect(taskColumnTitle({ ...task, columnId: "review" }, [
      ...DEFAULT_TASK_COLUMNS,
      { id: "review", title: "Revisão" },
    ])).toBe("Revisão");
  });
});
