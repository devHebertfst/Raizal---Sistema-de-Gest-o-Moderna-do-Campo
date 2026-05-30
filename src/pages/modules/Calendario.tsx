import { useMemo, useState } from "react";
import {
  Bell,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, parseISODateLocal } from "@/lib/utils";
import { useFarm } from "@/context/FarmContext";
import {
  EVENT_CATEGORY_LABEL,
  EVENT_PRIORITY_LABEL,
  EventCategory,
  EventPriority,
  FarmEvent,
} from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/agro/SectionCard";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { toast } from "sonner";

const categoryTone: Record<EventCategory, string> = {
  plantio: "bg-success/15 text-success border-success/30",
  colheita: "bg-accent/15 text-accent border-accent/30",
  adubacao: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  pulverizacao: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  vacinacao: "bg-primary/10 text-primary border-primary/30",
  pesagem: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  manutencao: "bg-warning/15 text-warning border-warning/30",
  pagamento: "bg-danger/10 text-danger border-danger/30",
  recebimento: "bg-success/15 text-success border-success/30",
  tarefa: "bg-muted text-muted-foreground border-border",
};

const priorityTone: Record<EventPriority, string> = {
  alta: "bg-danger/15 text-danger",
  media: "bg-warning/15 text-warning",
  baixa: "bg-muted text-muted-foreground",
};

const isoOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function CalendarioPage() {
  const { events, properties, crops, livestock, addEvent, removeEvent, toggleEventDone } = useFarm();
  const [cursor, setCursor] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [selected, setSelected] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"all" | EventCategory>("all");
  const [filterProperty, setFilterProperty] = useState("all");

  const filteredEvents = useMemo(() => events.filter((event) =>
    (filterCategory === "all" || event.category === filterCategory) &&
    (filterProperty === "all" || event.propertyId === filterProperty)
  ), [events, filterCategory, filterProperty]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = first.getDay();

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first);
      date.setDate(1 - startOffset + index);
      return date;
    });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, FarmEvent[]>();

    filteredEvents.forEach((event) => {
      const items = map.get(event.date) ?? [];
      items.push(event);
      map.set(event.date, items);
    });

    return map;
  }, [filteredEvents]);

  const selectedISO = isoOf(selected);
  const dayEvents = [...(eventsByDay.get(selectedISO) ?? [])].sort((a, b) =>
    (a.time ?? "").localeCompare(b.time ?? ""),
  );

  const upcoming = useMemo(() => {
    const todayISO = isoOf(new Date());

    return [...filteredEvents]
      .filter((event) => event.date >= todayISO && !event.done)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""))
      .slice(0, 6);
  }, [filteredEvents]);

  const monthLabel = format(cursor, "MMMM yyyy", { locale: ptBR });
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const totalAlta = filteredEvents.filter((event) => event.priority === "alta" && !event.done).length;
  const todoCount = filteredEvents.filter((event) => !event.done).length;
  const doneCount = filteredEvents.filter((event) => event.done).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <KpiTile label="Total de eventos" value={filteredEvents.length} icon={CalendarIcon} />
        <KpiTile label="Pendentes" value={todoCount} icon={Bell} tone="primary" />
        <KpiTile label="Alta prioridade" value={totalAlta} icon={Bell} tone="danger" />
        <KpiTile label="Concluídos" value={doneCount} icon={Check} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Agenda"
          subtitle={monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          className="xl:col-span-2"
          actions={
            <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
              <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as "all" | EventCategory)}>
                <SelectTrigger className="h-8 w-[140px] rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tipos</SelectItem>
                  {Object.entries(EVENT_CATEGORY_LABEL).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProperty} onValueChange={setFilterProperty}>
                <SelectTrigger className="h-8 w-[160px] rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas propriedades</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full"
                onClick={() => {
                  const date = new Date();
                  date.setDate(1);
                  setCursor(date);
                  setSelected(new Date());
                }}
              >
                Hoje
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="sm" className="h-8 flex-1 rounded-full sm:ml-2 sm:flex-none" onClick={() => setOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Novo lembrete
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:gap-1.5 sm:text-[11px]">
            {weekDays.map((day, index) => (
              <div key={`${day}-${index}`} className="px-1 py-1 text-center sm:px-2">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
            {grid.map((day, index) => {
              const iso = isoOf(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = iso === isoOf(new Date());
              const isSelected = iso === selectedISO;
              const dayEventsList = eventsByDay.get(iso) ?? [];

              return (
                <button
                  key={index}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "group relative flex h-14 min-w-0 flex-col items-center rounded-lg border bg-card p-1 text-left transition sm:h-20 sm:items-stretch sm:p-1.5 lg:h-24",
                    "hover:border-primary/40 hover:shadow-card",
                    inMonth ? "border-border" : "border-transparent bg-secondary/30 text-muted-foreground/70",
                    isSelected && "border-primary/70 ring-2 ring-primary/20",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground/80",
                    )}
                  >
                    {day.getDate()}
                  </span>

                  <div className="mt-auto flex min-h-3 items-center justify-center gap-0.5 sm:hidden">
                    {dayEventsList.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          event.priority === "alta" ? "bg-danger" : event.priority === "media" ? "bg-warning" : "bg-primary",
                        )}
                      />
                    ))}
                    {dayEventsList.length > 3 && (
                      <span className="text-[9px] font-medium text-muted-foreground">+{dayEventsList.length - 3}</span>
                    )}
                  </div>

                  <div className="mt-1 hidden space-y-0.5 overflow-hidden sm:block">
                    {dayEventsList.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "truncate rounded border px-1.5 py-0.5 text-[10px] font-medium",
                          categoryTone[event.category],
                          event.done && "line-through opacity-60",
                        )}
                      >
                        {event.time && <span className="opacity-70">{event.time} · </span>}
                        {event.title}
                      </div>
                    ))}
                    {dayEventsList.length > 2 && (
                      <div className="px-1.5 text-[10px] text-muted-foreground">
                        +{dayEventsList.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={format(selected, "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(/^\w/, (letter) => letter.toUpperCase())}
          subtitle={`${dayEvents.length} ${dayEvents.length === 1 ? "evento" : "eventos"}`}
          actions={
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
            </Button>
          }
        >
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
              <CalendarIcon className="mb-2 h-7 w-7 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">Nenhum evento neste dia</p>
              <p className="text-xs text-muted-foreground">Crie um lembrete ou atividade para esta data.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {dayEvents.map((event) => {
                const property = properties.find((item) => item.id === event.propertyId);

                return (
                  <li
                    key={event.id}
                    className={cn(
                      "rounded-xl border border-border bg-card p-3 transition hover:shadow-card",
                      event.done && "opacity-60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleEventDone(event.id)}
                        aria-label="Concluir"
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                          event.done
                            ? "border-success bg-success text-success-foreground"
                            : "border-border hover:border-primary",
                        )}
                      >
                        {event.done && <Check className="h-3 w-3" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className={cn("text-sm font-semibold text-foreground", event.done && "line-through")}>
                            {event.title}
                          </p>
                          <Badge className={cn("rounded-full border text-[10px] font-medium", categoryTone[event.category])}>
                            {EVENT_CATEGORY_LABEL[event.category]}
                          </Badge>
                          <Badge className={cn("rounded-full text-[10px] font-medium", priorityTone[event.priority])}>
                            {EVENT_PRIORITY_LABEL[event.priority]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {event.time ? `${event.time} · ` : ""}
                          {property?.name ?? "Sem propriedade"}
                        </p>
                        {event.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm("Remover este evento?")) {
                            removeEvent(event.id);
                            toast("Evento removido");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Próximos lembretes" subtitle="Os 6 eventos mais próximos">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lembrete pendente.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((event) => {
              const property = properties.find((item) => item.id === event.propertyId);
              const date = parseISODateLocal(event.date);

              return (
                <div key={event.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-[10px] font-semibold uppercase">
                      {format(date, "MMM", { locale: ptBR })}
                    </span>
                    <span className="text-base font-bold leading-none">{date.getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-snug text-foreground">{event.title}</p>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">
                      {event.time ? `${event.time} · ` : ""}
                      {property?.name ?? "-"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge className={cn("max-w-full rounded-full border text-[10px]", categoryTone[event.category])}>
                        {EVENT_CATEGORY_LABEL[event.category]}
                      </Badge>
                      <Badge className={cn("max-w-full rounded-full text-[10px]", priorityTone[event.priority])}>
                        {EVENT_PRIORITY_LABEL[event.priority]}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo lembrete / atividade</DialogTitle>
          </DialogHeader>
          <EventForm
            initialDate={selected}
            properties={properties}
            crops={crops}
            livestock={livestock}
            onSave={(data) => {
              addEvent(data);
              toast.success("Lembrete adicionado");
              setSelected(parseISODateLocal(data.date));
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiTile({
  label,
  value,
  icon: Icon,
  tone = "muted",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "muted" | "primary" | "danger" | "success";
}) {
  const toneCls = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    danger: "bg-danger/15 text-danger",
    success: "bg-success/15 text-success",
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10", toneCls)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function EventForm({
  initialDate,
  properties,
  crops,
  livestock,
  onSave,
}: {
  initialDate: Date;
  properties: ReturnType<typeof useFarm>["properties"];
  crops: ReturnType<typeof useFarm>["crops"];
  livestock: ReturnType<typeof useFarm>["livestock"];
  onSave: (event: Omit<FarmEvent, "id">) => void;
}) {
  const [date, setDate] = useState<Date>(initialDate);
  const [form, setForm] = useState({
    title: "",
    description: "",
    time: "",
    category: "tarefa" as EventCategory,
    priority: "media" as EventPriority,
    propertyId: "",
    cropId: "",
    livestockId: "",
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.title) return;

        onSave({
          title: form.title,
          description: form.description || undefined,
          date: isoOf(date),
          time: form.time || undefined,
          category: form.category,
          priority: form.priority,
          propertyId: form.propertyId || undefined,
          cropId: form.cropId || undefined,
          livestockId: form.livestockId || undefined,
        });
      }}
    >
      <div>
        <Label>Título</Label>
        <Input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Ex: Vacinação do Lote 02"
          required
        />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Detalhes do lembrete..."
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col">
          <Label>Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="mt-1 h-10 justify-start font-normal">
                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                {format(date, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(nextDate) => nextDate && setDate(nextDate)}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label>Horário (opcional)</Label>
          <Input
            type="time"
            value={form.time}
            onChange={(event) => setForm({ ...form, time: event.target.value })}
          />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as EventCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_CATEGORY_LABEL).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prioridade</Label>
          <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as EventPriority })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_PRIORITY_LABEL).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Propriedade (opcional)</Label>
          <Select
            value={form.propertyId || "none"}
            onValueChange={(value) => setForm({ ...form, propertyId: value === "none" ? "" : value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">- nenhuma -</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Plantação relacionada</Label>
          <Select
            value={form.cropId || "none"}
            onValueChange={(value) => setForm({ ...form, cropId: value === "none" ? "" : value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">- nenhuma -</SelectItem>
              {crops.map((crop) => (
                <SelectItem key={crop.id} value={crop.id}>{crop.culture} - {crop.season}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rebanho relacionado</Label>
          <Select
            value={form.livestockId || "none"}
            onValueChange={(value) => setForm({ ...form, livestockId: value === "none" ? "" : value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">- nenhum -</SelectItem>
              {livestock.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full">Salvar lembrete</Button>
      </DialogFooter>
    </form>
  );
}
