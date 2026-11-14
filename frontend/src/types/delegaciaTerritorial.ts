import { EstadoUF } from '../types/sigBase';

export interface DelegaciaTerritorialMgEs {
  id: string; // Ex: 'ES-PCES-VIT-01' ou 'MG-PCMG-BH-01'
  uf: EstadoUF;
  orgao: 'PCMG' | 'PCES';
  nome: string;
  nomeCurto: string;
  numeroDp?: string;
  tipo: 'Distrital' | 'Regional' | 'Plantao' | 'Especializada';
  regional: string;
  departamentoOuRisp: string;
  municipio: string;
  jurisdicao: string;
  comarca: string;
  bairros: string[];
  totalBairros: number;
  populacaoAprox?: number;
  endereco: string;
  telefone: string;
  plantao24h: boolean;
  horarioAtendimento: string;
  latitude: number;
  longitude: number;
  cor: string;
  // Polígono de delimitação territorial da circunscrição da delegacia (EPSG:4326: [lng, lat])
  coordinates: [number, number][][];
}
