export type UUID = string;

export interface Property {
  id: UUID;
  name: string;
  location: string;
  totalHa: number;
  cultivableHa: number;
  pastureHa: number;
  freeHa: number;
  notes?: string;
}

export type CropStatus = "planejada" | "em_andamento" | "colhida";

export interface Crop {
  id: UUID;
  culture: string;
  season: string;
  propertyId: UUID;
  field: string;
  hectares: number;
  plantingDate: string;
  harvestForecast: string;
  status: CropStatus;
  expectedYield: number;
  actualYield?: number;
  estimatedCost: number;
  estimatedRevenue: number;
}

export type AnimalSex = "macho" | "femea";
export type AnimalType = "boi" | "vaca" | "bezerro" | "novilha" | "touro";
export type AnimalStatus = "ativo" | "vendido" | "abatido";

export interface Livestock {
  id: UUID;
  tag: string;
  type: AnimalType;
  breed: string;
  sex: AnimalSex;
  ageMonths: number;
  weightKg: number;
  propertyId: UUID;
  status: AnimalStatus;
  purchaseDate: string;
  purchaseValue: number;
  estimatedValue: number;
  notes?: string;
  count?: number;
}

export type TxType = "receita" | "despesa";
export type TxCategory =
  | "sementes"
  | "fertilizantes"
  | "defensivos"
  | "combustivel"
  | "mao_de_obra"
  | "manutencao"
  | "venda_animais"
  | "venda_producao"
  | "vacinacao"
  | "racao";

export interface Transaction {
  id: UUID;
  description: string;
  type: TxType;
  category: TxCategory;
  value: number;
  date: string;
  propertyId?: UUID;
  cropId?: UUID;
  livestockId?: UUID;
}

export const CATEGORY_LABEL: Record<TxCategory, string> = {
  sementes: "Sementes",
  fertilizantes: "Fertilizantes",
  defensivos: "Defensivos",
  combustivel: "Combustível",
  mao_de_obra: "Mão de obra",
  manutencao: "Manutenção",
  venda_animais: "Venda de animais",
  venda_producao: "Venda de produção",
  vacinacao: "Vacinação",
  racao: "Ração",
};

export const CROP_STATUS_LABEL: Record<CropStatus, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  colhida: "Colhida",
};

export const ANIMAL_TYPE_LABEL: Record<AnimalType, string> = {
  boi: "Boi",
  vaca: "Vaca",
  bezerro: "Bezerro",
  novilha: "Novilha",
  touro: "Touro",
};

export type EventCategory =
  | "plantio"
  | "colheita"
  | "adubacao"
  | "pulverizacao"
  | "vacinacao"
  | "pesagem"
  | "manutencao"
  | "pagamento"
  | "recebimento"
  | "tarefa";

export type EventPriority = "baixa" | "media" | "alta";

export interface FarmEvent {
  id: UUID;
  title: string;
  description?: string;
  date: string;
  time?: string;
  category: EventCategory;
  priority: EventPriority;
  propertyId?: UUID;
  cropId?: UUID;
  livestockId?: UUID;
  done?: boolean;
}

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  plantio: "Plantio",
  colheita: "Colheita",
  adubacao: "Adubação",
  pulverizacao: "Pulverização",
  vacinacao: "Vacinação",
  pesagem: "Pesagem",
  manutencao: "Manutenção",
  pagamento: "Pagamento",
  recebimento: "Recebimento",
  tarefa: "Tarefa geral",
};

export const EVENT_PRIORITY_LABEL: Record<EventPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export type StockCategory =
  | "sementes"
  | "fertilizantes"
  | "defensivos"
  | "racao"
  | "vacinas"
  | "combustivel"
  | "ferramentas"
  | "manutencao";

export interface StockItem {
  id: UUID;
  name: string;
  category: StockCategory;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  expiryDate?: string;
  propertyId?: UUID;
  notes?: string;
}

export type StockMovementType = "entrada" | "saida" | "ajuste";

export interface StockMovement {
  id: UUID;
  stockItemId: UUID;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  date: string;
  responsible: string;
  reason: string;
  notes?: string;
}

export const STOCK_MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste de saldo",
};

export const STOCK_CATEGORY_LABEL: Record<StockCategory, string> = {
  sementes: "Sementes",
  fertilizantes: "Fertilizantes",
  defensivos: "Defensivos",
  racao: "Ração",
  vacinas: "Vacinas",
  combustivel: "Combustível",
  ferramentas: "Ferramentas",
  manutencao: "Materiais de manutenção",
};

export type AccountType = "pagar" | "receber";
export type AccountStatus = "pendente" | "pago" | "atrasado";

export interface AccountEntry {
  id: UUID;
  description: string;
  type: AccountType;
  category: string;
  value: number;
  dueDate: string;
  status: AccountStatus;
  propertyId?: UUID;
  notes?: string;
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  pagar: "A pagar",
  receber: "A receber",
};

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
};

export type TaskStatus = "pendente" | "em_andamento" | "concluida";
export type TaskPriority = "baixa" | "media" | "alta";
export type TaskSector = "financeiro" | "lavoura" | "rebanho" | "manutencao" | "estoque";

export interface FarmTask {
  id: UUID;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  propertyId?: UUID;
  sector: TaskSector;
  status: TaskStatus;
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

export const TASK_SECTOR_LABEL: Record<TaskSector, string> = {
  financeiro: "Financeiro",
  lavoura: "Lavoura",
  rebanho: "Rebanho",
  manutencao: "Manutenção",
  estoque: "Estoque",
};

export type SanitaryProcedureType =
  | "vacinacao"
  | "vermifugacao"
  | "tratamento"
  | "exame"
  | "consulta"
  | "suplementacao";

export interface SanitaryRecord {
  id: UUID;
  livestockId: UUID;
  procedure: SanitaryProcedureType;
  date: string;
  product: string;
  responsible: string;
  cost: number;
  notes?: string;
}

export const SANITARY_PROCEDURE_LABEL: Record<SanitaryProcedureType, string> = {
  vacinacao: "Vacinação",
  vermifugacao: "Vermifugação",
  tratamento: "Tratamento",
  exame: "Exame",
  consulta: "Consulta",
  suplementacao: "Suplementação",
};

export type CropManagementType =
  | "adubacao"
  | "irrigacao"
  | "pulverizacao"
  | "preparo_solo"
  | "colheita"
  | "controle_pragas";

export interface CropManagementRecord {
  id: UUID;
  cropId: UUID;
  type: CropManagementType;
  date: string;
  input: string;
  quantity: number;
  cost: number;
  responsible: string;
  notes?: string;
}

export const CROP_MANAGEMENT_LABEL: Record<CropManagementType, string> = {
  adubacao: "Adubação",
  irrigacao: "Irrigação",
  pulverizacao: "Pulverização",
  preparo_solo: "Preparo do solo",
  colheita: "Colheita",
  controle_pragas: "Controle de pragas",
};
