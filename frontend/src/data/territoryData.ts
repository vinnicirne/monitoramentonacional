import relacaoData from './relacaoRISPxAISPxCISP.json';
import { PoliceUnitRecord } from '../types/territory';

export const POLICE_UNITS: PoliceUnitRecord[] = relacaoData as PoliceUnitRecord[];

// Calculate unique lists
export const UNIQUE_RISPS = Array.from(new Set(POLICE_UNITS.map(u => u.risp))).sort((a, b) => a - b);
export const UNIQUE_AISPS = Array.from(new Set(POLICE_UNITS.map(u => u.aisp))).sort((a, b) => a - b);
export const UNIQUE_CISPS = Array.from(new Set(POLICE_UNITS.map(u => u.cisp))).sort((a, b) => a - b);
export const UNIQUE_MUNICIPIOS = Array.from(new Set(POLICE_UNITS.map(u => u.municipio))).sort();
export const UNIQUE_REGIOES = Array.from(new Set(POLICE_UNITS.map(u => u.regiaoGoverno))).sort();

// RISP official names and command centers
export const RISP_COMMANDS: Record<number, { nome: string; cpa: string; sede: string; abrangencia: string }> = {
  1: { nome: '1ª RISP', cpa: '1º CPA (Comando de Policiamento de Área)', sede: 'Capital Sul / Centro / Tijuca / Leopoldina', abrangencia: 'Zona Sul, Centro, Tijuca, Leopoldina e Ilha do Governador' },
  2: { nome: '2ª RISP', cpa: '2º CPA', sede: 'Capital Norte e Oeste', abrangencia: 'Madureira, Méier, Irajá, Bangu, Jacarepaguá, Campo Grande, Santa Cruz e Barra da Tijuca' },
  3: { nome: '3ª RISP', cpa: '3º CPA', sede: 'Baixada Fluminense', abrangencia: 'Duque de Caxias, Nova Iguaçu, Mesquita, Nilópolis, São João de Meriti, Belford Roxo, Queimados, Japeri, Paracambi, Seropédica, Itaguaí, Magé e Guapimirim' },
  4: { nome: '4ª RISP', cpa: '4º CPA', sede: 'Leste Fluminense e Lagos', abrangencia: 'Niterói, São Gonçalo, Maricá, Itaboraí, Tanguá, Rio Bonito, Região dos Lagos (Cabo Frio, Búzios, Arraial, Araruama, Saquarema, São Pedro da Aldeia, Iguaba)' },
  5: { nome: '5ª RISP', cpa: '5º CPA', sede: 'Sul Fluminense e Costa Verde', abrangencia: 'Volta Redonda, Barra Mansa, Resende, Barra do Piraí, Valença, Piraí, Angra dos Reis, Paraty, Mangaratiba, Vassouras e Centro-Sul' },
  6: { nome: '6ª RISP', cpa: '6º CPA', sede: 'Norte e Noroeste Fluminense', abrangencia: 'Campos dos Goytacazes, Macaé, Rio das Ostras, Itaperuna, Santo Antônio de Pádua, Bom Jesus do Itabapoana e municípios vizinhos' },
  7: { nome: '7ª RISP', cpa: '7º CPA', sede: 'Região Serrana', abrangencia: 'Petrópolis, Nova Friburgo, Teresópolis, Três Rios, Paraíba do Sul, Cachoeiras de Macacu, Cantagalo, Cordeiro e bacia centro-norte' }
};

// Summary metrics
export const TERRITORY_METRICS = {
  totalMunicipios: 92, // Total official municipalities in RJ
  municipiosCadastrados: UNIQUE_MUNICIPIOS.length,
  totalCISP: UNIQUE_CISPS.length,
  totalAISP: UNIQUE_AISPS.length,
  totalRISP: UNIQUE_RISPS.length,
  totalRegistros: POLICE_UNITS.length
};
