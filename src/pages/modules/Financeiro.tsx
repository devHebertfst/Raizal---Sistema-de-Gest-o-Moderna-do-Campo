import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Trash2,
  Wallet,
} from "lucide-react";
import { fmtBRL, fmtDate, useFarm } from "@/context/FarmContext";
import {
  ACCOUNT_STATUS_LABEL,
  ACCOUNT_TYPE_LABEL,
  AccountStatus,
  AccountType,
  CATEGORY_LABEL,
  Transaction,
  TxCategory,
  TxType,
} from "@/data/types";
import { StatCard } from "@/components/agro/StatCard";
import { SectionCard } from "@/components/agro/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn, parseISODateLocal } from "@/lib/utils";

export default function FinanceiroPage() {
  const {
    transactions,
    properties,
    crops,
    livestock,
    accounts,
    addTransaction,
    removeTransaction,
    markAccountPaid,
  } = useFarm();
  const [filterType, setFilterType] = useState<"all" | TxType>("all");
  const [filterCat, setFilterCat] = useState<"all" | TxCategory>("all");
  const [accountType, setAccountType] = useState<"all" | AccountType>("all");
  const [accountStatus, setAccountStatus] = useState<"all" | AccountStatus>("all");
  const [period, setPeriod] = useState<"all" | "30" | "90" | "year">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const accountStatusOf = (account: typeof accounts[number]): AccountStatus =>
    account.status !== "pago" && parseISODateLocal(account.dueDate) < new Date() ? "atrasado" : account.status;

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterCat !== "all" && item.category !== filterCat) return false;
      if (q && !item.description.toLowerCase().includes(q.toLowerCase())) return false;
      if (period !== "all") {
        const date = parseISODateLocal(item.date);
        const diff = (now.getTime() - date.getTime()) / 86400000;
        if (diff < 0) return false;
        if (period === "30" && diff > 30) return false;
        if (period === "90" && diff > 90) return false;
        if (period === "year" && date.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterCat, q, period]);

  const filteredAccounts = accounts.filter((account) =>
    (accountType === "all" || account.type === accountType) &&
    (accountStatus === "all" || accountStatusOf(account) === accountStatus),
  );

  const totalRevenue = filtered.filter((item) => item.type === "receita").reduce((sum, item) => sum + item.value, 0);
  const totalExpense = filtered.filter((item) => item.type === "despesa").reduce((sum, item) => sum + item.value, 0);
  const pendingTotal = accounts.filter((item) => accountStatusOf(item) === "pendente").reduce((sum, item) => sum + item.value, 0);
  const paidTotal = accounts.filter((item) => item.status === "pago").reduce((sum, item) => sum + item.value, 0);
  const overdueTotal = accounts.filter((item) => accountStatusOf(item) === "atrasado").reduce((sum, item) => sum + item.value, 0);
  const dueSoon = accounts.filter((item) => {
    const diff = (parseISODateLocal(item.dueDate).getTime() - Date.now()) / 86400000;
    return item.status === "pendente" && diff >= 0 && diff <= 7;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Receitas (filtro)" value={fmtBRL(totalRevenue)} icon={TrendingUp} tone="success" />
        <StatCard label="Despesas (filtro)" value={fmtBRL(totalExpense)} icon={TrendingDown} tone="danger" />
        <StatCard label="Saldo do período" value={fmtBRL(totalRevenue - totalExpense)} icon={Wallet} tone="primary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Contas pendentes" value={fmtBRL(pendingTotal)} icon={Clock} tone="warning" />
        <StatCard label="Contas pagas" value={fmtBRL(paidTotal)} icon={CheckCircle2} tone="success" />
        <StatCard label="Atrasadas" value={fmtBRL(overdueTotal)} icon={Clock} tone="danger" />
        <StatCard label="Vencem em 7 dias" value={String(dueSoon.length)} icon={Clock} tone="accent" />
      </div>

      <SectionCard
        title="Contas a pagar e receber"
        subtitle={`${filteredAccounts.length} compromissos encontrados`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={accountType} onValueChange={(value) => setAccountType(value as "all" | AccountType)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                <SelectItem value="pagar">A pagar</SelectItem>
                <SelectItem value="receber">A receber</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accountStatus} onValueChange={(value) => setAccountStatus(value as "all" | AccountStatus)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Descrição</th>
                <th className="px-4 py-2.5 text-left">Tipo</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Vencimento</th>
                <th className="px-4 py-2.5 text-left">Propriedade</th>
                <th className="px-4 py-2.5 text-right">Valor</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => {
                const property = properties.find((item) => item.id === account.propertyId);
                const effectiveStatus = accountStatusOf(account);
                return (
                  <tr key={account.id} className={cn("border-t border-border", effectiveStatus === "atrasado" && "bg-danger/5")}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{account.description}</p>
                      <p className="text-xs text-muted-foreground">{account.category}</p>
                    </td>
                    <td className="px-4 py-3">{ACCOUNT_TYPE_LABEL[account.type]}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn(
                        effectiveStatus === "pago" && "bg-success/15 text-success",
                        effectiveStatus === "atrasado" && "bg-danger/15 text-danger",
                        effectiveStatus === "pendente" && "bg-warning/15 text-warning",
                      )}>{ACCOUNT_STATUS_LABEL[effectiveStatus]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(account.dueDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{property?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtBRL(account.value)}</td>
                    <td className="px-4 py-3 text-right">
                      {effectiveStatus !== "pago" && (
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => markAccountPaid(account.id)}>
                          Marcar pago
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Lançamentos"
        subtitle={`${filtered.length} registros encontrados`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="mr-1.5 h-4 w-4" /> Novo lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo lançamento financeiro</DialogTitle></DialogHeader>
              <NewTxForm
                onSave={(item) => {
                  addTransaction(item);
                  toast.success("Lançamento adicionado");
                  setOpen(false);
                }}
                properties={properties}
                crops={crops}
                livestock={livestock}
              />
            </DialogContent>
          </Dialog>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar descrição..." className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | TxType)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={(value) => setFilterCat(value as "all" | TxCategory)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(value) => setPeriod(value as "all" | "30" | "90" | "year")}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Data</th>
                <th className="px-4 py-2.5 text-left">Descrição</th>
                <th className="px-4 py-2.5 text-left">Categoria</th>
                <th className="px-4 py-2.5 text-left">Propriedade</th>
                <th className="px-4 py-2.5 text-right">Valor</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const property = properties.find((prop) => prop.id === item.propertyId);
                return (
                  <tr key={item.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(item.date)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="rounded-full font-normal">{CATEGORY_LABEL[item.category]}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{property?.name ?? "-"}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", item.type === "receita" ? "text-success" : "text-danger")}>
                      {item.type === "receita" ? "+" : "-"} {fmtBRL(item.value)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button aria-label="Remover lançamento" size="icon" variant="ghost" onClick={() => { if (window.confirm("Remover este lançamento?")) { removeTransaction(item.id); toast("Lançamento removido"); } }}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function NewTxForm({
  onSave,
  properties,
  crops,
  livestock,
}: {
  onSave: (t: Omit<Transaction, "id">) => void;
  properties: ReturnType<typeof useFarm>["properties"];
  crops: ReturnType<typeof useFarm>["crops"];
  livestock: ReturnType<typeof useFarm>["livestock"];
}) {
  const [form, setForm] = useState({
    description: "",
    type: "despesa" as TxType,
    category: "sementes" as TxCategory,
    value: "",
    date: new Date().toISOString().slice(0, 10),
    propertyId: properties[0]?.id ?? "",
    cropId: "",
    livestockId: "",
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.description || !form.value) return;
        onSave({
          description: form.description,
          type: form.type,
          category: form.category,
          value: Number(form.value),
          date: form.date,
          propertyId: form.propertyId || undefined,
          cropId: form.cropId || undefined,
          livestockId: form.livestockId || undefined,
        });
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Descrição</Label>
          <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Ex: Compra de sementes" />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as TxType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as TxCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Valor (R$)</Label><Input type="number" min="0" step="0.01" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></div>
        <div><Label>Data</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
        <div>
          <Label>Propriedade</Label>
          <Select value={form.propertyId} onValueChange={(value) => setForm({ ...form, propertyId: value })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Plantação relacionada</Label>
          <Select value={form.cropId || "none"} onValueChange={(value) => setForm({ ...form, cropId: value === "none" ? "" : value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">- nenhuma -</SelectItem>
              {crops.map((crop) => <SelectItem key={crop.id} value={crop.id}>{crop.culture} · {crop.season}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Rebanho relacionado</Label>
          <Select value={form.livestockId || "none"} onValueChange={(value) => setForm({ ...form, livestockId: value === "none" ? "" : value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">- nenhum -</SelectItem>
              {livestock.map((item) => <SelectItem key={item.id} value={item.id}>{item.tag}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter><Button type="submit" className="w-full">Salvar lançamento</Button></DialogFooter>
    </form>
  );
}
