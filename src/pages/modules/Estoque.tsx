import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { fmtBRL, fmtDate, fmtNum, useFarm } from "@/context/FarmContext";
import { StockCategory, StockItem, STOCK_CATEGORY_LABEL } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/agro/SectionCard";
import { StatCard } from "@/components/agro/StatCard";
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
import { cn } from "@/lib/utils";

const emptyItem: Omit<StockItem, "id"> = {
  name: "",
  category: "sementes",
  unit: "un",
  quantity: 0,
  minQuantity: 0,
  unitCost: 0,
  expiryDate: "",
  propertyId: "",
  notes: "",
};

export default function EstoquePage() {
  const { stockItems, properties, addStockItem, updateStockItem, removeStockItem } = useFarm();
  const [category, setCategory] = useState<"all" | StockCategory>("all");
  const [property, setProperty] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  const filtered = useMemo(
    () => stockItems.filter((item) =>
      (category === "all" || item.category === category) &&
      (property === "all" || item.propertyId === property),
    ),
    [stockItems, category, property],
  );

  const totalValue = filtered.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const lowStock = filtered.filter((item) => item.quantity <= item.minQuantity);
  const expiringSoon = filtered.filter((item) => {
    if (!item.expiryDate) return false;
    const diff = (new Date(item.expiryDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 45;
  });

  const startNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Valor estimado" value={fmtBRL(totalValue)} icon={Boxes} tone="primary" />
        <StatCard label="Itens abaixo do mínimo" value={String(lowStock.length)} icon={AlertTriangle} tone="danger" />
        <StatCard label="Validades próximas" value={String(expiringSoon.length)} icon={AlertTriangle} tone="warning" />
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {lowStock.length} item(ns) precisam de reposição
          </div>
          <p className="mt-1 text-danger/90">
            {lowStock.map((item) => item.name).join(", ")}
          </p>
        </div>
      )}

      <SectionCard
        title="Controle de estoque"
        subtitle={`${filtered.length} itens listados`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={category} onValueChange={(value) => setCategory(value as "all" | StockCategory)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(STOCK_CATEGORY_LABEL).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={property} onValueChange={setProperty}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas propriedades</SelectItem>
                {properties.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={startNew}>
              <PackagePlus className="mr-1.5 h-4 w-4" /> Novo item
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:hidden">
          {filtered.map((item) => {
            const propertyName = properties.find((p) => p.id === item.propertyId)?.name ?? "-";
            const isLow = item.quantity <= item.minQuantity;
            return (
              <div key={item.id} className={cn("rounded-xl border bg-card p-4", isLow ? "border-danger/40" : "border-border")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{propertyName}</p>
                  </div>
                  {isLow && <Badge className="bg-danger/15 text-danger">baixo</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Categoria</span><span>{STOCK_CATEGORY_LABEL[item.category]}</span>
                  <span className="text-muted-foreground">Quantidade</span><span>{fmtNum(item.quantity)} {item.unit}</span>
                  <span className="text-muted-foreground">Mínimo</span><span>{fmtNum(item.minQuantity)} {item.unit}</span>
                  <span className="text-muted-foreground">Valor</span><span>{fmtBRL(item.quantity * item.unitCost)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Item</th>
                <th className="px-4 py-2.5 text-left">Categoria</th>
                <th className="px-4 py-2.5 text-right">Qtd.</th>
                <th className="px-4 py-2.5 text-right">Mínimo</th>
                <th className="px-4 py-2.5 text-right">Custo unit.</th>
                <th className="px-4 py-2.5 text-left">Validade</th>
                <th className="px-4 py-2.5 text-left">Propriedade</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const propertyName = properties.find((p) => p.id === item.propertyId)?.name ?? "-";
                const isLow = item.quantity <= item.minQuantity;
                return (
                  <tr key={item.id} className={cn("border-t border-border", isLow && "bg-danger/5")}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{STOCK_CATEGORY_LABEL[item.category]}</Badge></td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtNum(item.quantity)} {item.unit}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmtNum(item.minQuantity)} {item.unit}</td>
                    <td className="px-4 py-3 text-right">{fmtBRL(item.unitCost)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.expiryDate ? fmtDate(item.expiryDate) : "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{propertyName}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(item); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button aria-label="Remover item" size="icon" variant="ghost" onClick={() => { if (window.confirm("Remover este item do estoque?")) { removeStockItem(item.id); toast("Item removido"); } }}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar item" : "Novo item de estoque"}</DialogTitle></DialogHeader>
          <StockForm
            initial={editing ?? emptyItem}
            properties={properties}
            onSave={(data) => {
              if (editing) updateStockItem({ ...editing, ...data });
              else addStockItem(data);
              toast.success(editing ? "Item atualizado" : "Item criado");
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockForm({
  initial,
  properties,
  onSave,
}: {
  initial: Omit<StockItem, "id">;
  properties: ReturnType<typeof useFarm>["properties"];
  onSave: (item: Omit<StockItem, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<StockItem, "id">>(initial);

  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div>
        <Label>Nome</Label>
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as StockCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STOCK_CATEGORY_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Unidade</Label>
          <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
        </div>
        <div>
          <Label>Quantidade</Label>
          <Input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} />
        </div>
        <div>
          <Label>Quantidade mínima</Label>
          <Input type="number" value={form.minQuantity} onChange={(event) => setForm({ ...form, minQuantity: Number(event.target.value) })} />
        </div>
        <div>
          <Label>Custo unitário</Label>
          <Input type="number" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: Number(event.target.value) })} />
        </div>
        <div>
          <Label>Validade</Label>
          <Input type="date" value={form.expiryDate ?? ""} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
        </div>
        <div className="sm:col-span-2">
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
      <div>
        <Label>Observações</Label>
        <Textarea value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </div>
      <DialogFooter><Button type="submit" className="w-full">Salvar item</Button></DialogFooter>
    </form>
  );
}
