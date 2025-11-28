
import React, { useState } from 'react';
import { InspectionRecord, InspectionStatus } from '../types';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { AlertTriangle, CheckCircle, Truck, TrendingUp, MapPin, Filter } from 'lucide-react';

interface Props {
  inspections: InspectionRecord[];
}

export const Dashboard: React.FC<Props> = ({ inspections }) => {
  const [categoryFilterStation, setCategoryFilterStation] = useState('all');

  // Stats Calculation
  const total = inspections.length;
  const issues = inspections.filter(i => i.results.some(r => r.status === InspectionStatus.NOK)).length;
  const clean = total - issues;

  // Colors
  const COLORS = {
    ok: '#22c55e', // Green-500
    nok: '#ef4444', // Red-500
    bar: '#f59e0b', // Yellow-500
    grid: '#e5e7eb' // Gray-200
  };

  // Get Unique Stations for the filter dropdown
  const uniqueStations = Array.from(new Set(inspections.map(i => i.vehicle.station))).filter(Boolean).sort();

  // 1. Data for Pie Chart (Status Overview)
  const statusData = [
    { name: 'Sem Anomalias', value: clean },
    { name: 'Com Avarias', value: issues },
  ];
  const PIE_COLORS = [COLORS.ok, COLORS.nok];

  // 2. Data for Bar Chart (Issues by Category) - WITH STATION FILTER
  const categoryIssues: Record<string, number> = {};
  
  // Filter inspections based on the selected station for this specific chart
  const filteredInspectionsForCategory = categoryFilterStation === 'all' 
    ? inspections 
    : inspections.filter(i => i.vehicle.station === categoryFilterStation);

  filteredInspectionsForCategory.forEach(ins => {
    ins.results.forEach(res => {
      if (res.status === InspectionStatus.NOK) {
        categoryIssues[res.category] = (categoryIssues[res.category] || 0) + 1;
      }
    });
  });

  const barData = Object.keys(categoryIssues).map(key => ({
    name: key,
    issues: categoryIssues[key]
  })).sort((a, b) => b.issues - a.issues); // Sort desc

  // 3. Data for Stacked Bar Chart (Station Performance)
  const stationMap = inspections.reduce((acc, curr) => {
    const station = curr.vehicle.station || 'N/D';
    const hasIssues = curr.results.some(r => r.status === InspectionStatus.NOK);
    
    if (!acc[station]) acc[station] = { name: station, aprovados: 0, avarias: 0 };
    
    if (hasIssues) acc[station].avarias += 1;
    else acc[station].aprovados += 1;
    
    return acc;
  }, {} as Record<string, {name: string, aprovados: number, avarias: number}>);

  const stationData = Object.values(stationMap).sort((a: { aprovados: number; avarias: number }, b: { aprovados: number; avarias: number }) => (b.aprovados + b.avarias) - (a.aprovados + a.avarias));

  // 4. Data for Line Chart (Evolution Over Time)
  const trendMap = inspections.reduce((acc, curr) => {
    // Use ISO string YYYY-MM-DD for sorting keys correctly
    const dateKey = curr.date.split('T')[0]; 
    const hasIssues = curr.results.some(r => r.status === InspectionStatus.NOK);

    if (!acc[dateKey]) {
      acc[dateKey] = { 
        rawDate: dateKey,
        date: new Date(curr.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }), 
        aprovados: 0, 
        avarias: 0 
      };
    }

    if (hasIssues) acc[dateKey].avarias += 1;
    else acc[dateKey].aprovados += 1;

    return acc;
  }, {} as Record<string, any>);

  const trendData = Object.keys(trendMap).sort().map(key => trendMap[key]);

  if (total === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm">
        <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-500">Ainda não existem dados de inspeção.</h3>
        <p className="text-gray-400">Realize a primeira verificação para ver o dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Inspeções</p>
            <p className="text-2xl font-bold text-gray-800">{total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Aprovados</p>
            <p className="text-2xl font-bold text-gray-800">{clean}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 rounded-full mr-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Com Avarias</p>
            <p className="text-2xl font-bold text-gray-800">{issues}</p>
          </div>
        </div>
      </div>

      {/* Row 2: Stations & Evolution (New Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-500" />
              Resultados por Estação
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Legend />
                <Bar dataKey="aprovados" name="Aprovados" stackId="a" fill={COLORS.ok} radius={[0, 0, 4, 4]} />
                <Bar dataKey="avarias" name="Com Avarias" stackId="a" fill={COLORS.nok} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolution Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-gray-500" />
              Evolução Temporal
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="aprovados" name="Aprovados" stroke={COLORS.ok} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="avarias" name="Com Avarias" stroke={COLORS.nok} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Categories & Overall Status (Old Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Avarias por Categoria</h3>
            <div className="relative">
              <select 
                value={categoryFilterStation} 
                onChange={(e) => setCategoryFilterStation(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 pl-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-yellow-500 text-sm"
              >
                <option value="all">Todas as Estações</option>
                {uniqueStations.map(station => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Filter className="w-3 h-3" />
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {barData.length > 0 ? (
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="issues" name="Nº Avarias" fill={COLORS.bar} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Sem avarias registadas para esta seleção.
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Status Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Estado Global</h3>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Alerts Table */}
      {issues > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas Recentes de Manutenção
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {inspections
              .filter(i => i.results.some(r => r.status === InspectionStatus.NOK))
              .slice(0, 5)
              .map(ins => (
                <div key={ins.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800">Frota {ins.vehicle.fleetNumber}</span>
                    <span className="text-xs text-gray-500">{new Date(ins.date).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-1">
                    {ins.results
                      .filter(r => r.status === InspectionStatus.NOK)
                      .map((r, idx) => (
                        <div key={idx} className="text-sm text-red-600 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {r.category}: {r.label}
                        </div>
                      ))}
                  </div>
                  {ins.aiSummary && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600 italic border-l-2 border-yellow-500">
                      <strong>IA:</strong> {ins.aiSummary}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
