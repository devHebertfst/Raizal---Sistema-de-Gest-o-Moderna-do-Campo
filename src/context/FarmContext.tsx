import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  AccountEntry,
  Crop,
  CropManagementRecord,
  FarmEvent,
  FarmTask,
  Livestock,
  Property,
  SanitaryRecord,
  StockItem,
  Transaction,
} from "@/data/types";
import {
  seedAccounts,
  seedCropManagementRecords,
  seedCrops,
  seedEvents,
  seedLivestock,
  seedProperties,
  seedSanitaryRecords,
  seedStockItems,
  seedTasks,
  seedTransactions,
} from "@/data/seed";
import { formatISODateBR } from "@/lib/utils";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

interface FarmCtx {
  properties: Property[];
  crops: Crop[];
  livestock: Livestock[];
  transactions: Transaction[];
  events: FarmEvent[];
  stockItems: StockItem[];
  accounts: AccountEntry[];
  tasks: FarmTask[];
  sanitaryRecords: SanitaryRecord[];
  cropManagementRecords: CropManagementRecord[];
  addProperty: (p: Omit<Property, "id">) => void;
  updateProperty: (p: Property) => void;
  removeProperty: (id: string) => void;
  addCrop: (c: Omit<Crop, "id">) => void;
  updateCrop: (c: Crop) => void;
  removeCrop: (id: string) => void;
  addLivestock: (l: Omit<Livestock, "id">) => void;
  updateLivestock: (l: Livestock) => void;
  removeLivestock: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (t: Transaction) => void;
  removeTransaction: (id: string) => void;
  addEvent: (e: Omit<FarmEvent, "id">) => void;
  updateEvent: (e: FarmEvent) => void;
  removeEvent: (id: string) => void;
  toggleEventDone: (id: string) => void;
  addStockItem: (item: Omit<StockItem, "id">) => void;
  updateStockItem: (item: StockItem) => void;
  removeStockItem: (id: string) => void;
  addAccount: (account: Omit<AccountEntry, "id">) => void;
  updateAccount: (account: AccountEntry) => void;
  removeAccount: (id: string) => void;
  markAccountPaid: (id: string) => void;
  addTask: (task: Omit<FarmTask, "id">) => void;
  updateTask: (task: FarmTask) => void;
  removeTask: (id: string) => void;
  addSanitaryRecord: (record: Omit<SanitaryRecord, "id">) => void;
  updateSanitaryRecord: (record: SanitaryRecord) => void;
  removeSanitaryRecord: (id: string) => void;
  addCropManagementRecord: (record: Omit<CropManagementRecord, "id">) => void;
  updateCropManagementRecord: (record: CropManagementRecord) => void;
  removeCropManagementRecord: (id: string) => void;
}

const Ctx = createContext<FarmCtx | null>(null);
const STORAGE_KEY = "Raizal:farm";

interface FarmState {
  properties: Property[];
  crops: Crop[];
  livestock: Livestock[];
  transactions: Transaction[];
  events: FarmEvent[];
  stockItems: StockItem[];
  accounts: AccountEntry[];
  tasks: FarmTask[];
  sanitaryRecords: SanitaryRecord[];
  cropManagementRecords: CropManagementRecord[];
}

const seedState: FarmState = {
  properties: seedProperties,
  crops: seedCrops,
  livestock: seedLivestock,
  transactions: seedTransactions,
  events: seedEvents,
  stockItems: seedStockItems,
  accounts: seedAccounts,
  tasks: seedTasks,
  sanitaryRecords: seedSanitaryRecords,
  cropManagementRecords: seedCropManagementRecords,
};

const loadState = (): FarmState => {
  if (typeof window === "undefined") return seedState;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedState;
  try {
    return { ...seedState, ...JSON.parse(raw) as FarmState };
  } catch {
    return seedState;
  }
};

