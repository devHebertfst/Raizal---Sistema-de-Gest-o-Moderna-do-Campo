import { useState } from "react";
import { BarChart3, Eye, MapPinned, Pencil, Plus, Sprout, Trash2, Trees } from "lucide-react";
import { fmtBRL, fmtNum, useFarm } from "@/context/FarmContext";
import { Property } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/agro/SectionCard";
import { StatCard } from "@/components/agro/StatCard";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/agro/ConfirmAction";
import { taskColumnTitle } from "@/lib/task-board";

const empty: Omit<Property, "id"> = {
  name: "", location: "", totalHa: 0, cultivableHa: 0, pastureHa: 0, freeHa: 0, notes: "",
};

export default function PropriedadesPage() {
  const {
    properties,
    crops,
    livestock,
    stockItems,
    transactions,
    tasks,
    addProperty,
    updateProperty,
    removeProperty,
  } = useFarm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [details, setDetails] = useState<Property | null>(null);

  const totalHa = properties.reduce((sum, property) => sum + property.totalHa, 0);
  const cultHa = properties.reduce((sum, property) => sum + property.cultivableHa, 0);
  const pastHa = properties.reduce((sum, property) => sum + property.pastureHa, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de propriedades" value={String(properties.length)} icon={MapPinned} tone="primary" />
        <StatCard label="Hectares totais" value={`${fmtNum(totalHa)} ha`} icon={Sprout} tone="success" />
        <StatCard label="Cultivável / pasto" value={`${fmtNum(cultHa)} / ${fmtNum(pastHa)}`} icon={Trees} tone="accent" />
      </div>

      <SectionCard
        title="Suas propriedades"
        subtitle="Fazendas, sítios e unidades produtivas"
        actions={
          <Button className="rounded-full" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova propriedade
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => {
            const usedPct = property.totalHa > 0 ? Math.round(((property.cultivableHa + property.pastureHa) / property.totalHa) * 100) : 0;
            const relatedCrops = crops.filter((crop) => crop.propertyId === property.id);
            const relatedLivestock = livestock.filter((item) => item.propertyId === property.id);
            const relatedStock = stockItems.filter((item) => item.propertyId === property.id);
            const propertyRevenue = transactions
              .filter((item) => item.propertyId === property.id && item.type === "receita")
              .reduce((sum, item) => sum + item.value, 0);
            const propertyExpense = transactions
              .filter((item) => item.propertyId === property.id && item.type === "despesa")
              .reduce((sum, item) => sum + item.value, 0);

            return (
              <div key={property.id} className="group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-panel p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elegant">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPinned className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-display text-base font-extrabold text-foreground">{property.name}</h4>
                      <p className="truncate text-xs text-muted-foreground">{property.location}</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{usedPct}% uso</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Área total</p><p className="font-semibold">{fmtNum(property.totalHa)} ha</p></div>
                  <div><p className="text-xs text-muted-foreground">Saldo financeiro</p><p className="font-semibold">{fmtBRL(propertyRevenue - propertyExpense)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Plantações</p><p className="font-semibold">{relatedCrops.length}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rebanho</p><p className="font-semibold">{relatedLivestock.reduce((sum, item) => sum + (item.count ?? 1), 0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Estoque</p><p className="font-semibold">{fmtBRL(relatedStock.reduce((sum, item) => sum + item.quantity * item.unitCost, 0))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Tarefas</p><p className="font-semibold">{tasks.filter((task) => task.propertyId === property.id && task.status !== "concluida").length}</p></div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>Uso da área</span><span>{usedPct}%</span></div>
                  <Progress value={usedPct} className="h-2" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDetails(property)}>
                    <Eye className="mr-1.5 h-4 w-4" /> Detalhes
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setEditing(property); setOpen(true); }}>
                    <Pencil className="mr-1.5 h-4 w-4" /> Editar
                  </Button>
                  <ConfirmAction description="A propriedade e todos os registros vinculados serão removidos permanentemente." onConfirm={() => { removeProperty(property.id); toast("Propriedade removida"); }}>
                    <Button size="sm" variant="ghost" className="rounded-full text-danger hover:text-danger"><Trash2 className="mr-1.5 h-4 w-4" /> Remover</Button>
                  </ConfirmAction>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar propriedade" : "Nova propriedade"}</DialogTitle>
          </DialogHeader>
          <PropertyForm
            initial={editing ?? ({ ...empty, id: "" } as Property)}
            onSave={(data) => {
              if (editing) {
                updateProperty({ ...editing, ...data });
                toast.success("Propriedade atualizada");
              } else {
                addProperty(data);
                toast.success("Propriedade criada");
              }
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(details)} onOpenChange={(next) => !next && setDetails(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhe da propriedade</DialogTitle>
          </DialogHeader>
          {details && <PropertyDetails property={details} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PropertyDetails({ property }: { property: Property }) {
  const { crops, livestock, stockItems, transactions, tasks, taskColumns } = useFarm();
  const propertyCrops = crops.filter((crop) => crop.propertyId === property.id);
  const propertyLivestock = livestock.filter((item) => item.propertyId === property.id);
  const propertyStock = stockItems.filter((item) => item.propertyId === property.id);
  const propertyTasks = tasks.filter((task) => task.propertyId === property.id);
  const revenue = transactions.filter((item) => item.propertyId === property.id && item.type === "receita").reduce((sum, item) => sum + item.value, 0);
  const expense = transactions.filter((item) => item.propertyId === property.id && item.type === "despesa").reduce((sum, item) => sum + item.value, 0);
  const stockValue = propertyStock.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const usedPct = property.totalHa > 0 ? Math.round(((property.cultivableHa + property.pastureHa) / property.totalHa) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-gradient-panel p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-display text-xl font-extrabold text-foreground">{property.name}</h3>
            <p className="text-sm text-muted-foreground">{property.location}</p>
            {property.notes && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{property.notes}</p>}
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Unidade produtiva</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Área total" value={`${fmtNum(property.totalHa)} ha`} icon={MapPinned} tone="primary" />
        <StatCard label="Saldo financeiro" value={fmtBRL(revenue - expense)} icon={BarChart3} tone="success" />
        <StatCard label="Valor em estoque" value={fmtBRL(stockValue)} icon={Sprout} tone="accent" />
        <StatCard label="Tarefas abertas" value={String(propertyTasks.filter((task) => task.status !== "concluida").length)} icon={Trees} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-bold text-foreground">Uso de hectares</p>
          <Progress value={usedPct} className="mt-3 h-2" />
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div><p className="text-muted-foreground">Cultivável</p><p className="font-semibold">{fmtNum(property.cultivableHa)} ha</p></div>
            <div><p className="text-muted-foreground">Pasto</p><p className="font-semibold">{fmtNum(property.pastureHa)} ha</p></div>
            <div><p className="text-muted-foreground">Livre</p><p className="font-semibold">{fmtNum(property.freeHa)} ha</p></div>
          </div>
        </div>
        <DetailList title="Plantações vinculadas" items={propertyCrops.map((crop) => `${crop.culture} - ${crop.season}`)} />
        <DetailList title="Rebanho vinculado" items={propertyLivestock.map((item) => `${item.tag} - ${item.count ?? 1} cabeças`)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailList title="Estoque relacionado" items={propertyStock.map((item) => `${item.name}: ${fmtNum(item.quantity)} ${item.unit}`)} />
        <DetailList title="Tarefas relacionadas" items={propertyTasks.map((task) => `${task.title} - ${taskColumnTitle(task, taskColumns)}`)} />
      </div>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-bold text-foreground">{title}</p>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 5).map((item) => (
            <li key={item} className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Nenhum registro vinculado.</p>
      )}
    </div>
  );
}

function PropertyForm({ initial, onSave }: { initial: Property; onSave: (property: Omit<Property, "id">) => void }) {
  const [form, setForm] = useState<Property>(initial);
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      if (form.cultivableHa + form.pastureHa + form.freeHa > form.totalHa) {
        toast.error("A soma das áreas não pode ultrapassar a área total.");
        return;
      }
      onSave({ ...form });
    }}>
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <p className="mb-3 text-sm font-bold text-foreground">Informações gerais</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
          <div><Label>Localização</Label><Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <p className="mb-3 text-sm font-bold text-foreground">Áreas</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label>Total (ha)</Label><Input type="number" min="0" value={form.totalHa} onChange={(event) => setForm({ ...form, totalHa: Number(event.target.value) })} /></div>
          <div><Label>Cultivável (ha)</Label><Input type="number" min="0" value={form.cultivableHa} onChange={(event) => setForm({ ...form, cultivableHa: Number(event.target.value) })} /></div>
          <div><Label>Pasto (ha)</Label><Input type="number" min="0" value={form.pastureHa} onChange={(event) => setForm({ ...form, pastureHa: Number(event.target.value) })} /></div>
          <div><Label>Livre (ha)</Label><Input type="number" min="0" value={form.freeHa} onChange={(event) => setForm({ ...form, freeHa: Number(event.target.value) })} /></div>
        </div>
      </div>
      <div><Label>Observações</Label><Textarea rows={3} value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
      <DialogFooter><Button type="submit" className="w-full">Salvar propriedade</Button></DialogFooter>
    </form>
  );
}
