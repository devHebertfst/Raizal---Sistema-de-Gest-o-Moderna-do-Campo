import { useMemo, useState } from "react";
import { Plus, Sprout, Trash2 } from "lucide-react";
import { fmtBRL, fmtDate, fmtNum, useFarm } from "@/context/FarmContext";
import {
  Crop,
  CROP_MANAGEMENT_LABEL,
  CROP_STATUS_LABEL,
  CropManagementRecord,
  CropManagementType,
  CropStatus,
} from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/agro/SectionCard";
import { StatCard } from "@/components/agro/StatCard";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusTone: Record<CropStatus, string> = {
  planejada: "bg-muted text-muted-foreground",
  em_andamento: "bg-success/15 text-success",
  colhida: "bg-accent/15 text-accent",
};

export default function PlantacoesPage() {
  const {
    crops,
    properties,
    cropManagementRecords,
    addCrop,
    removeCrop,
    addCropManagementRecord,
    removeCropManagementRecord,
  } = useFarm();
  const [open, setOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [fCulture, setFCulture] = useState("all");
  const [fSeason, setFSeason] = useState("all");
  const [fStatus, setFStatus] = useState<"all" | CropStatus>("all");
  const [fManagementCrop, setFManagementCrop] = useState("all");

  const cultures = Array.from(new Set(crops.map((item) => item.culture)));
  const seasons = Array.from(new Set(crops.map((item) => item.season)));

  const filtered = useMemo(() => crops.filter((item) =>
    (fCulture === "all" || item.culture === fCulture) &&
    (fSeason === "all" || item.season === fSeason) &&
    (fStatus === "all" || item.status === fStatus)
  ), [crops, fCulture, fSeason, fStatus]);

  const filteredManagement = cropManagementRecords
    .filter((record) => fManagementCrop === "all" || record.cropId === fManagementCrop)
    .sort((a, b) => b.date.localeCompare(a.date));
  const managementCost = filteredManagement.reduce((sum, record) => sum + record.cost, 0);

  const byCulture = new Map<string, { hectares: number; cost: number; revenue: number }>();
  crops.forEach((item) => {
    const entry = byCulture.get(item.culture) ?? { hectares: 0, cost: 0, revenue: 0 };
    entry.hectares += item.hectares;
    entry.cost += item.estimatedCost;
    entry.revenue += item.estimatedRevenue;
    byCulture.set(item.culture, entry);
  });

  const managementBySeason = new Map<string, number>();
  cropManagementRecords.forEach((record) => {
    const crop = crops.find((item) => item.id === record.cropId);
    if (!crop) return;
    managementBySeason.set(crop.season, (managementBySeason.get(crop.season) ?? 0) + record.cost);
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from(byCulture.entries()).map(([culture, value]) => (
          <div key={culture} className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success"><Sprout className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cultura</p>
                <p className="font-display text-base font-bold text-foreground">{culture}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-muted-foreground">Hectares</p><p className="font-semibold text-foreground">{fmtNum(value.hectares)} ha</p></div>
              <div><p className="text-muted-foreground">Custo/ha</p><p className="font-semibold text-foreground">{fmtBRL(value.cost / Math.max(value.hectares, 1))}</p></div>
              <div><p className="text-muted-foreground">Receita</p><p className="font-semibold text-success">{fmtBRL(value.revenue)}</p></div>
              <div><p className="text-muted-foreground">Lucro</p><p className="font-semibold text-foreground">{fmtBRL(value.revenue - value.cost)}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registros de manejo" value={String(cropManagementRecords.length)} icon={Sprout} tone="primary" />
        <StatCard label="Custo de manejo filtrado" value={fmtBRL(managementCost)} icon={Sprout} tone="warning" />
        <StatCard label="Safras com manejo" value={String(managementBySeason.size)} icon={Sprout} tone="success" />
      </div>

      <SectionCard
        title="Plantações & safras"
        subtitle={`${filtered.length} plantações listadas`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fCulture} onValueChange={setFCulture}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas culturas</SelectItem>
                {cultures.map((culture) => <SelectItem key={culture} value={culture}>{culture}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fSeason} onValueChange={setFSeason}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas safras</SelectItem>
                {seasons.map((season) => <SelectItem key={season} value={season}>{season}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={(value) => setFStatus(value as "all" | CropStatus)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(CROP_STATUS_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Nova plantação</Button>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Cultura / Safra</th>
                <th className="px-4 py-2.5 text-left">Propriedade</th>
                <th className="px-4 py-2.5 text-left">Talhão</th>
                <th className="px-4 py-2.5 text-right">Hectares</th>
                <th className="px-4 py-2.5 text-left">Plantio</th>
                <th className="px-4 py-2.5 text-left">Colheita</th>
                <th className="px-4 py-2.5 text-right">Lucro est.</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((crop) => {
                const property = properties.find((item) => item.id === crop.propertyId);
                return (
                  <tr key={crop.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{crop.culture}</div>
                      <div className="text-xs text-muted-foreground">{crop.season}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{property?.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{crop.field}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(crop.hectares)} ha</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(crop.plantingDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(crop.harvestForecast)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtBRL(crop.estimatedRevenue - crop.estimatedCost)}</td>
                    <td className="px-4 py-3">
                      <Badge className={`rounded-full font-medium ${statusTone[crop.status]}`}>{CROP_STATUS_LABEL[crop.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button aria-label="Remover plantação" size="icon" variant="ghost" onClick={() => { if (window.confirm("Remover esta plantação e os manejos vinculados?")) { removeCrop(crop.id); toast("Plantação removida"); } }}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Nenhuma plantação encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Manejos e aplicações"
        subtitle={`${filteredManagement.length} registros no histórico`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fManagementCrop} onValueChange={setFManagementCrop}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas plantações</SelectItem>
                {crops.map((crop) => <SelectItem key={crop.id} value={crop.id}>{crop.culture} - {crop.season}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={() => setManagementOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Novo manejo
            </Button>
          </div>
        }
      >
        <div className="mb-4 space-y-3">
          {Array.from(managementBySeason.entries()).map(([season, cost]) => (
            <div key={season} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Safra {season}</p>
                  <p className="text-xs text-muted-foreground">Custo acumulado de manejo</p>
                </div>
                <p className="font-semibold text-warning">{fmtBRL(cost)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Plantação</th>
                <th className="px-4 py-2.5 text-left">Manejo</th>
                <th className="px-4 py-2.5 text-left">Data</th>
                <th className="px-4 py-2.5 text-left">Insumo</th>
                <th className="px-4 py-2.5 text-right">Quantidade</th>
                <th className="px-4 py-2.5 text-left">Responsável</th>
                <th className="px-4 py-2.5 text-right">Custo</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filteredManagement.map((record) => {
                const crop = crops.find((item) => item.id === record.cropId);
                return (
                  <tr key={record.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium text-foreground">{crop ? `${crop.culture} - ${crop.season}` : "-"}</td>
                    <td className="px-4 py-3">{CROP_MANAGEMENT_LABEL[record.type]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(record.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.input}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(record.quantity)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.responsible}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtBRL(record.cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button aria-label="Remover manejo" size="icon" variant="ghost" onClick={() => { if (window.confirm("Remover este manejo?")) { removeCropManagementRecord(record.id); toast("Manejo removido"); } }}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredManagement.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Nenhum manejo encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova plantação</DialogTitle></DialogHeader>
          <CropForm properties={properties} onSave={(crop) => { addCrop(crop); toast.success("Plantação criada"); setOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={managementOpen} onOpenChange={setManagementOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo manejo</DialogTitle></DialogHeader>
          <ManagementForm crops={crops} onSave={(record) => { addCropManagementRecord(record); toast.success("Manejo adicionado"); setManagementOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CropForm({ properties, onSave }: { properties: ReturnType<typeof useFarm>["properties"]; onSave: (crop: Omit<Crop, "id">) => void }) {
  const [form, setForm] = useState<Omit<Crop, "id">>({
    culture: "Soja", season: "2024/2025", propertyId: properties[0]?.id ?? "",
    field: "", hectares: 0, plantingDate: new Date().toISOString().slice(0, 10),
    harvestForecast: new Date().toISOString().slice(0, 10), status: "planejada",
    expectedYield: 0, estimatedCost: 0, estimatedRevenue: 0,
  });
  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Cultura</Label><Input value={form.culture} onChange={(event) => setForm({ ...form, culture: event.target.value })} /></div>
        <div><Label>Safra</Label><Input value={form.season} onChange={(event) => setForm({ ...form, season: event.target.value })} /></div>
        <div className="sm:col-span-2">
          <Label>Propriedade</Label>
          <Select value={form.propertyId} onValueChange={(value) => setForm({ ...form, propertyId: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Talhão</Label><Input value={form.field} onChange={(event) => setForm({ ...form, field: event.target.value })} /></div>
        <div><Label>Hectares</Label><Input type="number" value={form.hectares} onChange={(event) => setForm({ ...form, hectares: Number(event.target.value) })} /></div>
        <div><Label>Plantio</Label><Input type="date" value={form.plantingDate} onChange={(event) => setForm({ ...form, plantingDate: event.target.value })} /></div>
        <div><Label>Colheita</Label><Input type="date" value={form.harvestForecast} onChange={(event) => setForm({ ...form, harvestForecast: event.target.value })} /></div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as CropStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(CROP_STATUS_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Produtividade (sc/ha)</Label><Input type="number" value={form.expectedYield} onChange={(event) => setForm({ ...form, expectedYield: Number(event.target.value) })} /></div>
        <div><Label>Custo estimado</Label><Input type="number" value={form.estimatedCost} onChange={(event) => setForm({ ...form, estimatedCost: Number(event.target.value) })} /></div>
        <div><Label>Receita estimada</Label><Input type="number" value={form.estimatedRevenue} onChange={(event) => setForm({ ...form, estimatedRevenue: Number(event.target.value) })} /></div>
      </div>
      <DialogFooter><Button type="submit" className="w-full">Salvar plantação</Button></DialogFooter>
    </form>
  );
}

function ManagementForm({
  crops,
  onSave,
}: {
  crops: ReturnType<typeof useFarm>["crops"];
  onSave: (record: Omit<CropManagementRecord, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<CropManagementRecord, "id">>({
    cropId: crops[0]?.id ?? "",
    type: "adubacao",
    date: new Date().toISOString().slice(0, 10),
    input: "",
    quantity: 0,
    cost: 0,
    responsible: "",
    notes: "",
  });

  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Plantação</Label>
          <Select value={form.cropId} onValueChange={(value) => setForm({ ...form, cropId: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{crops.map((crop) => <SelectItem key={crop.id} value={crop.id}>{crop.culture} - {crop.season}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de manejo</Label>
          <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as CropManagementType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(CROP_MANAGEMENT_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Data</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
        <div><Label>Insumo utilizado</Label><Input value={form.input} onChange={(event) => setForm({ ...form, input: event.target.value })} /></div>
        <div><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></div>
        <div><Label>Custo</Label><Input type="number" value={form.cost} onChange={(event) => setForm({ ...form, cost: Number(event.target.value) })} /></div>
        <div><Label>Responsável</Label><Input value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit" className="w-full">Salvar manejo</Button></DialogFooter>
    </form>
  );
}
