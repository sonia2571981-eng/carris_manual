import { Vehicle, InspectionRecord, AppConfig } from "../types";
import { DEFAULT_VEHICLES, DEFAULT_CONFIG } from "../constants";
import * as XLSX from 'xlsx';
import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore';

const COLLECTIONS = {
  VEHICLES: 'vehicles',
  INSPECTIONS: 'inspections',
  CONFIG: 'config'
};

const CONFIG_DOC_ID = 'main_settings';

// --- Helpers ---

export const isFirebaseReady = () => !!db;

// Gerador de UUID compatível com todos os browsers/telemóveis
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback se falhar
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- Vehicles ---

export const getVehicles = async (): Promise<Vehicle[]> => {
  if (!isFirebaseReady()) {
    const stored = localStorage.getItem('carris_vehicles');
    return stored ? JSON.parse(stored) : DEFAULT_VEHICLES;
  }

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.VEHICLES));
    if (querySnapshot.empty) {
      // Se vazio, inicializa com defaults
      await saveVehicles(DEFAULT_VEHICLES);
      return DEFAULT_VEHICLES;
    }
    return querySnapshot.docs.map(doc => doc.data() as Vehicle);
  } catch (error) {
    console.error("Erro ao buscar veículos:", error);
    return DEFAULT_VEHICLES;
  }
};

export const saveVehicles = async (vehicles: Vehicle[]) => {
  if (!isFirebaseReady()) {
    localStorage.setItem('carris_vehicles', JSON.stringify(vehicles));
    return;
  }

  try {
    const promises = vehicles.map(v => 
      setDoc(doc(db, COLLECTIONS.VEHICLES, v.fleetNumber), v)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error("Erro ao salvar veículos:", error);
  }
};

export const getVehicleByFleet = async (fleetNumber: string): Promise<Vehicle | undefined> => {
  if (!isFirebaseReady()) {
    const vehicles = JSON.parse(localStorage.getItem('carris_vehicles') || JSON.stringify(DEFAULT_VEHICLES));
    return vehicles.find((v: Vehicle) => v.fleetNumber === fleetNumber);
  }

  try {
    const docRef = doc(db, COLLECTIONS.VEHICLES, fleetNumber);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Vehicle;
    }
  } catch (error) {
    console.error("Erro ao buscar veículo:", error);
  }
  return undefined;
};

// --- Config ---

export const getConfig = async (): Promise<AppConfig> => {
  if (!isFirebaseReady()) {
    const stored = localStorage.getItem('carris_config');
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  }

  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppConfig;
    } else {
      await setDoc(docRef, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error("Erro config:", error);
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = async (config: AppConfig) => {
  if (!isFirebaseReady()) {
    localStorage.setItem('carris_config', JSON.stringify(config));
    return;
  }
  await setDoc(doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID), config);
};

export const resetConfig = async (): Promise<AppConfig> => {
  await saveConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
};

// --- Inspections ---

export const getInspections = async (): Promise<InspectionRecord[]> => {
  if (!isFirebaseReady()) {
    const stored = localStorage.getItem('carris_inspections');
    return stored ? JSON.parse(stored) : [];
  }

  try {
    const q = query(collection(db, COLLECTIONS.INSPECTIONS), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as InspectionRecord);
  } catch (error) {
    console.error("Erro ao buscar inspeções:", error);
    return [];
  }
};

export const saveInspection = async (record: InspectionRecord) => {
  if (!isFirebaseReady()) {
    const current = JSON.parse(localStorage.getItem('carris_inspections') || '[]');
    const updated = [record, ...current];
    localStorage.setItem('carris_inspections', JSON.stringify(updated));
    return;
  }

  try {
    // 1. LIMPEZA DE DADOS (CRÍTICO): Remover campos undefined que bloqueiam o Firebase
    // O JSON.stringify remove automaticamente chaves com valor undefined
    const cleanRecord = JSON.parse(JSON.stringify(record));

    const inspectionRef = doc(db, COLLECTIONS.INSPECTIONS, cleanRecord.id);
    const vehicleRef = doc(db, COLLECTIONS.VEHICLES, cleanRecord.vehicle.fleetNumber);

    // 2. PARALELISMO: Enviar inspeção e atualizar veículo ao mesmo tempo
    const p1 = setDoc(inspectionRef, cleanRecord);
    
    // Atualizar data da última inspeção no veículo (merge para não apagar outros dados)
    // Se o veículo não existir na DB (ex: só no excel local), o merge cria-o.
    const p2 = setDoc(vehicleRef, {
      lastInspectionDate: cleanRecord.date
    }, { merge: true });

    await Promise.all([p1, p2]);

  } catch (error) {
    console.error("Erro ao salvar inspeção:", error);
    throw error;
  }
};

export const deleteInspection = async (id: string) => {
  if (!isFirebaseReady()) {
    const current = JSON.parse(localStorage.getItem('carris_inspections') || '[]');
    const updated = current.filter((i: InspectionRecord) => i.id !== id);
    localStorage.setItem('carris_inspections', JSON.stringify(updated));
    return;
  }

  try {
    await deleteDoc(doc(db, COLLECTIONS.INSPECTIONS, id));
    console.log("Documento eliminado com sucesso:", id);
  } catch (error) {
    console.error("Erro ao apagar inspeção:", error);
    throw error;
  }
};

// --- Excel Export ---
export const exportInspectionsToExcel = (inspections: InspectionRecord[]) => {
  if (!inspections || inspections.length === 0) {
    alert("Sem dados para exportar.");
    return;
  }

  const flatData = inspections.map(ins => {
    const row: any = {
      ID: ins.id,
      Data: new Date(ins.date).toLocaleString(),
      Inspetor: ins.inspectorName,
      Frota: ins.vehicle.fleetNumber,
      Matricula: ins.vehicle.licensePlate,
      Tipo: ins.vehicle.type,
      Estacao: ins.vehicle.station,
      ObsGerais: ins.overallComments || ''
    };

    ins.results.forEach(res => {
      row[`${res.label} (Status)`] = res.status;
      if (res.notes) {
        row[`${res.label} (Obs)`] = res.notes;
      }
    });

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(flatData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inspeções");
  XLSX.writeFile(wb, `CARRIS_Inspecoes_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const parseVehicleExcel = async (file: File): Promise<Vehicle[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        const vehicles: Vehicle[] = jsonData.map(row => ({
          fleetNumber: String(row.fleetNumber || row['Nº Frota'] || ''),
          licensePlate: String(row.licensePlate || row['Matrícula'] || ''),
          type: (row.type || row['Tipo'] || 'Autocarro') as any,
          station: String(row.station || row['Estação'] || ''),
          model: String(row.model || row['Modelo'] || ''),
          lastInspectionDate: ''
        })).filter(v => v.fleetNumber);

        resolve(vehicles);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};