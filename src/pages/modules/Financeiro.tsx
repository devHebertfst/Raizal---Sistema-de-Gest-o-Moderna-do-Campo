import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtBRL, fmtDate, useFarm } from "@/context/FarmContext";
import {
  ACCOUNT_STATUS_LABEL,
  ACCOUNT_TYPE_LABEL,
  AccountStatus,
  AccountType,
  AccountEntry,
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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmAction } from "@/components/agro/ConfirmAction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn, parseISODateLocal } from "@/lib/utils";
import { CHART_DANGER, CHART_PRIMARY } from "@/lib/chart-colors";

type ProjectionHorizon = "30" | "60" | "90";
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
};
const tooltipTextStyle = { color: "hsl(var(--foreground))" };

export default function FinanceiroPage() {
  const {
    transactions,
    properties,
    crops,
    livestock,
    accounts,
    addAccount,
    updateAccount,
    removeAccount,
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountEntry | null>(null);
  const [projectionHorizon, setProjectionHorizon] = useState<ProjectionHorizon>("30");
  const [projectionProperty, setProjectionProperty] = useState("all");
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
  const projection = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const limit = new Date(start);
    limit.setDate(limit.getDate() + Number(projectionHorizon));
    const byProperty = (propertyId?: string) => projectionProperty === "all" || propertyId === projectionProperty;
    const initialBalance = transactions
      .filter((item) => byProperty(item.propertyId) && parseISODateLocal(item.date) <= start)
      .reduce((sum, item) => sum + (item.type === "receita" ? item.value : -item.value), 0);
    const commitments = accounts
      .filter((account) => account.status !== "pago" && byProperty(account.propertyId) && parseISODateLocal(account.dueDate) <= limit)
      .sort((first, second) => first.dueDate.localeCompare(second.dueDate));
    const totals = commitments.reduce((acc, account) => {
      if (account.type === "receber") acc.income += account.value;
      else acc.expense += account.value;
      return acc;
    }, { income: 0, expense: 0 });
    let balance = initialBalance;
    const points = [{ date: start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), saldo: balance }];
    commitments.forEach((account) => {
      balance += account.type === "receber" ? account.value : -account.value;
      points.push({ date: fmtDate(account.dueDate).slice(0, 5), saldo: balance });
    });
    points.push({ date: limit.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), saldo: balance });
    return { initialBalance, finalBalance: balance, income: totals.income, expense: totals.expense, commitments, points, negative: points.some((point) => point.saldo < 0) };
  }, [accounts, projectionHorizon, projectionProperty, transactions]);

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
        title="Fluxo de caixa projetado"
        subtitle="Previsão baseada em contas pendentes e vencidas"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={projectionProperty} onValueChange={setProjectionProperty}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas propriedades</SelectItem>
                {properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={projectionHorizon} onValueChange={(value) => setProjectionHorizon(value as ProjectionHorizon)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem></SelectContent>
            </Select>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProjectionStat label="Saldo inicial" value={fmtBRL(projection.initialBalance)} />
          <ProjectionStat label="Entradas previstas" value={fmtBRL(projection.income)} tone="success" />
          <ProjectionStat label="Saídas previstas" value={fmtBRL(projection.expense)} tone="danger" />
          <ProjectionStat label="Saldo projetado" value={fmtBRL(projection.finalBalance)} tone={projection.finalBalance < 0 ? "danger" : "success"} />
        </div>
        {projection.negative && <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"><AlertTriangle className="h-4 w-4 shrink-0" /> O caixa fica negativo dentro do período selecionado.</div>}
        <div className="mt-5 h-72">
          <ResponsiveContainer>
            <LineChart data={projection.points}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip formatter={(value: number) => fmtBRL(value)} contentStyle={tooltipStyle} itemStyle={tooltipTextStyle} labelStyle={tooltipTextStyle} />
              <Line type="monotone" dataKey="saldo" name="Saldo projetado" stroke={projection.negative ? CHART_DANGER : CHART_PRIMARY} strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Próximos compromissos" subtitle={`${projection.commitments.length} lançamentos na projeção`}>
        {projection.commitments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum compromisso previsto para o período.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projection.commitments.map((account) => (
              <div key={account.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold">{account.description}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> {fmtDate(account.dueDate)}</p></div>
                  <Badge className={account.type === "receber" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}>{ACCOUNT_TYPE_LABEL[account.type]}</Badge>
                </div>
                <p className={cn("mt-3 font-bold", account.type === "receber" ? "text-success" : "text-danger")}>{account.type === "receber" ? "+" : "-"} {fmtBRL(account.value)}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

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
            <Button className="rounded-full" onClick={() => { setEditingAccount(null); setAccountOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova conta
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:hidden">
          {filteredAccounts.map((account) => {
            const effectiveStatus = accountStatusOf(account);
            return (
              <div key={account.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold">{account.description}</p><p className="text-xs text-muted-foreground">{fmtDate(account.dueDate)}</p></div>
                  <Badge variant="secondary">{ACCOUNT_STATUS_LABEL[effectiveStatus]}</Badge>
                </div>
                <p className="mt-3 font-bold">{fmtBRL(account.value)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {effectiveStatus !== "pago" && <Button size="sm" variant="outline" onClick={() => markAccountPaid(account.id)}>Marcar pago</Button>}
                  <Button size="sm" variant="ghost" onClick={() => { setEditingAccount(account); setAccountOpen(true); }}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
                  <ConfirmAction description="A conta será removida permanentemente." onConfirm={() => removeAccount(account.id)}>
                    <Button size="sm" variant="ghost" className="text-danger"><Trash2 className="mr-1 h-4 w-4" /> Remover</Button>
                  </ConfirmAction>
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
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
                      <Button aria-label="Editar conta" size="icon" variant="ghost" onClick={() => { setEditingAccount(account); setAccountOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmAction description="A conta será removida permanentemente." onConfirm={() => removeAccount(account.id)}>
                        <Button aria-label="Remover conta" size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-danger" /></Button>
                      </ConfirmAction>
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

        <div className="grid gap-3 md:hidden">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">{item.description}</p><p className="text-xs text-muted-foreground">{fmtDate(item.date)}</p></div>
                <p className={cn("font-bold", item.type === "receita" ? "text-success" : "text-danger")}>{item.type === "receita" ? "+" : "-"} {fmtBRL(item.value)}</p>
              </div>
              <ConfirmAction description="O lançamento será removido permanentemente." onConfirm={() => { removeTransaction(item.id); toast("Lançamento removido"); }}>
                <Button size="sm" variant="ghost" className="mt-3 text-danger"><Trash2 className="mr-1 h-4 w-4" /> Remover</Button>
              </ConfirmAction>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
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
                      <ConfirmAction description="O lançamento será removido permanentemente." onConfirm={() => { removeTransaction(item.id); toast("Lançamento removido"); }}>
                        <Button aria-label="Remover lançamento" size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                      </ConfirmAction>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingAccount ? "Editar conta" : "Nova conta"}</DialogTitle></DialogHeader>
          <AccountForm
            initial={editingAccount}
            properties={properties}
            onSave={(account) => {
              if (editingAccount) updateAccount({ ...editingAccount, ...account });
              else addAccount(account);
              toast.success(editingAccount ? "Conta atualizada" : "Conta adicionada");
              setAccountOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectionStat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "success" | "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-lg font-bold", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</p>
    </div>
  );
}

function AccountForm({ initial, properties, onSave }: {
  initial: AccountEntry | null;
  properties: ReturnType<typeof useFarm>["properties"];
  onSave: (account: Omit<AccountEntry, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<AccountEntry, "id">>(initial ?? {
    description: "", type: "pagar", category: "", value: 0,
    dueDate: new Date().toISOString().slice(0, 10), status: "pendente", propertyId: "", notes: "",
  });
  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (form.value <= 0) return toast.error("Informe um valor maior que zero."); onSave(form); }}>
      <div><Label>Descrição</Label><Input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Categoria</Label><Input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
        <div><Label>Valor</Label><Input required min="0.01" step="0.01" type="number" value={form.value} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })} /></div>
        <div><Label>Tipo</Label><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as AccountType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pagar">A pagar</SelectItem><SelectItem value="receber">A receber</SelectItem></SelectContent></Select></div>
        <div><Label>Vencimento</Label><Input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Propriedade</Label><Select value={form.propertyId || "none"} onValueChange={(value) => setForm({ ...form, propertyId: value === "none" ? "" : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem propriedade</SelectItem>{properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label>Observações</Label><Textarea value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
      <DialogFooter><Button className="w-full" type="submit">Salvar conta</Button></DialogFooter>
    </form>
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
        if (!form.description || Number(form.value) <= 0) return toast.error("Informe uma descrição e um valor maior que zero.");
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
