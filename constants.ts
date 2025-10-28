
import type { Pais } from './types';

export const PAISES: { [key: string]: Pais } = {
  colombia: { nombre: 'Colombia', moneda: 'COP', simbolo: '$', flag: '🇨🇴', iva: 0 },
  mexico: { nombre: 'México', moneda: 'MXN', simbolo: '$', flag: '🇲🇽', iva: 16 },
  espana: { nombre: 'España', moneda: 'EUR', simbolo: '€', flag: '🇪🇸', iva: 21 },
};

export const TASAS_USD: { [key: string]: number } = { COP: 4000, MXN: 17.5, EUR: 0.92 };