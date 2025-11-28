

import React, { useState, useEffect } from 'react';
import { AppConfig, ChecklistConfigItem } from '../types';
import { getConfig, saveConfig, resetConfig } from '../services/dataService';
import { Save, Trash2, Plus, RotateCcw, Edit2, Check, X, ListChecks, Loader2 } from 'lucide-react';

export const ChecklistManager: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'bus' | 'tram'>('bus');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChecklistConfigItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Item State
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Geral');
  const [newItemDescription, setNewItemDescription] = useState('');

  useEffect(() => {
    getConfig().then(data => setConfig(data));
  }, []);

  if (!config) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-yellow-500" /></div>;

  const currentList = activeTab === 'bus' ? config.busChecklist : config.tramChecklist;

  const handleSave = async () => {
    setIsSaving(true);
    await saveConfig(config);
    setIsSaving(false);
    alert('Configurações guardadas na base de dados!');
  };

  const handleReset = async () => {
    if (window.confirm('Isto irá repor a lista original na base de dados. Confirma?')) {
      setIsSaving(true);
      const defaults = await resetConfig();
      setConfig(defaults);
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apagar este item?')) {
      const newList = currentList.filter(item => item.id !== id);
      updateConfigList(newList);
    }
  };

  const handleStartEdit = (item: ChecklistConfigItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const newList = currentList.map(item => item.id === editForm.id ? editForm : item);
    updateConfigList(newList);
    setEditingId(null);
    setEditForm(null);
  };

  const handleAddItem = () => {
    if (!newItemLabel.trim()) return;
    
    const newItem: ChecklistConfigItem = {
      id: crypto.randomUUID(),
      label: newItemLabel,
      category: newItemCategory,
      description: newItemDescription
    };

    const newList = [...currentList, newItem];
    updateConfigList(newList);
    setNewItemLabel('');
    setNewItemDescription('');
  };

  const updateConfigList = (newList: ChecklistConfigItem[]) => {
    setConfig(prev => {
        if(!prev) return null;
        return {
            ...prev,
            [activeTab === 'bus' ? 'busChecklist' : 'tramChecklist']: newList
        }
    });
  };

  const categories = ["Segurança", "Mecânica", "Interior", "Exterior", "Limpeza", "Elétrica", "Pneus", "Outros"];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-20 md:mb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <ListChecks className="w-6 h-6 mr-2 text-yellow-500" />
          Configuração Checklist
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
           <button
            onClick={handleReset}
            className="flex-1 md:flex-none flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-gray-200 hover:border-red-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Restaurar</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 shadow-sm transition-colors disabled:opacity-50 font-medium"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-0 mb-6 border rounded-lg overflow-hidden bg-gray-50 p-1">
        <button onClick={() => setActiveTab('bus')} className={`flex-1 py-2 px-4 font-medium text-sm transition-all rounded-md ${activeTab === 'bus' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Autocarros</button>
        <button onClick={() => setActiveTab('tram')} className={`flex-1 py-2 px-4 font-medium text-sm transition-all rounded-md ${activeTab === 'tram' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Elétricos</button>
      </div>

      {/* Add New Item */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Adicionar Novo Item</h3>
        <div className="flex flex-col lg:flex-row gap-3 items-end">
            <div className="w-full lg:w-1/4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="w-full lg:w-1/3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Item / Pergunta</label>
                <input type="text" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} placeholder="Ex: Verificar extintor" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
            <div className="w-full lg:w-1/3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Instruções / Critérios (Opcional)</label>
                <input type="text" value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} placeholder="Ex: Validade e pressão" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
            <button onClick={handleAddItem} className="w-full lg:w-auto bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center font-medium"><Plus className="w-4 h-4 mr-1" /> Adicionar</button>
        </div>
      </div>

      {/* Desktop List (Table) */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">Item / Pergunta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">Instruções</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {editingId === item.id && editForm ? (
                  <>
                    <td className="px-6 py-4"><input className="w-full p-1 border rounded text-sm" value={editForm.category} list="categories" onChange={e => setEditForm({...editForm, category: e.target.value})} /></td>
                    <td className="px-6 py-4"><input className="w-full p-1 border rounded text-sm" value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} /></td>
                    <td className="px-6 py-4"><input className="w-full p-1 border rounded text-sm" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Instruções..." /></td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={handleSaveEdit} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check className="w-4 h-4"/></button>
                        <button onClick={handleCancelEdit} className="text-gray-500 hover:bg-gray-100 p-1 rounded"><X className="w-4 h-4"/></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium"><span className="bg-gray-100 px-2 py-1 rounded-md text-xs border border-gray-200">{item.category}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.label}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                      <button onClick={() => handleStartEdit(item)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile List (Cards) */}
      <div className="md:hidden space-y-3">
        {currentList.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative">
             {editingId === item.id && editForm ? (
                 <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500">Categoria</label>
                        <select className="w-full p-2 border rounded text-base bg-white" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Item</label>
                        <input className="w-full p-2 border rounded text-base" value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Instruções</label>
                        <input className="w-full p-2 border rounded text-base" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                         <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white p-2 rounded text-sm font-medium">Guardar</button>
                         <button onClick={handleCancelEdit} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded text-sm font-medium">Cancelar</button>
                    </div>
                 </div>
             ) : (
                 <>
                    <div className="pr-16">
                        <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-600 mb-1">{item.category}</span>
                        <p className="text-gray-900 font-medium">{item.label}</p>
                        {item.description && <p className="text-gray-500 text-xs mt-1 italic">{item.description}</p>}
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                         <button onClick={() => handleStartEdit(item)} className="text-blue-600 p-2 bg-blue-50 rounded-full"><Edit2 className="w-4 h-4" /></button>
                         <button onClick={() => handleDelete(item.id)} className="text-red-600 p-2 bg-red-50 rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};