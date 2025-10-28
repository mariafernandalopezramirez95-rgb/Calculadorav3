export interface Pais {
  nombre: string;
  moneda: string;
  simbolo: string;
  flag: string;
  iva: number;
}

export interface ProductoCalculado {
  coste: number;
  costeConIva: number;
  envio: number;
  beneficioBruto: number;
  margenBruto: number;
  cpaObj: number;
  tasaFinal: number;
  ingresoEsperado: number;
  costoProductoEsperado: number;
  costoEnvioEsperado: number;
  beneficioEspCOD: number;
  profitObjetivo: number | null;
}

export interface Producto extends ProductoCalculado {
  id: number;
  nombre: string;
  pvp: string;
  pais: string;
  incluirIva: boolean;
}

export interface FormState {
  nombre: string;
  pvp: string;
  coste: string;
  envio: string;
  cpaObj: string;
}

export interface InversionData {
  monto: string;
  moneda: string;
}

export interface CpaMedio {
  valor: string;
  moneda: string;
}

export interface Gasto {
  id: number;
  nombre: string;
  monto: string;
  moneda: string;
}

export interface GastosOperativos {
  gastos: Gasto[];
  costeDevolucionUnitario?: string;
}

export interface ImportacionDatos {
  total: number;
  entregados: number;
  enviados: number;
  facturacion: number;
  costoProductos: number;
  costoEnvioTotal: number;
  costoDevolucionFleteTotal: number;
  novedades: number;
  facturacionIncidencia: number;
  envioIncidencia: number;
  rehusadosTransito: number;
  rehusadosRecepcionados: number;
  cancelados: number;
  rechazados: number;
  reclameOficina: number;
  noConfirmables: number;
  enRuta: number;
  enBodega: number;
  enReparto: number;
  reenvio: number;
}

export interface HistoricoItem {
  id: number;
  fecha: string;
  archivo: string;
  pais: string;
  datos: ImportacionDatos;
  inversionData: InversionData;
  gastosOperativos: GastosOperativos;
}

export interface ProfitData extends ImportacionDatos {
    facturacion: number;
    costos: number;
    profitOperativo: number;
    profitFinal: number;
    inversionPublicidadTotal: number;
    gastosOperativosTotal: number;
    pais: string;
    inversionMoneda?: string;
    inversionEnCampana?: number;
    inversionEnMonedaLocal?: number;
    inversionCampanaEnMonedaLocal?: number;
    gastosAdsOperativos?: number;
    cpaCampana?: number;
    cpaReal?: number;
    roi?: number;
    beneficioGastos: number;
    beneficioPosibleDev: number;
    inversionData: InversionData;
}