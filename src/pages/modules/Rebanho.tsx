import { useMemo, useState } from "react";
import { Beef, Pencil, Plus, ShieldPlus, Trash2 } from "lucide-react";
import { fmtBRL, fmtDate, fmtNum, useFarm } from "@/context/FarmContext";
import {
  AnimalSex,
  AnimalStatus,
  AnimalType,
  ANIMAL_TYPE_LABEL,
  Livestock,
  SANITARY_PROCEDURE_LABEL,
  SanitaryProcedureType,
  SanitaryRecord,
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
import { ConfirmAction } from "@/components/agro/ConfirmAction";

export default function RebanhoPage() {
  const {
    livestock,
    properties,
    sanitaryRecords,
    addLivestock,
    updateLivestock,
    removeLivestock,
    addSanitaryRecord,
    updateSanitaryRecord,
    removeSanitaryRecord,
  } = useFarm();
  const [open, setOpen] = useState(false);
  const [sanitaryOpen, setSanitaryOpen] = useState(false);
  const [editing, setEditing] = useState<Livestock | null>(null);
  const [editingSanitary, setEditingSanitary] = useState<SanitaryRecord | null>(null);
  const [fBreed, setFBreed] = useState("all");
  const [fSex, setFSex] = useState<"all" | AnimalSex>("all");
  const [fProp, setFProp] = useState("all");
  const [fStatus, setFStatus] = useState<"all" | AnimalStatus>("all");
  const [fSanitaryAnimal, setFSanitaryAnimal] = useState("all");

  const breeds = Array.from(new Set(livestock.map((item) => item.breed)));

  const filtered = useMemo(() => livestock.filter((item) =>
    (fBreed === "all" || item.breed === fBreed) &&
    (fSex === "all" || item.sex === fSex) &&
    (fProp === "all" || item.propertyId === fProp) &&
    (fStatus === "all" || item.status === fStatus)
  ), [livestock, fBreed, fSex, fProp, fStatus]);

  const filteredSanitary = sanitaryRecords
    .filter((record) => fSanitaryAnimal === "all" || record.livestockId === fSanitaryAnimal)
    .sort((a, b) => b.date.localeCompare(a.date));
  const recentSanitary = [...sanitaryRecords].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const sanitaryCost = filteredSanitary.reduce((sum, record) => sum + record.cost, 0);

  const totalAnimals = livestock.reduce((sum, item) => sum + (item.count ?? 1), 0);
  const avgWeight = livestock.length
    ? livestock.reduce((sum, item) => sum + item.weightKg, 0) / livestock.length
    : 0;
  const totalValue = livestock.reduce((sum, item) => sum + item.estimatedValue * (item.count ?? 1), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de animais" value={totalAnimals.toLocaleString("pt-BR")} icon={Beef} tone="primary" hint={`${livestock.length} lotes/registros`} />
        <StatCard label="Peso médio" value={`${fmtNum(avgWeight)} kg`} icon={Beef} tone="muted" />
        <StatCard label="Valor estimado do rebanho" value={fmtBRL(totalValue)} icon={Beef} tone="success" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registros sanitários" value={String(sanitaryRecords.length)} icon={ShieldPlus} tone="primary" />
        <StatCard label="Custo sanitário filtrado" value={fmtBRL(sanitaryCost)} icon={ShieldPlus} tone="warning" />
        <StatCard label="Últimos procedimentos" value={String(recentSanitary.length)} icon={ShieldPlus} tone="muted" />
      </div>

      <SectionCard
        title="Lotes & animais"
        subtitle={`${filtered.length} registros`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fBreed} onValueChange={setFBreed}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas raças</SelectItem>
                {breeds.map((breed) => <SelectItem key={breed} value={breed}>{breed}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fSex} onValueChange={(value) => setFSex(value as "all" | AnimalSex)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos sexos</SelectItem>
                <SelectItem value="macho">Macho</SelectItem>
                <SelectItem value="femea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fProp} onValueChange={setFProp}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas propriedades</SelectItem>
                {properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={(value) => setFStatus(value as "all" | AnimalStatus)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="abatido">Abatido</SelectItem>
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Novo lote</Button>
          </div>
        }
      >
        <div className="grid gap-3 md:hidden">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">{item.tag}</p><p className="text-xs text-muted-foreground">{ANIMAL_TYPE_LABEL[item.type]} · {item.breed}</p></div>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
              <p className="mt-3 text-sm">{item.count ?? 1} cabeças · {fmtNum(item.weightKg)} kg</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setOpen(true); }}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
                <ConfirmAction description="O lote e o histórico sanitário vinculado serão removidos." onConfirm={() => removeLivestock(item.id)}>
                  <Button size="sm" variant="ghost" className="text-danger"><Trash2 className="mr-1 h-4 w-4" /> Remover</Button>
                </ConfirmAction>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Identificação</th>
                <th className="px-4 py-2.5 text-left">Tipo / Raça</th>
                <th className="px-4 py-2.5 text-center">Sexo</th>
                <th className="px-4 py-2.5 text-right">Cabeças</th>
                <th className="px-4 py-2.5 text-right">Peso (kg)</th>
                <th className="px-4 py-2.5 text-right">Idade (m)</th>
                <th className="px-4 py-2.5 text-left">Propriedade</th>
                <th className="px-4 py-2.5 text-right">Valor unit.</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const property = properties.find((prop) => prop.id === item.propertyId);
                return (
                  <tr key={item.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{item.tag}</div>
                      <div className="text-xs text-muted-foreground">Comprado {fmtDate(item.purchaseDate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{ANIMAL_TYPE_LABEL[item.type]}</div>
                      <div className="text-xs text-muted-foreground">{item.breed}</div>
                    </td>
                    <td className="px-4 py-3 text-center">{item.sex === "macho" ? "M" : "F"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{item.count ?? 1}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(item.weightKg)}</td>
                    <td className="px-4 py-3 text-right">{item.ageMonths}</td>
                    <td className="px-4 py-3 text-muted-foreground">{property?.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-success">{fmtBRL(item.estimatedValue)}</td>
                    <td className="px-4 py-3">
                      <Badge className={`rounded-full font-medium ${item.status === "ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button aria-label="Editar lote" size="icon" variant="ghost" onClick={() => { setEditing(item); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <ConfirmAction description="O lote e o histórico sanitário vinculado serão removidos." onConfirm={() => { removeLivestock(item.id); toast("Lote removido"); }}>
                        <Button aria-label="Remover lote" size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                      </ConfirmAction>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Nenhum animal encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Histórico sanitário"
        subtitle={`${filteredSanitary.length} procedimentos listados`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fSanitaryAnimal} onValueChange={setFSanitaryAnimal}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos animais/lotes</SelectItem>
                {livestock.map((item) => <SelectItem key={item.id} value={item.id}>{item.tag}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={() => { setEditingSanitary(null); setSanitaryOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Novo procedimento
            </Button>
          </div>
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recentSanitary.map((record) => {
            const animal = livestock.find((item) => item.id === record.livestockId);
            return (
              <div key={record.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{SANITARY_PROCEDURE_LABEL[record.procedure]}</p>
                <p className="mt-1 break-words text-sm font-semibold text-foreground">{animal?.tag ?? "Rebanho"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{record.product} - {fmtDate(record.date)}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 md:hidden">
          {filteredSanitary.map((record) => (
            <div key={record.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold">{SANITARY_PROCEDURE_LABEL[record.procedure]}</p>
              <p className="text-xs text-muted-foreground">{record.product} · {fmtDate(record.date)}</p>
              <p className="mt-2 text-sm">{fmtBRL(record.cost)}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditingSanitary(record); setSanitaryOpen(true); }}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
                <ConfirmAction description="O procedimento será removido permanentemente." onConfirm={() => removeSanitaryRecord(record.id)}>
                  <Button size="sm" variant="ghost" className="text-danger"><Trash2 className="mr-1 h-4 w-4" /> Remover</Button>
                </ConfirmAction>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Animal / lote</th>
                <th className="px-4 py-2.5 text-left">Procedimento</th>
                <th className="px-4 py-2.5 text-left">Data</th>
                <th className="px-4 py-2.5 text-left">Medicamento / vacina</th>
                <th className="px-4 py-2.5 text-left">Responsável</th>
                <th className="px-4 py-2.5 text-right">Custo</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSanitary.map((record) => {
                const animal = livestock.find((item) => item.id === record.livestockId);
                return (
                  <tr key={record.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium text-foreground">{animal?.tag ?? "-"}</td>
                    <td className="px-4 py-3">{SANITARY_PROCEDURE_LABEL[record.procedure]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(record.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.product}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.responsible}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtBRL(record.cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button aria-label="Editar procedimento" size="icon" variant="ghost" onClick={() => { setEditingSanitary(record); setSanitaryOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <ConfirmAction description="O procedimento será removido permanentemente." onConfirm={() => { removeSanitaryRecord(record.id); toast("Procedimento removido"); }}>
                        <Button aria-label="Remover procedimento" size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                      </ConfirmAction>
                    </td>
                  </tr>
                );
              })}
              {filteredSanitary.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum procedimento encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar lote / animal" : "Novo lote / animal"}</DialogTitle></DialogHeader>
          <LivestockForm initial={editing} properties={properties} onSave={(item) => { if (editing) updateLivestock({ ...editing, ...item }); else addLivestock(item); toast.success(editing ? "Lote atualizado" : "Lote adicionado"); setOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={sanitaryOpen} onOpenChange={setSanitaryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingSanitary ? "Editar procedimento sanitário" : "Novo procedimento sanitário"}</DialogTitle></DialogHeader>
          <SanitaryForm initial={editingSanitary} livestock={livestock} onSave={(record) => { if (editingSanitary) updateSanitaryRecord({ ...editingSanitary, ...record }); else addSanitaryRecord(record); toast.success(editingSanitary ? "Procedimento atualizado" : "Procedimento adicionado"); setSanitaryOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LivestockForm({ initial, properties, onSave }: { initial: Livestock | null; properties: ReturnType<typeof useFarm>["properties"]; onSave: (item: Omit<Livestock, "id">) => void }) {
  const [form, setForm] = useState<Omit<Livestock, "id">>(initial ?? {
    tag: "", type: "boi", breed: "Nelore", sex: "macho", ageMonths: 24, weightKg: 400,
    propertyId: properties[0]?.id ?? "", status: "ativo",
    purchaseDate: new Date().toISOString().slice(0, 10), purchaseValue: 0, estimatedValue: 0, count: 1, notes: "",
  });
  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if ((form.count ?? 1) <= 0 || form.ageMonths < 0 || form.weightKg < 0 || form.purchaseValue < 0 || form.estimatedValue < 0) return toast.error("Revise os valores numéricos informados."); onSave(form); }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Identificação</Label><Input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} /></div>
        <div>
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as AnimalType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(ANIMAL_TYPE_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Raça</Label><Input value={form.breed} onChange={(event) => setForm({ ...form, breed: event.target.value })} /></div>
        <div>
          <Label>Sexo</Label>
          <Select value={form.sex} onValueChange={(value) => setForm({ ...form, sex: value as AnimalSex })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="macho">Macho</SelectItem><SelectItem value="femea">Fêmea</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Cabeças</Label><Input type="number" value={form.count ?? 1} onChange={(event) => setForm({ ...form, count: Number(event.target.value) })} /></div>
        <div><Label>Idade (meses)</Label><Input type="number" value={form.ageMonths} onChange={(event) => setForm({ ...form, ageMonths: Number(event.target.value) })} /></div>
        <div><Label>Peso (kg)</Label><Input type="number" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: Number(event.target.value) })} /></div>
        <div className="sm:col-span-2">
          <Label>Propriedade</Label>
          <Select value={form.propertyId} onValueChange={(value) => setForm({ ...form, propertyId: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Data compra</Label><Input type="date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} /></div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as AnimalStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="vendido">Vendido</SelectItem><SelectItem value="abatido">Abatido</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Valor compra</Label><Input type="number" value={form.purchaseValue} onChange={(event) => setForm({ ...form, purchaseValue: Number(event.target.value) })} /></div>
        <div><Label>Valor estimado</Label><Input type="number" value={form.estimatedValue} onChange={(event) => setForm({ ...form, estimatedValue: Number(event.target.value) })} /></div>
        <div className="sm:col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit" className="w-full">Salvar lote</Button></DialogFooter>
    </form>
  );
}

function SanitaryForm({
  initial,
  livestock,
  onSave,
}: {
  initial: SanitaryRecord | null;
  livestock: ReturnType<typeof useFarm>["livestock"];
  onSave: (record: Omit<SanitaryRecord, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<SanitaryRecord, "id">>(initial ?? {
    livestockId: livestock[0]?.id ?? "",
    procedure: "vacinacao",
    date: new Date().toISOString().slice(0, 10),
    product: "",
    responsible: "",
    cost: 0,
    notes: "",
  });

  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (form.cost < 0) return toast.error("O custo não pode ser negativo."); onSave(form); }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Animal ou lote</Label>
          <Select value={form.livestockId} onValueChange={(value) => setForm({ ...form, livestockId: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{livestock.map((item) => <SelectItem key={item.id} value={item.id}>{item.tag}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Procedimento</Label>
          <Select value={form.procedure} onValueChange={(value) => setForm({ ...form, procedure: value as SanitaryProcedureType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SANITARY_PROCEDURE_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Data</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
        <div><Label>Medicamento ou vacina</Label><Input value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} /></div>
        <div><Label>Responsável</Label><Input value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} /></div>
        <div><Label>Custo</Label><Input type="number" value={form.cost} onChange={(event) => setForm({ ...form, cost: Number(event.target.value) })} /></div>
        <div className="sm:col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit" className="w-full">Salvar procedimento</Button></DialogFooter>
    </form>
  );
}
