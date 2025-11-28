
import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleType } from '../types';
import { getVehicles, saveVehicles, parseVehicleExcel } from '../services/dataService';
import { Upload, Bus, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    const data = await getVehicles();
    setVehicles(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const newVehicles = await parseVehicleExcel(e.target.files[0]);
        await saveVehicles(newVehicles); // Agora guarda na DB
        setVehicles(newVehicles);
        alert(`Lista atualizada na nuvem! ${newVehicles.length} veículos carregados.`);
      } catch (error) {
        console.error(error);
        alert("Erro ao ler ficheiro Excel. Verifique o formato.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { fleetNumber: "2401", licensePlate: "AA-00-BB", type: "Autocarro", station: "Musgueira", model: "MAN" },
      { fleetNumber: "505", licensePlate: "CC-11-DD", type: "Elétrico (Remodelado)", station: "Santo Amaro", model: "Remodelado" },
      { fleetNumber: "601", licensePlate: "EE-22-FF", type: "Elétrico (Articulado)", station: "Santo Amaro", model: "Articulado" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Veiculos");
    XLSX.writeFile(wb, "Template_Veiculos_CARRIS.xlsx");
  };

  // Helper para verificar se é Elétrico
  const isTram = (type: string) => type === VehicleType.TRAM_REMODELADO || type === VehicleType.TRAM_ARTICULADO;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-20 md:mb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Bus className="w-6 h-6 mr-2 text-yellow-500" />
          Gestão de Frota
        </h2>
        <div className="flex flex-col w-full md:w-auto gap-3">
            <label className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 md:py-2 rounded-md flex items-center justify-center shadow-sm transition-colors font-medium">
                <Upload className="w-4 h-4 mr-2" />
                <span>{isUploading ? 'A enviar...' : 'Importar Excel'}</span>
                <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isUploading} 
                />
            </label>
            <button 
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 underline text-center"
            >
                Baixar Template Excel
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-yellow-500" />
        </div>
      ) : (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Inspeção</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {vehicles.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                Sem veículos registados na base de dados. Importe um ficheiro Excel.
                            </td>
                        </tr>
                    ) : (
                        vehicles.map((v) => (
                        <tr key={v.fleetNumber} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.fleetNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.licensePlate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isTram(v.type) ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {v.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.station}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.lastInspectionDate || '-'}</td>
                        </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {vehicles.length === 0 ? (
                     <div className="text-center p-4 text-gray-500 bg-gray-50 rounded">Sem veículos. Importe um ficheiro Excel.</div>
                ) : (
                    vehicles.map((v) => (
                        <div key={v.fleetNumber} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-lg font-bold text-gray-800">#{v.fleetNumber}</span>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${isTram(v.type) ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {v.type}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div><span className="text-gray-400 text-xs block">Matrícula</span>{v.licensePlate}</div>
                                <div><span className="text-gray-400 text-xs block">Estação</span>{v.station}</div>
                                <div className="col-span-2 pt-2 border-t mt-2">
                                    <span className="text-gray-400 text-xs block">Última Inspeção</span>
                                    {v.lastInspectionDate || 'Nunca'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
      )}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Total: {vehicles.length} veículos
      </div>
    </div>
  );
};
