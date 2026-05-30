import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fmtBRL, fmtNum, useFarm } from "@/context/FarmContext";
import { parseISODateLocal } from "@/lib/utils";

export type NotificationTone = "danger" | "warning" | "primary";

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  path: string;
  tone: NotificationTone;
}

const daysFromToday = (iso: string) => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((parseISODateLocal(iso).getTime() - start.getTime()) / 86400000);
};

export function useNotifications() {
  const { user } = useAuth();
  const { accounts, crops, livestock, sanitaryRecords, stockItems, tasks } = useFarm();
  const storageKey = `Raizal:notifications:read:${user?.id ?? "guest"}`;
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(readIds));
  }, [readIds, storageKey]);

  const notifications = useMemo<AppNotification[]>(() => {
    const lowStock = stockItems
      .filter((item) => item.quantity <= item.minQuantity)
      .map((item) => ({
        id: `stock:${item.id}`,
        title: `${item.name} abaixo do mínimo`,
        detail: `${fmtNum(item.quantity)} ${item.unit} disponíveis`,
        path: "/estoque",
        tone: "danger" as const,
      }));
    const dueAccounts = accounts
      .filter((account) => account.status !== "pago" && daysFromToday(account.dueDate) <= 7)
      .map((account) => ({
        id: `account:${account.id}`,
        title: account.description,
        detail: `${fmtBRL(account.value)} · ${daysFromToday(account.dueDate) < 0 ? "vencida" : `vence em ${daysFromToday(account.dueDate)} dias`}`,
        path: "/financeiro",
        tone: daysFromToday(account.dueDate) < 0 ? "danger" as const : "warning" as const,
      }));
    const lateTasks = tasks
      .filter((task) => task.status !== "concluida" && daysFromToday(task.dueDate) < 0)
      .map((task) => ({
        id: `task:${task.id}`,
        title: `Tarefa atrasada: ${task.title}`,
        detail: `${task.assignee} · ${Math.abs(daysFromToday(task.dueDate))} dias`,
        path: "/tarefas",
        tone: "danger" as const,
      }));
    const harvests = crops
      .filter((crop) => crop.status !== "colhida" && daysFromToday(crop.harvestForecast) >= 0 && daysFromToday(crop.harvestForecast) <= 15)
      .map((crop) => ({
        id: `harvest:${crop.id}`,
        title: `Colheita próxima: ${crop.culture}`,
        detail: `${crop.field} · ${daysFromToday(crop.harvestForecast)} dias`,
        path: "/plantacoes",
        tone: "primary" as const,
      }));
    const vaccines = livestock
      .filter((item) => {
        const records = sanitaryRecords.filter((record) => record.livestockId === item.id && record.procedure === "vacinacao");
        return !records.length || daysFromToday([...records].sort((first, second) => second.date.localeCompare(first.date))[0].date) < -150;
      })
      .map((item) => ({
        id: `vaccine:${item.id}`,
        title: `Vacinação pendente: ${item.tag}`,
        detail: "Sem vacinação recente",
        path: "/rebanho",
        tone: "warning" as const,
      }));
    return [...lowStock, ...dueAccounts, ...lateTasks, ...harvests, ...vaccines];
  }, [accounts, crops, livestock, sanitaryRecords, stockItems, tasks]);

  const unread = notifications.filter((notification) => !readIds.includes(notification.id));
  const isRead = (id: string) => readIds.includes(id);
  const markRead = (id: string) => setReadIds((state) => state.includes(id) ? state : [...state, id]);
  const markAllRead = () => setReadIds(notifications.map((notification) => notification.id));

  return { notifications, unreadCount: unread.length, isRead, markRead, markAllRead };
}
