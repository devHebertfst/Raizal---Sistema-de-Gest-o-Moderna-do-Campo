import { useMemo, useState } from "react";
import { CheckCircle2, Clock, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { fmtDate, useFarm } from "@/context/FarmContext";
import {
  FarmTask,
  TASK_SECTOR_LABEL,
  TASK_STATUS_LABEL,
  TaskPriority,
  TaskSector,
  TaskStatus,
} from "@/data/types";
import { SectionCard } from "@/components/agro/SectionCard";
import { StatCard } from "@/components/agro/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, parseISODateLocal } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/agro/ConfirmAction";

const statusOrder: TaskStatus[] = ["pendente", "em_andamento", "concluida"];
const priorityTone: Record<TaskPriority, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-warning/15 text-warning",
  alta: "bg-danger/15 text-danger",
};

const emptyTask: Omit<FarmTask, "id"> = {
  title: "",
  description: "",
  assignee: "",
  priority: "media",
  dueDate: new Date().toISOString().slice(0, 10),
  propertyId: "",
  sector: "lavoura",
  status: "pendente",
};

export default function TarefasPage() {
  const { tasks, properties, addTask, updateTask, removeTask } = useFarm();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [property, setProperty] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FarmTask | null>(null);

  const assignees = Array.from(new Set(tasks.map((task) => task.assignee))).filter(Boolean);
  const today = new Date();

  const filtered = useMemo(
    () => tasks.filter((task) =>
      (status === "all" || task.status === status) &&
      (priority === "all" || task.priority === priority) &&
      (property === "all" || task.propertyId === property) &&
      (assignee === "all" || task.assignee === assignee),
    ),
    [tasks, status, priority, property, assignee],
  );

  const delayed = filtered.filter((task) => task.status !== "concluida" && parseISODateLocal(task.dueDate) < today);

  const save = (data: Omit<FarmTask, "id">) => {
    if (editing) updateTask({ ...editing, ...data });
    else addTask(data);
    toast.success(editing ? "Tarefa atualizada" : "Tarefa criada");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Pendentes" value={String(tasks.filter((t) => t.status === "pendente").length)} icon={Clock} tone="warning" />
        <StatCard label="Em andamento" value={String(tasks.filter((t) => t.status === "em_andamento").length)} icon={ListChecks} tone="primary" />
        <StatCard label="Concluídas" value={String(tasks.filter((t) => t.status === "concluida").length)} icon={CheckCircle2} tone="success" />
        <StatCard label="Atrasadas" value={String(delayed.length)} icon={Clock} tone="danger" />
      </div>

      <SectionCard
        title="Gestão de tarefas"
        subtitle={`${filtered.length} atividades filtradas`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={view} onValueChange={(value) => setView(value as "kanban" | "lista")}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kanban">Kanban</SelectItem>
                <SelectItem value="lista">Lista</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value as "all" | TaskStatus)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(TASK_STATUS_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(value) => setPriority(value as "all" | TaskPriority)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={property} onValueChange={setProperty}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas propriedades</SelectItem>
                {properties.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Responsáveis</SelectItem>
                {assignees.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova tarefa
            </Button>
          </div>
        }
      >
        {view === "kanban" ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {statusOrder.map((column) => (
              <div key={column} className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-foreground">{TASK_STATUS_LABEL[column]}</h3>
                  <Badge variant="secondary">{filtered.filter((task) => task.status === column).length}</Badge>
                </div>
                <div className="space-y-3">
                  {filtered.filter((task) => task.status === column).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      propertyName={properties.find((item) => item.id === task.propertyId)?.name ?? "-"}
                      onEdit={() => { setEditing(task); setOpen(true); }}
                      onRemove={() => { removeTask(task.id); toast("Tarefa removida"); }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Tarefa</th>
                  <th className="px-4 py-2.5 text-left">Responsável</th>
                  <th className="px-4 py-2.5 text-left">Setor</th>
                  <th className="px-4 py-2.5 text-left">Prazo</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    </td>
                    <td className="px-4 py-3">{task.assignee}</td>
                    <td className="px-4 py-3">{TASK_SECTOR_LABEL[task.sector]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(task.dueDate)}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{TASK_STATUS_LABEL[task.status]}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(task); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmAction description="A tarefa será removida permanentemente." onConfirm={() => removeTask(task.id)}>
                        <Button aria-label="Remover tarefa" size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-danger" /></Button>
                      </ConfirmAction>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
          <TaskForm initial={editing ?? emptyTask} properties={properties} onSave={save} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  propertyName,
  onEdit,
  onRemove,
}: {
  task: FarmTask;
  propertyName: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{task.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
        </div>
        <Badge className={cn("shrink-0 rounded-full text-[10px]", priorityTone[task.priority])}>{task.priority}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
        <Badge variant="secondary">{TASK_SECTOR_LABEL[task.sector]}</Badge>
        <Badge variant="outline">{propertyName}</Badge>
        <Badge variant="outline">{fmtDate(task.dueDate)}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{task.assignee}</span>
        <div>
          <Button aria-label="Editar tarefa" size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <ConfirmAction description="A tarefa será removida permanentemente." onConfirm={onRemove}>
            <Button aria-label="Remover tarefa" size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-danger" /></Button>
          </ConfirmAction>
        </div>
      </div>
    </div>
  );
}

function TaskForm({
  initial,
  properties,
  onSave,
}: {
  initial: Omit<FarmTask, "id">;
  properties: ReturnType<typeof useFarm>["properties"];
  onSave: (task: Omit<FarmTask, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<FarmTask, "id">>(initial);
  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div>
        <Label>Título</Label>
        <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Responsável</Label><Input value={form.assignee} onChange={(event) => setForm({ ...form, assignee: event.target.value })} /></div>
        <div><Label>Prazo</Label><Input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div>
        <div>
          <Label>Prioridade</Label>
          <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as TaskPriority })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as TaskStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_STATUS_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Setor</Label>
          <Select value={form.sector} onValueChange={(value) => setForm({ ...form, sector: value as TaskSector })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_SECTOR_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Propriedade</Label>
          <Select value={form.propertyId || "none"} onValueChange={(value) => setForm({ ...form, propertyId: value === "none" ? "" : value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem propriedade</SelectItem>
              {properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter><Button type="submit" className="w-full">Salvar tarefa</Button></DialogFooter>
    </form>
  );
}
