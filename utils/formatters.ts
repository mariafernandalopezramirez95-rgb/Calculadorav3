import { TASAS_USD, PAISES } from '../constants';

export const fmt = (n: number | string): string => {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(num) ? '0' : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(num);
};

export const fmtDec = (n: number | string): string => {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(num) ? '0.00' : new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export const convertir = (cant: number, monedaOrigen: string, monedaDestino: string): number => {
  if (monedaOrigen === monedaDestino) return cant;
  if (monedaDestino === 'USD') return cant / (TASAS_USD[monedaOrigen] || 1);
  if (monedaOrigen === 'USD') return cant * (TASAS_USD[monedaDestino] || 1);
  const enUSD = cant / (TASAS_USD[monedaOrigen] || 1);
  return enUSD * (TASAS_USD[monedaDestino] || 1);
};

// Create a map from currency code to symbol for efficient lookup
const MONEDA_SIMBOLOS: { [key: string]: string } = { 'USD': '$' };
Object.values(PAISES).forEach(pais => {
    MONEDA_SIMBOLOS[pais.moneda] = pais.simbolo;
});

export const getSimboloForMoneda = (moneda: string): string => {
    return MONEDA_SIMBOLOS[moneda] || '$';
};
