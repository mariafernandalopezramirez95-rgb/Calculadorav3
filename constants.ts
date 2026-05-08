
import type { Pais } from './types';

export const PAISES: { [key: string]: Pais } = {
  colombia: { nombre: 'Colombia', moneda: 'COP', simbolo: '$', flag: '🇨🇴', iva: 0 },
  espana: { nombre: 'España', moneda: 'EUR', simbolo: '€', flag: '🇪🇸', iva: 21 },
  guatemala: { nombre: 'Guatemala', moneda: 'GTQ', simbolo: 'Q', flag: '🇬🇹', iva: 0 },
  argentina: { nombre: 'Argentina', moneda: 'ARS', simbolo: '$', flag: '🇦🇷', iva: 0 },
};

export const TASAS_USD: { [key: string]: number } = { 
  COP: 4000, 
  EUR: 0.92,
  GTQ: 7.8,  // Tasa aproximada Quetzal
  ARS: 1200  // Tasa aproximada Peso Argentino (editable en la UI)
};