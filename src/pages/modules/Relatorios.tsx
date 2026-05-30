import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fmtBRL, useFarm } from "@/context/FarmContext";
import {
  ACCOUNT_TYPE_LABEL,
  CATEGORY_LABEL,
  EVENT_CATEGORY_LABEL,
  STOCK_CATEGORY_LABEL,
} from "@/data/types";
import { SectionCard } from "@/components/agro/SectionCard";
import { StatCard } from "@/components/agro/StatCard";
import { Beef, Boxes, CheckSquare, Coins, Sprout, TrendingUp } from "lucide-react";
import { CHART_ACCENT, CHART_DANGER, CHART_PALETTE, CHART_PRIMARY, CHART_PRIMARY_SOFT } from "@/lib/chart-colors";
import { parseISODateLocal } from "@/lib/utils";
import { taskColumnTitle } from "@/lib/task-board";

const COLORS = CHART_PALETTE;
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
};
const tooltipTextStyle = {
  color: "hsl(var(--foreground))",
};

export default function RelatoriosPage() {
  const {
    properties,
    crops,
    livestock,
    transactions,
    stockItems,
    accounts,
    tasks,
    taskColumns,
    events,
    sanitaryRecords,
    cropManagementRecords,
  } = useFarm();

  const totalRevenue = transactions.filter((item) => item.type === "receita").reduce((sum, item) => sum + item.value, 0);
  const totalExpense = transactions.filter((item) => item.type === "despesa").reduce((sum, item) => sum + item.value, 0);
  const totalStockValue = stockItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const totalLivestockValue = livestock.reduce((sum, item) => sum + item.estimatedValue * (item.count ?? 1), 0);
  const sanitaryCost = sanitaryRecords.reduce((sum, item) => sum + item.cost, 0);
  const managementCost = cropManagementRecords.reduce((sum, item) => sum + item.cost, 0);

  const seasonMap = new Map<string, { season: string; lucro: number; manejo: number }>();
  crops.forEach((crop) => {
    const entry = seasonMap.get(crop.season) ?? { season: crop.season, lucro: 0, manejo: 0 };
    entry.lucro += crop.estimatedRevenue - crop.estimatedCost;
    seasonMap.set(crop.season, entry);
  });
  cropManagementRecords.forEach((record) => {
    const crop = crops.find((item) => item.id === record.cropId);
    if (!crop) return;
    const entry = seasonMap.get(crop.season) ?? { season: crop.season, lucro: 0, manejo: 0 };
    entry.manejo += record.cost;
    seasonMap.set(crop.season, entry);
  });

  const stockByCategory = Object.entries(
    stockItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.quantity * item.unitCost;
      return acc;
    }, {}),
  ).map(([key, value]) => ({ name: STOCK_CATEGORY_LABEL[key as keyof typeof STOCK_CATEGORY_LABEL] ?? key, value }));

  const accountsByMonth = accounts.reduce<Record<string, { label: string; pagar: number; receber: number }>>((acc, account) => {
    const date = parseISODateLocal(account.dueDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    acc[key] ??= {
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      pagar: 0,
      receber: 0,
    };
    acc[key][account.type] += account.value;
    return acc;
  }, {});
  const accountData = Object.entries(accountsByMonth).sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);

  const taskStatusData = Object.entries(
    tasks.reduce<Record<string, number>>((acc, task) => {
      const status = taskColumnTitle(task, taskColumns);
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const eventData = Object.entries(
    events.reduce<Record<string, number>>((acc, event) => {
      acc[event.category] = (acc[event.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([key, value]) => ({ name: EVENT_CATEGORY_LABEL[key as keyof typeof EVENT_CATEGORY_LABEL] ?? key, value }));

  const propData = properties.map((property) => {
    const cropsOfProperty = crops.filter((crop) => crop.propertyId === property.id);
    const accountsOfProperty = accounts.filter((account) => account.propertyId === property.id);
    const stockOfProperty = stockItems.filter((item) => item.propertyId === property.id);
    return {
      name: property.name,
      receita: cropsOfProperty.reduce((sum, crop) => sum + crop.estimatedRevenue, 0),
      custo: cropsOfProperty.reduce((sum, crop) => sum + crop.estimatedCost, 0),
      contas: accountsOfProperty.reduce((sum, account) => sum + account.value, 0),
      estoque: stockOfProperty.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    };
  });

  const expData = Object.entries(
    transactions.filter((item) => item.type === "despesa").reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.value;
      return acc;
    }, {}),
  ).map(([key, value]) => ({ name: CATEGORY_LABEL[key as keyof typeof CATEGORY_LABEL] ?? key, value }));

  const monthly: { label: string; key: string; receita: number; despesa: number }[] = [];
  const now = new Date();
  for (let index = 11; index >= 0; index--) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    monthly.push({
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      key: `${date.getFullYear()}-${date.getMonth()}`,
      receita: 0,
      despesa: 0,
    });
  }
  transactions.forEach((item) => {
    const date = parseISODateLocal(item.date);
    const month = monthly.find((entry) => entry.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (!month) return;
    if (item.type === "receita") month.receita += item.value;
    else month.despesa += item.value;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Receita total" value={fmtBRL(totalRevenue)} icon={TrendingUp} tone="success" />
        <StatCard label="Valor total do estoque" value={fmtBRL(totalStockValue)} icon={Boxes} tone="primary" />
        <StatCard label="Custo sanitário" value={fmtBRL(sanitaryCost)} icon={Beef} tone="warning" />
        <StatCard label="Custo de manejo" value={fmtBRL(managementCost)} icon={Sprout} tone="accent" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lucro consolidado" value={fmtBRL(totalRevenue - totalExpense)} icon={Coins} tone="primary" />
        <StatCard label="Hectares produtivos" value={`${crops.reduce((sum, crop) => sum + crop.hectares, 0)} ha`} icon={Sprout} tone="accent" />
        <StatCard label="Patrimônio rebanho" value={fmtBRL(totalLivestockValue)} icon={Beef} tone="warning" />
        <StatCard label="Tarefas cadastradas" value={String(tasks.length)} icon={CheckSquare} tone="muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Lucro e manejo por safra" subtitle="Estimativas consolidadas" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={Array.from(seasonMap.values())}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="season" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  cursor={false}
                  formatter={(value: number) => fmtBRL(value)}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipTextStyle}
                  labelStyle={tooltipTextStyle}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="lucro" name="Lucro" radius={[8, 8, 0, 0]} fill={CHART_PRIMARY} maxBarSize={48} />
                <Bar dataKey="manejo" name="Manejo" radius={[8, 8, 0, 0]} fill={CHART_PRIMARY_SOFT} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Estoque por categoria">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stockByCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={3}>
                  {stockByCategory.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  cursor={false}
                  formatter={(value: number) => fmtBRL(value)}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipTextStyle}
                  labelStyle={tooltipTextStyle}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Contas por vencimento" subtitle={`${ACCOUNT_TYPE_LABEL.pagar} vs ${ACCOUNT_TYPE_LABEL.receber}`} className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={accountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  cursor={false}
                  formatter={(value: number) => fmtBRL(value)}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipTextStyle}
                  labelStyle={tooltipTextStyle}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pagar" name="A pagar" fill={CHART_DANGER} radius={[8, 8, 0, 0]} maxBarSize={40} />
                <Bar dataKey="receber" name="A receber" fill={CHART_PRIMARY_SOFT} radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Tarefas por status">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={taskStatusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={3}>
                  {taskStatusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  cursor={false}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipTextStyle}
                  labelStyle={tooltipTextStyle}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Receitas vs Despesas" subtitle="Evolução 12 meses" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  cursor={false}
                  formatter={(value: number) => fmtBRL(value)}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipTextStyle}
                  labelStyle={tooltipTextStyle}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="receita" name="Receita" stroke={CHART_PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="despesa" name="Despesa" stroke={CHART_DANGER} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Eventos por tipo">
          <div className="space-y-2">
            {eventData.sort((a, b) => b.value - a.value).map((item, index) => {
              const max = Math.max(...eventData.map((entry) => entry.value), 1);
              const pct = (item.value / max) * 100;
              return (
                <div key={item.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[index % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Comparativo entre propriedades" subtitle="Receita, custo, contas e estoque">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={propData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                cursor={false}
                formatter={(value: number) => fmtBRL(value)}
                contentStyle={tooltipStyle}
                itemStyle={tooltipTextStyle}
                labelStyle={tooltipTextStyle}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="receita" name="Receita" fill={CHART_PRIMARY} radius={[8, 8, 0, 0]} maxBarSize={32} />
              <Bar dataKey="custo" name="Custo lavoura" fill={CHART_DANGER} radius={[8, 8, 0, 0]} maxBarSize={32} />
              <Bar dataKey="estoque" name="Estoque" fill={CHART_ACCENT} radius={[8, 8, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Despesas por categoria">
        <div className="space-y-2">
          {expData.sort((a, b) => b.value - a.value).map((item, index) => {
            const max = Math.max(...expData.map((entry) => entry.value), 1);
            const pct = (item.value / max) * 100;
            return (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{fmtBRL(item.value)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[index % COLORS.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
