

import React, { useState, useEffect } from 'react';
import { Vehicle, ChecklistItemResult, InspectionStatus, AppConfig, InspectionRecord, VehicleType } from '../types';
import { getVehicleByFleet, saveInspection, getConfig } from '../services/dataService';
import { Search, CheckCircle, Save, Loader2, ArrowLeft } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export const InspectionForm: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [inspectorName, setInspectorName] = useState('');
  const [fleetInput, setFleetInput] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [checklistResults, setChecklistResults] = useState<ChecklistItemResult[]>([]);
  const [overallComments, setOverallComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);

  const [config, setConfig] = useState<AppConfig | null>(null);

  // Carregar configuração da checklist
  useEffect(() => {
    getConfig().then(cfg => setConfig(cfg));
  }, []);

  const handleLookup = async () => {
    if (!fleetInput) return;
    setError('');
    setLoadingLookup(true);
    try {
      const v = await getVehicleByFleet(fleetInput);
      if (v) {
        setVehicle(v);
        initializeChecklist(v.type);
      } else {
        setVehicle(null);
        setError('Veículo não encontrado.');
      }
    } finally {
      setLoadingLookup(false);
    }
  };

  const initializeChecklist = (type: VehicleType) => {
    if (!config) return;
    // Se for Autocarro usa a lista de Bus, caso contrário (qualquer tipo de Elétrico) usa a lista de Tram
    const items = type === VehicleType.BUS ? config.busChecklist : config.tramChecklist;
    const initialResults: ChecklistItemResult[] = items.map(item => ({
      id: item.id,
      category: item.category,
      label: item.label,
      description: item.description, // Copiar a descrição para o registo
      status: InspectionStatus.NA, // Alterado: Por defeito N/A
      notes: ''
    }));
    setChecklistResults(initialResults);
  };

  const updateResult = (id: string, status: InspectionStatus) => {
    setChecklistResults(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateNote = (id: string, note: string) => {
    setChecklistResults(prev => prev.map(r => r.id === id ? { ...r, notes: note } : r));
  };

  const handleSubmit = async () => {
    if (!inspectorName) {
      alert("Por favor, identifique o inspetor.");
      return;
    }
    if (!vehicle) return;

    setIsSubmitting(true);

    const record: InspectionRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      inspectorName,
      vehicle,
      results: checklistResults,
      overallComments
    };

    await saveInspection(record);
    
    setIsSubmitting(false);
    onSuccess();
  };

  if (!config) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const itemsByCategory = checklistResults.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItemResult[]>);

  return (
    <div className="max-w-4xl mx-auto md:p-6 bg-white md:rounded-xl md:shadow-lg rounded-none shadow-none pb-20">
      
      {/* Mobile Header with Back Button */}
      <div className="md:hidden flex items-center p-4 border-b">
         <button onClick={onCancel} className="mr-3 text-gray-500"><ArrowLeft className="w-6 h-6"/></button>
         <h2 className="text-lg font-bold text-gray-800">Nova Inspeção</h2>
      </div>

      <div className="p-4 md:p-0">
        <h2 className="hidden md:flex text-2xl font-bold text-gray-800 mb-6 items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-yellow-500" />
            Nova Inspeção
        </h2>

        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 md:p-4 md:bg-gray-50 md:rounded-lg md:border md:border-gray-200">
            <div>
            <label className="block text-sm font-medium text-gray-700">Nº de Ordem / Inspetor</label>
            <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-3 md:p-2 border text-base text-gray-900 bg-white"
                placeholder="Coloque o seu nº de ordem"
            />
            </div>
            <div className="hidden md:block">
            <label className="block text-sm font-medium text-gray-700">Data Atual</label>
            <input
                type="text"
                disabled
                value={new Date().toLocaleDateString('pt-PT')}
                className="mt-1 block w-full bg-gray-100 border-transparent rounded-md p-2 text-gray-600 cursor-not-allowed"
            />
            </div>
        </div>

        {/* Vehicle Lookup */}
        <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Frota</label>
            <div className="flex gap-2">
            <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={fleetInput}
                onChange={(e) => setFleetInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                className="flex-1 rounded-md border-gray-300 shadow-sm border p-3 md:p-2 focus:ring-yellow-500 focus:border-yellow-500 text-lg tracking-widest font-mono text-gray-900 bg-white"
                placeholder="Ex: 2401"
            />
            <button
                onClick={handleLookup}
                disabled={loadingLookup}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md flex items-center transition-colors disabled:opacity-50 font-medium"
            >
                {loadingLookup ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5 md:mr-2" />}
                <span className="hidden md:inline">Pesquisar</span>
            </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2 font-medium bg-red-50 p-2 rounded">{error}</p>}
        </div>

        {/* Vehicle Details & Checklist */}
        {vehicle && (
            <div className="animate-fade-in">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                <span className="text-xs text-blue-500 font-semibold uppercase">Matrícula</span>
                <p className="font-medium text-gray-800 text-sm md:text-base">{vehicle.licensePlate}</p>
                </div>
                <div>
                <span className="text-xs text-blue-500 font-semibold uppercase">Tipo</span>
                <p className="font-medium text-gray-800 text-sm md:text-base">{vehicle.type}</p>
                </div>
                <div>
                <span className="text-xs text-blue-500 font-semibold uppercase">Estação</span>
                <p className="font-medium text-gray-800 text-sm md:text-base">{vehicle.station}</p>
                </div>
                <div>
                <span className="text-xs text-blue-500 font-semibold uppercase">Última</span>
                <p className="font-medium text-gray-800 text-sm md:text-base">{vehicle.lastInspectionDate || '-'}</p>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Checklist: {vehicle.type}</h3>

            <div className="space-y-6">
                {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="bg-white border md:border-gray-200 rounded-lg overflow-hidden shadow-sm md:shadow-none">
                    <div className="bg-gray-100 px-4 py-3 font-bold text-gray-700 border-b">
                    {category}
                    </div>
                    <div className="divide-y">
                    {(items as ChecklistItemResult[]).map((item) => (
                        <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-start gap-3 md:gap-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 text-base">{item.label}</p>
                            {/* Descrição / Instruções */}
                            {item.description && (
                                <p className="text-sm text-gray-500 mt-1 italic flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
                                    {item.description}
                                </p>
                            )}
                            
                            {item.status === InspectionStatus.NOK && (
                            <input
                                type="text"
                                placeholder="Descreva a avaria..."
                                value={item.notes || ''}
                                onChange={(e) => updateNote(item.id, e.target.value)}
                                className="mt-2 w-full text-base p-2 border rounded border-red-200 focus:border-red-500 outline-none bg-red-50"
                            />
                            )}
                        </div>
                        {/* Touch-optimized Buttons */}
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <button 
                                onClick={() => updateResult(item.id, InspectionStatus.OK)} 
                                className={`flex-1 md:flex-none px-4 py-3 md:py-1 rounded-md text-sm font-bold border transition-all shadow-sm ${item.status === InspectionStatus.OK ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300'}`}
                            >
                                OK
                            </button>
                            <button 
                                onClick={() => updateResult(item.id, InspectionStatus.NOK)} 
                                className={`flex-1 md:flex-none px-4 py-3 md:py-1 rounded-md text-sm font-bold border transition-all shadow-sm ${item.status === InspectionStatus.NOK ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-300'}`}
                            >
                                NOK
                            </button>
                            <button 
                                onClick={() => updateResult(item.id, InspectionStatus.NA)} 
                                className={`flex-1 md:flex-none px-2 py-3 md:py-1 rounded-md text-sm font-medium border transition-all ${item.status === InspectionStatus.NA ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-white text-gray-400 border-gray-200'}`}
                            >
                                N/A
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                ))}
            </div>

            <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações Gerais</label>
                <textarea
                rows={3}
                className="w-full border rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm text-base"
                placeholder="Outros comentários..."
                value={overallComments}
                onChange={(e) => setOverallComments(e.target.value)}
                />
            </div>

            <div className="mt-8 flex flex-col-reverse md:flex-row justify-end gap-3 pb-8 md:pb-0">
                <button onClick={onCancel} className="w-full md:w-auto px-6 py-3 md:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Cancelar</button>
                <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-3 md:py-2 bg-yellow-500 text-white rounded-md font-bold hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center shadow-md"
                >
                {isSubmitting ? (
                    <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Guardando...
                    </>
                ) : (
                    <>
                    <Save className="w-5 h-5 mr-2" />
                    Submeter
                    </>
                )}
                </button>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};