export function FarmProvider({ children }: { children: ReactNode }) {
  const [initialState] = useState(loadState);
  const [properties, setProperties] = useState<Property[]>(initialState.properties);
  const [crops, setCrops] = useState<Crop[]>(initialState.crops);
  const [livestock, setLivestock] = useState<Livestock[]>(initialState.livestock);
  const [transactions, setTransactions] = useState<Transaction[]>(initialState.transactions);
  const [events, setEvents] = useState<FarmEvent[]>(initialState.events);
  const [stockItems, setStockItems] = useState<StockItem[]>(initialState.stockItems);
  const [accounts, setAccounts] = useState<AccountEntry[]>(initialState.accounts);
  const [tasks, setTasks] = useState<FarmTask[]>(initialState.tasks);
  const [sanitaryRecords, setSanitaryRecords] = useState<SanitaryRecord[]>(initialState.sanitaryRecords);
  const [cropManagementRecords, setCropManagementRecords] =
    useState<CropManagementRecord[]>(initialState.cropManagementRecords);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      properties,
      crops,
      livestock,
      transactions,
      events,
      stockItems,
      accounts,
      tasks,
      sanitaryRecords,
      cropManagementRecords,
    }));
  }, [properties, crops, livestock, transactions, events, stockItems, accounts, tasks, sanitaryRecords, cropManagementRecords]);

  const value = useMemo<FarmCtx>(
    () => ({
      properties,
      crops,
      livestock,
      transactions,
      events,
      stockItems,
      accounts,
      tasks,
      sanitaryRecords,
      cropManagementRecords,
      addProperty: (p) => setProperties((s) => [...s, { ...p, id: uid() }]),
      updateProperty: (p) => setProperties((s) => s.map((x) => (x.id === p.id ? p : x))),
      removeProperty: (id) => {
        const cropIds = crops.filter((item) => item.propertyId === id).map((item) => item.id);
        const livestockIds = livestock.filter((item) => item.propertyId === id).map((item) => item.id);
        setProperties((state) => state.filter((item) => item.id !== id));
        setCrops((state) => state.filter((item) => item.propertyId !== id));
        setLivestock((state) => state.filter((item) => item.propertyId !== id));
        setTransactions((state) => state.filter((item) => item.propertyId !== id && !cropIds.includes(item.cropId ?? "") && !livestockIds.includes(item.livestockId ?? "")));
        setEvents((state) => state.filter((item) => item.propertyId !== id && !cropIds.includes(item.cropId ?? "") && !livestockIds.includes(item.livestockId ?? "")));
        setStockItems((state) => state.filter((item) => item.propertyId !== id));
        setAccounts((state) => state.filter((item) => item.propertyId !== id));
        setTasks((state) => state.filter((item) => item.propertyId !== id));
        setSanitaryRecords((state) => state.filter((item) => !livestockIds.includes(item.livestockId)));
        setCropManagementRecords((state) => state.filter((item) => !cropIds.includes(item.cropId)));
      },
      addCrop: (c) => setCrops((s) => [...s, { ...c, id: uid() }]),
      updateCrop: (c) => setCrops((s) => s.map((x) => (x.id === c.id ? c : x))),
      removeCrop: (id) => {
        setCrops((state) => state.filter((item) => item.id !== id));
        setTransactions((state) => state.filter((item) => item.cropId !== id));
        setEvents((state) => state.filter((item) => item.cropId !== id));
        setCropManagementRecords((state) => state.filter((item) => item.cropId !== id));
      },
      addLivestock: (l) => setLivestock((s) => [...s, { ...l, id: uid() }]),
      updateLivestock: (l) => setLivestock((s) => s.map((x) => (x.id === l.id ? l : x))),
      removeLivestock: (id) => {
        setLivestock((state) => state.filter((item) => item.id !== id));
        setTransactions((state) => state.filter((item) => item.livestockId !== id));
        setEvents((state) => state.filter((item) => item.livestockId !== id));
        setSanitaryRecords((state) => state.filter((item) => item.livestockId !== id));
      },
      addTransaction: (t) => setTransactions((s) => [{ ...t, id: uid() }, ...s]),
      updateTransaction: (t) => setTransactions((s) => s.map((x) => (x.id === t.id ? t : x))),
      removeTransaction: (id) => setTransactions((s) => s.filter((x) => x.id !== id)),
      addEvent: (e) => setEvents((s) => [...s, { ...e, id: uid() }]),
      updateEvent: (e) => setEvents((s) => s.map((x) => (x.id === e.id ? e : x))),
      removeEvent: (id) => setEvents((s) => s.filter((x) => x.id !== id)),
      toggleEventDone: (id) =>
        setEvents((s) => s.map((x) => (x.id === id ? { ...x, done: !x.done } : x))),
      addStockItem: (item) => setStockItems((s) => [{ ...item, id: uid() }, ...s]),
      updateStockItem: (item) => setStockItems((s) => s.map((x) => (x.id === item.id ? item : x))),
      removeStockItem: (id) => setStockItems((s) => s.filter((x) => x.id !== id)),
      addAccount: (account) => setAccounts((s) => [{ ...account, id: uid() }, ...s]),
      updateAccount: (account) => setAccounts((s) => s.map((x) => (x.id === account.id ? account : x))),
      removeAccount: (id) => setAccounts((s) => s.filter((x) => x.id !== id)),
      markAccountPaid: (id) =>
        setAccounts((s) => s.map((x) => (x.id === id ? { ...x, status: "pago" } : x))),
      addTask: (task) => setTasks((s) => [{ ...task, id: uid() }, ...s]),
      updateTask: (task) => setTasks((s) => s.map((x) => (x.id === task.id ? task : x))),
      removeTask: (id) => setTasks((s) => s.filter((x) => x.id !== id)),
      addSanitaryRecord: (record) => setSanitaryRecords((s) => [{ ...record, id: uid() }, ...s]),
      updateSanitaryRecord: (record) =>
        setSanitaryRecords((s) => s.map((x) => (x.id === record.id ? record : x))),
      removeSanitaryRecord: (id) => setSanitaryRecords((s) => s.filter((x) => x.id !== id)),
      addCropManagementRecord: (record) =>
        setCropManagementRecords((s) => [{ ...record, id: uid() }, ...s]),
      updateCropManagementRecord: (record) =>
        setCropManagementRecords((s) => s.map((x) => (x.id === record.id ? record : x))),
      removeCropManagementRecord: (id) =>
        setCropManagementRecords((s) => s.filter((x) => x.id !== id)),
    }),
    [properties, crops, livestock, transactions, events, stockItems, accounts, tasks, sanitaryRecords, cropManagementRecords],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFarm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFarm must be used within FarmProvider");
  return ctx;
}

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtNum = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export const fmtDate = (iso: string) => formatISODateBR(iso);
