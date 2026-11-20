import sedesRj from './delegaciaSedesRj.json';

interface SedeDelegacia {
  endereco: string;
  mapaUrl: string;
  coordenadas?: number[];
  fonteCoordenadas?: string;
}

const sedes: Partial<Record<number, SedeDelegacia>> = sedesRj;

export function getSedeDelegacia(cisp?: number): SedeDelegacia | undefined {
  return cisp === undefined ? undefined : sedes[cisp];
}
