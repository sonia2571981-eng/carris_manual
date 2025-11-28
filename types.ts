

export enum VehicleType {
  BUS = 'Autocarro',
  TRAM_REMODELADO = 'Elétrico (Remodelado)',
  TRAM_ARTICULADO = 'Elétrico (Articulado)'
}

export interface Vehicle {
  fleetNumber: string;
  licensePlate: string;
  type: VehicleType;
  station: string;
  lastInspectionDate?: string;
  model?: string;
}

export enum InspectionStatus {
  OK = 'OK',
  NOK = 'NOK',
  NA = 'N/A'
}

export interface ChecklistItemResult {
  id: string;
  category: string;
  label: string;
  description?: string; // Instruções de como verificar
  status: InspectionStatus;
  notes?: string;
}

export interface InspectionRecord {
  id: string;
  date: string; // ISO String
  inspectorName: string;
  vehicle: Vehicle;
  results: ChecklistItemResult[];
  overallComments?: string;
  aiSummary?: string;
}

export interface ChecklistConfigItem {
  id: string;
  label: string;
  category: string; // e.g., "Exterior", "Interior", "Mecânica", "Limpeza"
  description?: string; // Campo informativo (Instruções)
}

export interface AppConfig {
  busChecklist: ChecklistConfigItem[];
  tramChecklist: ChecklistConfigItem[];
}