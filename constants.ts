

import { Vehicle, VehicleType, AppConfig } from './types';

export const DEFAULT_VEHICLES: Vehicle[] = [
  { fleetNumber: '2401', licensePlate: 'AB-12-CD', type: VehicleType.BUS, station: 'Miraflores', model: 'MAN Lion\'s City', lastInspectionDate: '2023-10-25' },
  { fleetNumber: '2402', licensePlate: 'XY-99-ZZ', type: VehicleType.BUS, station: 'Musgueira', model: 'Mercedes Citaro', lastInspectionDate: '2023-10-26' },
  { fleetNumber: '505', licensePlate: 'EL-05-05', type: VehicleType.TRAM_REMODELADO, station: 'Santo Amaro', model: 'Remodelado', lastInspectionDate: '2023-10-20' },
  { fleetNumber: '601', licensePlate: 'EL-06-01', type: VehicleType.TRAM_ARTICULADO, station: 'Santo Amaro', model: 'Articulado', lastInspectionDate: '' },
  { fleetNumber: '2983', licensePlate: 'CC-88-PP', type: VehicleType.BUS, station: 'Pontinha', model: 'Volvo B7R', lastInspectionDate: '' },
];

export const DEFAULT_CONFIG: AppConfig = {
  busChecklist: [
    { id: 'b1', category: 'Segurança', label: 'Travões (Teste Estático)', description: 'Verificar pressão e fugas de ar audíveis.' },
    { id: 'b2', category: 'Segurança', label: 'Luzes Exteriores', description: 'Médios, piscas, stop e marcha-atrás.' },
    { id: 'b3', category: 'Exterior', label: 'Espelhos Retrovisores', description: 'Verificar se estão partidos ou desapertados.' },
    { id: 'b4', category: 'Exterior', label: 'Limpa Pára-brisas', description: 'Testar funcionamento e estado das escovas.' },
    { id: 'b5', category: 'Interior', label: 'Validadores de Bilhetes', description: 'Devem estar ligados e sem luz vermelha de erro.' },
    { id: 'b6', category: 'Interior', label: 'Limpeza Geral / Lixos', description: 'Verificar chão e bancos.' },
    { id: 'b7', category: 'Mecânica', label: 'Ruídos Anormais Motor', description: 'Ligar o motor e aguardar 1 minuto.' },
    { id: 'b8', category: 'Mecânica', label: 'Nível de Combustível/Bateria', description: 'Registar se estiver abaixo de 1/4.' },
    { id: 'b9', category: 'Segurança', label: 'Pneus', description: 'Verificar estado visual e pressão.' },
    { id: 'b10', category: 'Interior', label: 'Sinalização de Paragem', description: 'Testar botões de pedido de paragem.' },
  ],
  tramChecklist: [
    { id: 't1', category: 'Mecânica', label: 'Pantógrafo / Trolley', description: 'Verificar contacto e estado do carvão.' },
    { id: 't2', category: 'Segurança', label: 'Areneiros', description: 'Confirmar nível de areia em ambas as caixas.' },
    { id: 't3', category: 'Segurança', label: 'Travão de Via', description: 'Teste estático dos patins eletromagnéticos.' },
    { id: 't4', category: 'Exterior', label: 'Luzes e Sinalização', description: 'Faróis, piscas e luzes de presença.' },
    { id: 't5', category: 'Interior', label: 'Limpeza e Bancos', description: 'Estado dos estofos e limpeza do chão.' },
    { id: 't6', category: 'Mecânica', label: 'Rodados', description: 'Verificar ruídos visuais ou desgaste excessivo.' },
  ]
};