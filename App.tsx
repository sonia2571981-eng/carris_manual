import React, { useState, useEffect } from 'react';
import { InspectionForm } from './components/InspectionForm';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
import { ChecklistManager } from './components/ChecklistManager';
import { getInspections, exportInspectionsToExcel, deleteInspection } from './services/dataService';
import { InspectionRecord, VehicleType, InspectionStatus, ChecklistItemResult } from './types';
import { ClipboardList, BarChart2, Settings, Download, Bus, Train, Filter, X, Loader2, Calendar, User, Eye, CheckCircle, AlertCircle, MinusCircle, Lock, Unlock, ShieldCheck, Trash2 } from 'lucide-react';

const ADMIN_PIN = "1234"; // Código de acesso para Administrador

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inspect' | 'dashboard' | 'fleet' | 'config'>('inspect');
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pendingTab, setPendingTab] = useState<'fleet' | 'config' | null>(null);
  const [loginError, setLoginError] = useState(false);

  // Filter State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFleet, setFilterFleet] = useState('');
  const [filterStation, setFilterStation] = useState('');

  // Modal State
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);

  // Load Data on Mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInspections();
      setInspections(data);
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionSuccess = () => {
    setShowForm(false);
    loadData(); // Refresh data from DB
    setActiveTab('dashboard');
  };

  const handleExport = () => {
    exportInspectionsToExcel(inspections);
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('all');
    setFilterFleet('');
    setFilterStation('');
  };

  // Protected Navigation Handler
  const handleTabChange = (tab: 'inspect' | 'dashboard' | 'fleet' | 'config') => {
    // Abas livres
    if (tab === 'inspect' || tab === 'dashboard') {
      setActiveTab(tab);
      setShowForm(false);
      return;
    }

    // Abas protegidas
    if (isAdmin) {
      setActiveTab(tab);
    } else {
      setPendingTab(tab);
      setShowAdminLogin(true);
      setAdminPinInput('');
      setLoginError(false);
    }
  };

  const verifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === ADMIN_PIN) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
    } else {
      setLoginError(true);
      setAdminPinInput('');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab('inspect');
  };

  const handleDeleteInspection = async (id: string) => {
    if (!id) return;

    // Se não for admin, pede o PIN para confirmar a eliminação
    if (!isAdmin) {
      const pin = window.prompt("Ação destrutiva. Insira o PIN de Administrador para confirmar:");
      if (pin !== ADMIN_PIN) {
        alert("PIN incorreto. Ação cancelada.");
        return;
      }
    }

    if (window.confirm("Tem a certeza que deseja eliminar este registo permanentemente? Esta ação não pode ser desfeita.")) {
      try {
        setLoading(true);
        await deleteInspection(id);
        setSelectedInspection(null); // Fecha o modal
        await loadData(); // Recarrega a lista
        alert("Inspeção eliminada.");
      } catch (error) {
        console.error(error);
        alert("Erro ao eliminar a inspeção.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Obter lista única de estações presentes nas inspeções para o filtro
  const uniqueStations = Array.from(new Set(inspections.map(ins => ins.vehicle.station))).filter(Boolean).sort();

  // Filter Logic
  const filteredInspections = inspections.filter(ins => {
    // Filter by Type
    if (filterType !== 'all' && ins.vehicle.type !== filterType) return false;

    // Filter by Fleet Number
    if (filterFleet && !ins.vehicle.fleetNumber.toLowerCase().includes(filterFleet.toLowerCase())) return false;

    // Filter by Station
    if (filterStation && !ins.vehicle.station.toLowerCase().includes(filterStation.toLowerCase())) return false;

    // Filter by Date
    if (!filterStartDate && !filterEndDate) return true;
    const insDate = new Date(ins.date);
    const insTime = new Date(insDate.getFullYear(), insDate.getMonth(), insDate.getDate()).getTime();

    if (filterStartDate) {
      const startParts = filterStartDate.split('-');
      const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2])).getTime();
      if (insTime < startDate) return false;
    }

    if (filterEndDate) {
      const endParts = filterEndDate.split('-');
      const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2])).getTime();
      if (insTime > endDate) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">A carregar base de dados...</p>
        </div>
      </div>
    );
  }

  // Helper para verificar se é Elétrico - AGORA ABRANGENTE
  const isTram = (type: string) => {
    const t = type.toLowerCase();
    return t.includes('elét') || t.includes('elet') || t.includes('tram') || t.includes('remodelado') || t.includes('articulado');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-24 md:pb-8">
      {/* Navbar Desktop / Header Mobile */}
      <header className="bg-yellow-500 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm">
                <span className="font-bold text-lg md:text-xl tracking-tight text-gray-900">CARRIS<span className="text-yellow-500">Inspect</span></span>
              </div>
              {/* Desktop Nav */}
              <nav className="ml-8 hidden md:flex space-x-1">
                <button onClick={() => handleTabChange('inspect')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'inspect' ? 'bg-yellow-600 text-white' : 'text-yellow-900 hover:bg-yellow-400'}`}>Inspeções</button>
                <button onClick={() => handleTabChange('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-yellow-600 text-white' : 'text-yellow-900 hover:bg-yellow-400'}`}>Dashboard</button>
                
                <div className="h-6 w-px bg-yellow-600/30 mx-2 self-center"></div>

                <button onClick={() => handleTabChange('fleet')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'fleet' ? 'bg-yellow-600 text-white' : 'text-yellow-900 hover:bg-yellow-400'}`}>
                   {!isAdmin && <Lock className="w-3 h-3 opacity-70" />}
                   Frota
                </button>
                <button onClick={() => handleTabChange('config')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'config' ? 'bg-yellow-600 text-white' : 'text-yellow-900 hover:bg-yellow-400'}`}>
                   {!isAdmin && <Lock className="w-3 h-3 opacity-70" />}
                   Configurações
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-2">
               {isAdmin && (
                 <button onClick={handleLogout} className="bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-900 px-3 py-1.5 rounded-md text-xs font-bold flex items-center mr-2 transition-colors border border-yellow-600/20">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Admin Ativo
                 </button>
               )}
               <button onClick={handleExport} className="bg-white text-yellow-600 hover:bg-gray-50 px-3 py-2 rounded-md text-xs md:text-sm font-medium shadow-sm flex items-center">
                 <Download className="w-4 h-4 mr-2" />
                 <span className="hidden md:inline">Exportar Relatório</span>
                 <span className="md:hidden">Exportar</span>
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        
        {activeTab === 'inspect' && (
          <div>
            {!showForm ? (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">Histórico de Inspeções</h1>
                  <button onClick={() => setShowForm(true)} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-3 md:py-2 rounded-md shadow-md flex items-center justify-center transition-transform active:scale-95">
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Nova Inspeção
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex items-center text-gray-500 text-sm font-medium mr-2">
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="hidden md:inline">Filtros:</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
                    {/* Fleet Filter */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nº Frota</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="Ex: 2401"
                        value={filterFleet} 
                        onChange={(e) => setFilterFleet(e.target.value)} 
                        className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" 
                      />
                    </div>

                    {/* Tipo Filter */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tipologia</label>
                      <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                      >
                        <option value="all">Todos</option>
                        <option value={VehicleType.BUS}>Autocarro</option>
                        <option value={VehicleType.TRAM_REMODELADO}>Elétrico (Remodelado)</option>
                        <option value={VehicleType.TRAM_ARTICULADO}>Elétrico (Articulado)</option>
                      </select>
                    </div>

                    {/* Station Filter - DROPDOWN */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Estação</label>
                      <select
                        value={filterStation}
                        onChange={(e) => setFilterStation(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                      >
                        <option value="">Todas</option>
                        {uniqueStations.map(station => (
                          <option key={station} value={station}>{station}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Filters */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">De:</label>
                      <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Até:</label>
                      <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
                    </div>
                  </div>

                  {(filterStartDate || filterEndDate || filterType !== 'all' || filterFleet || filterStation) && (
                    <button onClick={clearFilters} className="text-red-500 hover:text-red-700 text-sm flex items-center px-4 py-2 rounded hover:bg-red-50 transition-colors md:ml-auto w-full md:w-auto justify-center border border-transparent md:border-red-100">
                      <X className="w-4 h-4 mr-1" />
                      Limpar
                    </button>
                  )}
                </div>

                {/* Inspections List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInspections.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center bg-white rounded-lg shadow-sm">
                            <ClipboardList className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Nenhuma inspeção encontrada.</p>
                        </div>
                    ) : (
                        filteredInspections.map((ins) => {
                          const hasIssues = ins.results.some(r => r.status === InspectionStatus.NOK);
                          return (
                            <div 
                              key={ins.id} 
                              onClick={() => setSelectedInspection(ins)}
                              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer relative group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center">
                                    <div className={`p-2 rounded-lg mr-3 ${isTram(ins.vehicle.type) ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {isTram(ins.vehicle.type) ? <Train className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
                                    </div>
                                    <div>
                                      <span className="block text-xl font-bold text-gray-800">#{ins.vehicle.fleetNumber}</span>
                                      <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{ins.vehicle.type}</span>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${hasIssues ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {hasIssues ? 'Com Avarias' : 'Aprovado'}
                                  </div>
                                </div>
                                
                                <div className="border-t border-gray-100 pt-3 space-y-2">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                    {new Date(ins.date).toLocaleDateString()} <span className="text-gray-400 text-xs ml-1">({new Date(ins.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="truncate">{ins.inspectorName}</span>
                                  </div>
                                </div>
                                
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-5 h-5 text-yellow-500" />
                                </div>
                            </div>
                          );
                        })
                    )}
                </div>
              </div>
            ) : (
              <InspectionForm onCancel={() => setShowForm(false)} onSuccess={handleInspectionSuccess} />
            )}
          </div>
        )}

        {/* Modal de Detalhes da Inspeção */}
        {selectedInspection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-sm">#{selectedInspection.vehicle.fleetNumber}</span>
                    <span className="text-gray-500 text-sm font-normal">| {new Date(selectedInspection.date).toLocaleString()}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Inspetor: {selectedInspection.inspectorName}</p>
                </div>
                <button 
                  onClick={() => setSelectedInspection(null)}
                  className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                {/* Status Banner */}
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${selectedInspection.results.some(r => r.status === InspectionStatus.NOK) ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-green-50 text-green-800 border border-green-100'}`}>
                   {selectedInspection.results.some(r => r.status === InspectionStatus.NOK) ? (
                     <>
                      <AlertCircle className="w-6 h-6" />
                      <div>
                        <span className="font-bold block">Inspeção Reprovada</span>
                        <span className="text-sm opacity-90">Foram detetadas anomalias neste veículo.</span>
                      </div>
                     </>
                   ) : (
                     <>
                      <CheckCircle className="w-6 h-6" />
                      <div>
                        <span className="font-bold block">Inspeção Aprovada</span>
                        <span className="text-sm opacity-90">Veículo pronto a circular.</span>
                      </div>
                     </>
                   )}
                </div>

                {/* Overall Comments */}
                {selectedInspection.overallComments && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Observações Gerais</h4>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-700 text-sm italic border border-gray-100">"{selectedInspection.overallComments}"</p>
                  </div>
                )}

                {/* Results List */}
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 sticky top-0 bg-white py-2">Detalhes da Verificação</h4>
                <div className="space-y-4">
                   {/* Group by category logic for display */}
                   {Object.entries(selectedInspection.results.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                   }, {} as Record<string, ChecklistItemResult[]>)).map(([category, items]) => (
                     <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                       <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 uppercase">
                         {category}
                       </div>
                       <div className="divide-y divide-gray-100">
                         {(items as ChecklistItemResult[]).map(item => (
                           <div key={item.id} className="p-3 flex items-start justify-between gap-4">
                             <div className="flex-1">
                               <span className="text-sm font-medium text-gray-800">{item.label}</span>
                               {item.notes && (
                                 <p className="text-xs text-red-600 mt-1 bg-red-50 p-1.5 rounded">Nota: {item.notes}</p>
                               )}
                             </div>
                             <div>
                               {item.status === InspectionStatus.OK && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1"/> OK</span>}
                               {item.status === InspectionStatus.NOK && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1"/> NOK</span>}
                               {item.status === InspectionStatus.NA && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-500"><MinusCircle className="w-3 h-3 mr-1"/> N/A</span>}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteInspection(selectedInspection.id); }}
                  type="button"
                  className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 flex items-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </button>
                <button 
                  onClick={() => setSelectedInspection(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Login Admin */}
        {showAdminLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-yellow-500 p-4 flex justify-between items-center">
                 <h3 className="text-white font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Acesso Restrito
                 </h3>
                 <button onClick={() => { setShowAdminLogin(false); setAdminPinInput(''); }} className="text-white hover:bg-white/20 p-1 rounded"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">Esta área é reservada para administração da frota e configurações. Introduza o PIN de acesso.</p>
                <form onSubmit={verifyPin}>
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código PIN</label>
                     <input 
                      type="password" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={adminPinInput}
                      onChange={e => setAdminPinInput(e.target.value)}
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono border-2 border-gray-200 rounded-lg p-2 focus:border-yellow-500 focus:ring-yellow-500 outline-none"
                      placeholder="••••"
                      autoFocus
                     />
                     {loginError && <p className="text-red-500 text-xs mt-2 font-bold text-center">Código incorreto. Tente novamente.</p>}
                  </div>
                  <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center">
                     <Unlock className="w-4 h-4 mr-2" />
                     Desbloquear
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
             <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Dashboard</h1>
             <Dashboard inspections={inspections} />
          </div>
        )}

        {/* ADMIN ONLY TABS */}
        {activeTab === 'fleet' && isAdmin && (
          <div className="animate-fade-in">
            <VehicleList />
          </div>
        )}

        {activeTab === 'config' && isAdmin && (
          <div className="animate-fade-in">
            <ChecklistManager />
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation (Fixed) */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         <button onClick={() => handleTabChange('inspect')} className={`flex flex-col items-center ${activeTab === 'inspect' ? 'text-yellow-600' : 'text-gray-400'}`}>
           <ClipboardList className="w-6 h-6" />
           <span className="text-[10px] mt-1 font-medium">Inspeções</span>
         </button>
         <button onClick={() => handleTabChange('dashboard')} className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-yellow-600' : 'text-gray-400'}`}>
           <BarChart2 className="w-6 h-6" />
           <span className="text-[10px] mt-1 font-medium">Dash</span>
         </button>
         <button onClick={() => handleTabChange('fleet')} className={`flex flex-col items-center relative ${activeTab === 'fleet' ? 'text-yellow-600' : 'text-gray-400'}`}>
           {!isAdmin && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />}
           <Bus className="w-6 h-6" />
           <span className="text-[10px] mt-1 font-medium">Frota</span>
         </button>
         <button onClick={() => handleTabChange('config')} className={`flex flex-col items-center relative ${activeTab === 'config' ? 'text-yellow-600' : 'text-gray-400'}`}>
           {!isAdmin && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />}
           <Settings className="w-6 h-6" />
           <span className="text-[10px] mt-1 font-medium">Config</span>
         </button>
      </div>
    </div>
  );
};

export default App;