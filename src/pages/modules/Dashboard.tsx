import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Beef,
  Boxes,
  CalendarClock,
  CheckSquare,
  Coins,
  Leaf,
  MapPinned,
  Sprout,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtBRL, fmtNum, useFarm } from "@/context/FarmContext";
import { CATEGORY_LABEL, EVENT_CATEGORY_LABEL } from "@/data/types";
import { StatCard } from "@/components/agro/StatCard";
import { SectionCard } from "@/components/agro/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHART_DANGER, CHART_PALETTE, CHART_PRIMARY } from "@/lib/chart-colors";
import { cn, parseISODateLocal } from "@/lib/utils";

type PeriodFilter = "30" | "90" | "year" | "all";

const daysFromToday = (iso: string) => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((parseISODateLocal(iso).getTime() - start.getTime()) / 86400000);
};

const inPeriod = (iso: string, period: PeriodFilter) => {
  if (period === "all") return true;
  const date = parseISODateLocal(iso);
  const now = new Date();
  if (period === "year") return date.getFullYear() === now.getFullYear();
  return (now.getTime() - date.getTime()) / 86400000 <= Number(period);
};

export default function DashboardPage() {
  const {
    properties,
    crops,
    livestock,
    transactions,
    stockItems,
    accounts,
    tasks,
    events,
    sanitaryRecords,
  } = useFarm();
  const [propertyId, setPropertyId] = useState("all");
  const [period, setPeriod] = useState<PeriodFilter>("year");

  const scoped = useMemo(() => {
    const byProperty = (id?: string) => propertyId === "all" || id === propertyId;
    return {
      crops: crops.filter((item) => byProperty(item.propertyId)),
      livestock: livestock.filter((item) => byProperty(item.propertyId)),
      transactions: transactions.filter((item) => byProperty(item.propertyId) && inPeriod(item.date, period)),
      stockItems: stockItems.filter((item) => byProperty(item.propertyId)),
      accounts: accounts.filter((item) => byProperty(item.propertyId) && inPeriod(item.dueDate, period)),
      tasks: tasks.filter((item) => byProperty(item.propertyId)),
      events: events.filter((item) => byProperty(item.propertyId)),
    };
  }, [accounts, crops, events, livestock, period, propertyId, stockItems, tasks, transactions]);

  const totalRevenue = scoped.transactions.filter((item) => item.type === "receita").reduce((sum, item) => sum + item.value, 0);
  const totalExpense = scoped.transactions.filter((item) => item.type === "despesa").reduce((sum, item) => sum + item.value, 0);
  const stockValue = scoped.stockItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const animalsCount = scoped.livestock.reduce((sum, item) => sum + (item.count ?? 1), 0);
  const activeCrops = scoped.crops.filter((item) => item.status !== "colhida").length;
  const openTasks = scoped.tasks.filter((item) => item.status !== "concluida").length;
  const pendingAccounts = scoped.accounts.filter((item) => item.status !== "pago").reduce((sum, item) => sum + item.value, 0);
  const totalHa = propertyId === "all"
    ? properties.reduce((sum, item) => sum + item.totalHa, 0)
    : properties.find((item) => item.id === propertyId)?.totalHa ?? 0;
  const usedHa = propertyId === "all"
    ? properties.reduce((sum, item) => sum + item.cultivableHa + item.pastureHa, 0)
    : (() => {
      const property = properties.find((item) => item.id === propertyId);
      return property ? property.cultivableHa + property.pastureHa : 0;
    })();

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      receitas: 0,
      despesas: 0,
      lucro: 0,
    };
  });
  scoped.transactions.forEach((item) => {
    const date = parseISODateLocal(item.date);
    const month = months.find((entry) => entry.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (!month) return;
    if (item.type === "receita") month.receitas += item.value;
    else month.despesas += item.value;
    month.lucro = month.receitas - month.despesas;
  });

  const expData = Object.entries(
    scoped.transactions.filter((item) => item.type === "despesa").reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.value;
      return acc;
    }, {}),
  ).map(([key, value]) => ({ name: CATEGORY_LABEL[key as keyof typeof CATEGORY_LABEL] ?? key, value }));

  const seasonData = Object.entries(
    scoped.crops.reduce<Record<string, number>>((acc, crop) => {
      acc[crop.season] = (acc[crop.season] ?? 0) + crop.estimatedRevenue - crop.estimatedCost;
      return acc;
    }, {}),
  ).map(([season, lucro]) => ({ season, lucro }));

  const lowStock = scoped.stockItems.filter((item) => item.quantity <= item.minQuantity);
  const lateTasks = scoped.tasks.filter((item) => item.status !== "concluida" && daysFromToday(item.dueDate) < 0);
  const dueAccounts = scoped.accounts.filter((item) => item.status !== "pago" && daysFromToday(item.dueDate) <= 7);
  const upcomingEvents = scoped.events.filter((item) => !item.done && daysFromToday(item.date) >= 0 && daysFromToday(item.date) <= 10);
  const pendingVaccines = scoped.livestock.filter((item) => {
    const records = sanitaryRecords.filter((record) => record.livestockId === item.id && record.procedure === "vacinacao");
    if (!records.length) return true;
    return daysFromToday([...records].sort((a, b) => b.date.localeCompare(a.date))[0].date) < -150;
  });

  const alerts = [
    ...lowStock.slice(0, 2).map((item) => ({ title: `${item.name} abaixo do mínimo`, detail: `${fmtNum(item.quantity)} ${item.unit} disponíveis`, tone: "danger" as const })),
    ...dueAccounts.slice(0, 2).map((item) => ({ title: `Conta exige atenção: ${item.description}`, detail: `${fmtBRL(item.value)} - ${daysFromToday(item.dueDate) < 0 ? "vencida" : `vence em ${daysFromToday(item.dueDate)} dias`}`, tone: "warning" as const })),
    ...lateTasks.slice(0, 2).map((item) => ({ title: `Tarefa atrasada: ${item.title}`, detail: `${item.assignee} - ${Math.abs(daysFromToday(item.dueDate))} dias`, tone: "danger" as const })),
    ...upcomingEvents.slice(0, 2).map((item) => ({ title: `Evento próximo: ${item.title}`, detail: EVENT_CATEGORY_LABEL[item.category], tone: "primary" as const })),
    ...pendingVaccines.slice(0, 1).map((item) => ({ title: `Vacinação pendente: ${item.tag}`, detail: "Sem vacinação recente", tone: "warning" as const })),
  ].slice(0, 6);

  const propertyOverview = properties.map((property) => {
    const propertyCrops = crops.filter((item) => item.propertyId === property.id);
    const propertyStock = stockItems.filter((item) => item.propertyId === property.id);
    const propertyTasks = tasks.filter((item) => item.propertyId === property.id && item.status !== "concluida");
    return {
      property,
      revenue: propertyCrops.reduce((sum, crop) => sum + crop.estimatedRevenue, 0),
      cost: propertyCrops.reduce((sum, crop) => sum + crop.estimatedCost, 0),
      stock: propertyStock.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
      tasks: propertyTasks.length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/80 bg-gradient-earth p-6 text-white shadow-elegant md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-3 bg-white/15 text-white hover:bg-white/15">
              <Leaf className="mr-1 h-3 w-3" /> Visão executiva
            </Badge>
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-4xl">
              Operação rural sob controle
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/82">
              Indicadores financeiros, produtivos e operacionais consolidados para decisões rápidas na gestão da fazenda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="h-10 w-[190px] rounded-full border-white/20 bg-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas propriedades</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodFilter)}>
              <SelectTrigger className="h-10 w-[150px] rounded-full border-white/20 bg-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="year">Ano atual</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo operacional" value={fmtBRL(totalRevenue - totalExpense)} icon={Wallet} tone="primary" />
        <StatCard label="Receitas filtradas" value={fmtBRL(totalRevenue)} icon={TrendingUp} tone="success" />
        <StatCard label="Despesas filtradas" value={fmtBRL(totalExpense)} icon={TrendingDown} tone="danger" />
        <StatCard label="Contas pendentes" value={fmtBRL(pendingAccounts)} icon={Coins} tone="warning" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hectares em uso" value={`${fmtNum(usedHa)} ha`} icon={MapPinned} tone="muted" hint={`${totalHa ? Math.round((usedHa / totalHa) * 100) : 0}% da área`} />
        <StatCard label="Plantações ativas" value={String(activeCrops)} icon={Sprout} tone="success" />
        <StatCard label="Cabeças de gado" value={animalsCount.toLocaleString("pt-BR")} icon={Beef} tone="accent" />
        <StatCard label="Valor em estoque" value={fmtBRL(stockValue)} icon={Boxes} tone="primary" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Receitas x despesas" subtitle="Evolução dos últimos 6 meses" className="xl:col-span-2">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={false} formatter={(value: number) => fmtBRL(value)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receitas" name="Receitas" fill={CHART_PRIMARY} radius={[8, 8, 0, 0]} maxBarSize={42} />
                <Bar dataKey="despesas" name="Despesas" fill={CHART_DANGER} radius={[8, 8, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Alertas e pendências" subtitle={`${alerts.length} itens priorizados`}>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={`${alert.title}-${alert.detail}`} className="rounded-xl border border-border bg-secondary/35 p-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    alert.tone === "danger" && "bg-danger/15 text-danger",
                    alert.tone === "warning" && "bg-warning/15 text-warning",
                    alert.tone === "primary" && "bg-primary/10 text-primary",
                  )}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground">{alert.title}</p>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">{alert.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Lucro por safra" subtitle="Receita estimada menos custo">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={seasonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="season" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip cursor={false} formatter={(value: number) => fmtBRL(value)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="lucro" name="Lucro" fill={CHART_PRIMARY} radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Gastos por categoria" subtitle="Distribuição filtrada">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={expData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={3}>
                  {expData.map((_, index) => <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />)}
                </Pie>
                <Tooltip cursor={false} formatter={(value: number) => fmtBRL(value)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Evolução financeira" subtitle="Lucro mensal">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip cursor={false} formatter={(value: number) => fmtBRL(value)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Line type="monotone" dataKey="lucro" name="Lucro" stroke={CHART_PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Visão rápida por propriedade"
        subtitle="Receita, custo, estoque e tarefas abertas"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {propertyOverview.map((entry) => (
            <div key={entry.property.id} className="rounded-2xl border border-border bg-gradient-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-extrabold text-foreground">{entry.property.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.property.location}</p>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{entry.tasks} tarefas</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Receita</p><p className="font-semibold text-success">{fmtBRL(entry.revenue)}</p></div>
                <div><p className="text-xs text-muted-foreground">Custo</p><p className="font-semibold text-danger">{fmtBRL(entry.cost)}</p></div>
                <div><p className="text-xs text-muted-foreground">Estoque</p><p className="font-semibold text-foreground">{fmtBRL(entry.stock)}</p></div>
                <div><p className="text-xs text-muted-foreground">Lucro est.</p><p className="font-semibold text-foreground">{fmtBRL(entry.revenue - entry.cost)}</p></div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
