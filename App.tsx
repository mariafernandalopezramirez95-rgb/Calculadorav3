
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator, Upload, DollarSign, ChevronDown, Plus, Edit, Trash2,
  AlertCircle, Package, TrendingUp, TrendingDown, Eye, Building2,
  Truck, CreditCard, ShoppingCart, Wallet, X
} from './components/icons';
import { PAISES, TASAS_USD } from './constants';
import type { FormState, Producto, HistoricoItem, InversionData, CpaMedio, GastosOperativos, ProductoCalculado, ProfitData, ImportacionDatos, Gasto } from './types';
import { fmt, fmtDec, convertir, getSimboloForMoneda } from './utils/formatters';

// This is a dynamic import, so we need to declare the type for the module.
// In a real project with a build system, you'd add this via `npm install --save-dev @types/xlsx`.
declare const XLSX: any;

interface StatCardProps {
    icon: React.FC<any>;
    label: string;
    value: string;
    color: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => {
    const colors: { [key: string]: string } = {
        green: 'text-green-400',
        red: 'text-red-400',
        blue: 'text-blue-400',
        yellow: 'text-yellow-400',
    };
    return (
        <div className="bg-gray-900/70 p-4 rounded-lg flex items-center gap-4 border border-gray-700">
            <Icon size={32} className={colors[color] || 'text-gray-400'} />
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
};

interface SummaryDashboardProps {
  historico: HistoricoItem[];
  inversionData: InversionData;
  gastosOperativos: GastosOperativos;
  setActiveTab: (tab: string) => void;
}

const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ historico, inversionData, gastosOperativos, setActiveTab }) => {
  if (historico.length === 0) {
    return (
      <div className="lg:col-span-2 bg-gray-800 p-10 rounded-2xl border border-yellow-500/30 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
        <h3 className="text-xl font-bold text-white">Sin datos para el resumen</h3>
        <p className="text-gray-400 mt-2 mb-6">Importa tu primer archivo Excel para ver el resumen general.</p>
        <button onClick={() => setActiveTab('importar')} className="py-2 px-5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition">Ir a Importar</button>
      </div>
    );
  }

  let totalFacturacionUSD = 0;
  let totalCostosUSD = 0;
  let totalPedidos = 0;
  let totalEntregados = 0;
  let totalEnviados = 0;
  let totalDevoluciones = 0;

  historico.forEach(h => {
    const monedaPais = PAISES[h.pais]?.moneda;
    if (!monedaPais) return;

    const facturacion = h.datos.facturacion;
    const costos = h.datos.costoDevolucionFleteTotal;
    const devoluciones = h.datos.rehusadosTransito + h.datos.rehusadosRecepcionados;

    totalFacturacionUSD += convertir(facturacion, monedaPais, 'USD');
    totalCostosUSD += convertir(costos, monedaPais, 'USD');
    totalPedidos += h.datos.total;
    totalEntregados += h.datos.entregados;
    totalEnviados += h.datos.enviados;
    totalDevoluciones += devoluciones;
  });

  const totalProfitOperativoUSD = totalFacturacionUSD - totalCostosUSD;
  const totalTasaEntrega = totalEnviados > 0 ? (totalEntregados / totalEnviados) * 100 : 0;
  const totalTasaDevolucion = totalEnviados > 0 ? (totalDevoluciones / totalEnviados) * 100 : 0;
  const totalRatioEntregaPorDevolucion = totalDevoluciones > 0 ? totalEntregados / totalDevoluciones : 0;

  const inversionPublicidadTotal = parseFloat(inversionData.monto) || 0;
  const inversionPublicidadTotalUSD = convertir(inversionPublicidadTotal, inversionData.moneda, 'USD');

  let gastosOperativosTotalUSD = 0;
  gastosOperativos.gastos.forEach(gasto => {
    const monto = parseFloat(gasto.monto) || 0;
    gastosOperativosTotalUSD += convertir(monto, gasto.moneda, 'USD');
  });

  const totalGastosAdsOperativosUSD = inversionPublicidadTotalUSD + gastosOperativosTotalUSD;
  const totalProfitFinalUSD = totalProfitOperativoUSD - totalGastosAdsOperativosUSD;
  const overallROI = totalGastosAdsOperativosUSD > 0 ? (totalProfitFinalUSD / totalGastosAdsOperativosUSD) * 100 : 0;

  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
        <h2 className="text-2xl font-bold text-yellow-400 mb-1">Resumen General de Rendimiento</h2>
        <p className="text-sm text-gray-400 mb-6">KPIs calculados a partir de {historico.length} importaciones.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-6 rounded-xl text-center border-2 ${totalProfitFinalUSD >= 0 ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
            <p className="text-sm font-bold text-gray-400 uppercase">Profit Final Total</p>
            <p className={`my-2 text-4xl font-bold ${totalProfitFinalUSD >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmtDec(totalProfitFinalUSD)}</p>
            <p className="text-sm text-gray-500">USD</p>
          </div>
          <div className="p-6 rounded-xl text-center bg-purple-500/10 border-2 border-purple-500/40">
            <p className="text-sm font-bold text-gray-400 uppercase">Inversión Total</p>
            <p className="my-2 text-4xl font-bold text-purple-300">${fmtDec(totalGastosAdsOperativosUSD)}</p>
            <p className="text-sm text-gray-500">Ads + Gastos</p>
          </div>
          <div className={`p-6 rounded-xl text-center border-2 ${overallROI >= 0 ? 'bg-blue-500/10 border-blue-500/40' : 'bg-orange-500/10 border-orange-500/40'}`}>
            <p className="text-sm font-bold text-gray-400 uppercase">ROI General</p>
            <p className={`my-2 text-4xl font-bold ${overallROI >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>{fmtDec(overallROI)}%</p>
            <p className="text-sm text-gray-500">Retorno de Inversión</p>
          </div>
        </div>
        
        <div className="p-4 bg-gray-900/50 rounded-lg text-center mb-6">
            <p className="text-sm text-yellow-300/80">
                <AlertCircle className="inline-block mr-2 -mt-1" size={16} />
                <strong>Nota:</strong> El P&L se basa en ingresos reales por entregas (GANANCIA) y costos reales solo por devoluciones (COSTO DEVOLUCION FLETE). Otros estados quedan pendientes de resolución.
            </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Ingresos entregas" value={`$${fmtDec(totalFacturacionUSD)}`} color="green" />
            <StatCard icon={TrendingDown} label="Costo devoluciones" value={`$${fmtDec(totalCostosUSD)}`} color="red" />
            <StatCard icon={Package} label="Tasa entrega" value={`${fmtDec(totalTasaEntrega)}%`} color="blue" />
            <StatCard icon={Truck} label="Tasa devolución" value={`${fmtDec(totalTasaDevolucion)}%`} color="yellow" />
        </div>
      </div>
    </div>
  );
};

const DetailedResultsDashboard = ({ profitData, onInversionChange, investmentCurrencies }: { profitData: ProfitData, onInversionChange: (newData: InversionData) => void, investmentCurrencies: string[] }) => {
    const pais = PAISES[profitData.pais];
    const simbolo = pais.simbolo;

    const profitExcel = profitData.profitFinal;

    const StatBox: React.FC<{ label: string, value: number, total: number }> = ({ label, value, total }) => (
      <div className="bg-yellow-300 text-black p-2 rounded-lg shadow-md">
        <h4 className="font-bold text-center text-xs uppercase">{label}</h4>
        <div className="flex border-t border-black/20 mt-1 pt-1">
          <div className="w-1/2 text-center">
            <p className="font-bold text-xs">Nº</p>
            <p className="font-bold text-lg">{fmt(value)}</p>
          </div>
          <div className="w-1/2 text-center border-l border-black/20">
            <p className="font-bold text-xs">%</p>
            <p className="font-bold text-lg">{fmtDec(total > 0 ? (value / total) * 100 : 0)}%</p>
          </div>
        </div>
      </div>
    );

    const BreakdownCard = ({ title, data, color, simbolo }: { title: string, data: {label: string, value: string | number}[], color: string, simbolo: string }) => (
        <div className={`bg-${color}-400 text-black p-3 rounded-lg shadow-lg`}>
            <h4 className="font-bold text-center text-sm uppercase">{title}</h4>
            <div className={`mt-2 space-y-1 text-xs font-bold bg-${color}-200/50 p-2 rounded`}>
                {data.map(item => (
                    <div key={item.label} className="flex justify-between">
                        <span>{item.label}:</span>
                        <span>{typeof item.value === 'number' ? `${simbolo}${fmt(item.value)}` : item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const devolucionLabel = profitData.pais === 'colombia' ? 'COSTO DEL FLETE' : 'COSTO DE LA DEVOLUCIÓN';

    const pctsPie = {
      enviados: profitData.total > 0 ? (profitData.enviados / profitData.total) * 100 : 0,
      rechazados: profitData.total > 0 ? (profitData.rechazados / profitData.total) * 100 : 0,
      noConfirmables: profitData.total > 0 ? (profitData.noConfirmables / profitData.total) * 100 : 0,
      reclameOficina: profitData.total > 0 ? (profitData.reclameOficina / profitData.total) * 100 : 0,
    };
    const conicGradient = `conic-gradient(
      #84cc16 0% ${pctsPie.enviados}%,
      #ef4444 ${pctsPie.enviados}% ${pctsPie.enviados + pctsPie.rechazados}%,
      #3b82f6 ${pctsPie.enviados + pctsPie.rechazados}% ${pctsPie.enviados + pctsPie.rechazados + pctsPie.noConfirmables}%,
      #f97316 ${pctsPie.enviados + pctsPie.rechazados + pctsPie.noConfirmables}% 100%
    )`;

    const barChartData = [
      { label: 'GANANCIA ENTREGAS', value: profitData.facturacion, color: 'from-green-400 to-green-600' },
      { label: 'COSTO DEVOLUCIONES', value: profitData.costoDevolucionFleteTotal, color: 'from-rose-600 to-rose-800' },
      { label: 'INV. PUBLICITARIA', value: profitData.inversionPublicidadTotal, color: 'from-purple-400 to-purple-600' },
      { label: 'GASTOS OPERATIVOS', value: profitData.gastosOperativosTotal, color: 'from-orange-400 to-orange-600' },
      { label: 'PROFIT FINAL', value: Math.max(profitData.profitFinal, 0), color: profitData.profitFinal >= 0 ? 'from-lime-400 to-lime-600' : 'from-red-500 to-red-700' },
    ];
    const maxBarValue = Math.max(...barChartData.map(d => d.value), 1);

    return (
        <div className="lg:col-span-2">
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-3 space-y-4">
                    <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
                        <h4 className="font-bold text-center text-sm uppercase tracking-wider text-white mb-2">INVERSIÓN PUBLICITARIA</h4>
                         <div className="flex gap-2 items-stretch">
                            <input 
                                type="number"
                                value={profitData.inversionData.monto}
                                onChange={(e) => onInversionChange({ ...profitData.inversionData, monto: e.target.value })}
                                className="w-2/3 p-3 text-2xl font-bold rounded-lg border-2 border-gray-600 outline-none text-center bg-black text-white focus:ring-2 focus:ring-yellow-500"
                                placeholder="0.00"
                            />
                            <select
                                value={profitData.inversionData.moneda}
                                onChange={(e) => onInversionChange({ ...profitData.inversionData, moneda: e.target.value })}
                                className="w-1/3 p-2 text-sm font-bold rounded-lg border-2 border-gray-600 outline-none bg-black text-white focus:ring-2 focus:ring-yellow-500"
                            >
                                {investmentCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         </div>
                    </div>
                    {[
                        { label: 'Pedidos Totales', value: profitData.total, total: profitData.total },
                        { label: 'Rechazados', value: profitData.rechazados, total: profitData.total },
                        { label: 'No Confirmables', value: profitData.noConfirmables, total: profitData.total },
                        { label: 'Reclame en Oficina', value: profitData.reclameOficina, total: profitData.total },
                        { label: 'Envíos en Ruta', value: profitData.enRuta, total: profitData.enviados },
                        { label: 'Novedades', value: profitData.novedades, total: profitData.enviados },
                        { label: 'Enviados', value: profitData.enviados, total: profitData.total },
                        { label: 'Entregados', value: profitData.entregados, total: profitData.enviados },
                    ].map(item => <StatBox key={item.label} {...item} />)}
                </div>

                <div className="col-span-12 md:col-span-9 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <BreakdownCard title="Novedades" color="orange" simbolo={simbolo} data={[
                            { label: 'Nº NOVEDADES', value: fmt(profitData.novedades) },
                            { label: 'FACTURACIÓN INCIDENCIA', value: profitData.facturacionIncidencia },
                            { label: 'ENVÍO DE LA INCIDENCIA', value: 0 },
                            { label: 'POSIBLE COSTO A DEVOLVER', value: 0 },
                        ]} />
                        <BreakdownCard title="Rehusados" color="yellow" simbolo={simbolo} data={[
                            { label: 'Nº REHUSADOS EN TRÁNSITO', value: fmt(profitData.rehusadosTransito) },
                            { label: 'REHUSADOS RECEPCIONADOS', value: fmt(profitData.rehusadosRecepcionados) },
                            { label: 'COSTO DEL ENVÍO', value: 0 },
                            { label: devolucionLabel, value: profitData.costoDevolucionFleteTotal },
                        ]} />
                        <BreakdownCard title="Entregados" color="lime" simbolo={simbolo} data={[
                            { label: 'Nº ENTREGADOS', value: fmt(profitData.entregados) },
                            { label: 'FACTURACIÓN', value: profitData.facturacion },
                            { label: 'PRECIO PROVEEDOR (ref.)', value: profitData.costoProductos },
                            { label: 'PRECIO FLETE (ref.)', value: profitData.costoEnvioTotal },
                        ]} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-700 text-white p-2 rounded-lg text-center shadow-lg"><h5 className="text-xs font-bold">GANANCIA ENTREGAS</h5><p className="font-bold text-xl">{simbolo}{fmt(profitData.beneficioGastos)}</p><p className="text-[10px] text-green-200 mt-1">Suma GANANCIA entregados</p></div>
                        <div className="bg-rose-500 text-white p-2 rounded-lg text-center shadow-lg"><h5 className="text-xs font-bold">PROFIT OPERATIVO</h5><p className="font-bold text-xl">{simbolo}{fmt(profitData.beneficioPosibleDev)}</p><p className="text-[10px] text-rose-200 mt-1">– Costo devoluciones</p></div>
                        <div className={`p-2 rounded-lg text-center shadow-lg border-2 ${profitExcel >= 0 ? 'bg-black border-lime-400 text-lime-400' : 'bg-black border-red-400 text-red-400'}`}><h5 className="text-xs font-bold text-white">PROFIT FINAL</h5><p className="font-bold text-xl">{simbolo}{fmt(profitExcel)}</p><p className="text-[10px] text-gray-400 mt-1">– Ads – Gastos Op.</p></div>
                    </div>

                    {/* Métricas Dropi COD */}
                    <div className="bg-gray-900/60 border border-yellow-500/20 rounded-lg p-3 mt-1">
                        <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">Métricas Dropi COD</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <div className="bg-gray-800 p-2 rounded-lg text-center border border-gray-700">
                                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Ganancia media<br/>por entrega</p>
                                <p className="text-base font-bold text-green-400 mt-1">{simbolo}{fmt(profitData.gananciaMediaPorEntrega || 0)}</p>
                            </div>
                            <div className="bg-gray-800 p-2 rounded-lg text-center border border-gray-700">
                                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Costo medio<br/>por devolución</p>
                                <p className="text-base font-bold text-red-400 mt-1">{simbolo}{fmt(profitData.costoMedioPorDevolucion || 0)}</p>
                            </div>
                            <div className="bg-gray-800 p-2 rounded-lg text-center border border-gray-700">
                                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Tasa<br/>entrega</p>
                                <p className="text-base font-bold text-blue-400 mt-1">{fmtDec(profitData.tasaEntrega || 0)}%</p>
                            </div>
                            <div className="bg-gray-800 p-2 rounded-lg text-center border border-gray-700">
                                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Tasa<br/>devolución</p>
                                <p className="text-base font-bold text-yellow-400 mt-1">{fmtDec(profitData.tasaDevolucion || 0)}%</p>
                            </div>
                            <div className="bg-gray-800 p-2 rounded-lg text-center border border-gray-700">
                                <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">Entregas para<br/>cubrir 1 dev.</p>
                                <p className="text-base font-bold text-purple-400 mt-1">{fmtDec(profitData.ratioEntregaPorDevolucion || 0)}x</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg mt-4 border border-gray-700">
                        <h3 className="font-bold text-center text-white mb-4">P&L — WATERFALL</h3>
                        <div className="w-full h-64 flex justify-around items-end gap-2 text-white text-xs text-center">
                            {barChartData.map(bar => {
                                const height = (bar.value / maxBarValue) * 90;
                                return (
                                    <div key={bar.label} className="h-full flex flex-col justify-end items-center w-1/5" style={{ minWidth: 0 }}>
                                        <p className="font-bold text-yellow-300 text-[10px]">{simbolo}{fmt(bar.value)}</p>
                                        <div className={`w-4/5 rounded-t-lg bg-gradient-to-b ${bar.color} transform hover:scale-y-105 transition-transform duration-300 origin-bottom`} style={{ height: `${height}%` }}></div>
                                        <p className="mt-1 font-bold text-[10px] uppercase leading-tight">{bar.label}</p>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 items-center">
                             <div className="flex flex-col items-center">
                                <h3 className="font-bold text-center text-white mb-4">PEDIDOS</h3>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="relative w-36 h-36">
                                      <div className="absolute inset-0 rounded-full" style={{ background: conicGradient }}></div>
                                      <div className="absolute inset-4 bg-gray-800 rounded-full flex flex-col justify-center items-center">
                                          <p className="font-bold text-2xl">{fmt(profitData.total)}</p>
                                          <p className="text-xs uppercase">Pedidos</p>
                                      </div>
                                    </div>
                                    <ul className="text-xs space-y-2 text-gray-300 font-medium">
                                        <li><span className="inline-block w-3 h-3 rounded-sm bg-lime-500 mr-2 align-middle"></span>Enviados: {fmtDec(pctsPie.enviados)}%</li>
                                        <li><span className="inline-block w-3 h-3 rounded-sm bg-red-500 mr-2 align-middle"></span>Rechazados: {fmtDec(pctsPie.rechazados)}%</li>
                                        <li><span className="inline-block w-3 h-3 rounded-sm bg-blue-500 mr-2 align-middle"></span>No Confirm.: {fmtDec(pctsPie.noConfirmables)}%</li>
                                        <li><span className="inline-block w-3 h-3 rounded-sm bg-orange-500 mr-2 align-middle"></span>Oficina: {fmtDec(pctsPie.reclameOficina)}%</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-center text-white mb-2">PROFIT ACTUAL</h3>
                                    <div className="w-full bg-gray-700 rounded-full h-8 border-2 border-gray-600 shadow-inner">
                                        <div className="bg-gradient-to-r from-lime-400 to-green-500 h-full rounded-full flex items-center justify-end px-2" style={{ width: `100%` }}>
                                            <span className="font-bold text-black text-sm shadow-sm">{simbolo}{fmt(profitExcel)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-center text-white mb-2">INVERSIÓN PUBLICITARIA</h3>
                                    <div className="w-full bg-gray-700 rounded-full h-8 border-2 border-gray-600 shadow-inner flex justify-end">
                                        <div className="bg-gradient-to-r from-gray-900 to-black border-l-2 border-gray-500 h-full rounded-r-full flex items-center justify-end px-2" style={{ width: `100%` }}>
                                            <span className="font-bold text-white text-sm">{getSimboloForMoneda(profitData.inversionData.moneda)}{fmt(profitData.inversionData.monto)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function App() {
  const [activeTab, setActiveTab] = useState('calcular');
  const [paisSel, setPaisSel] = useState('colombia');
  const [showPaisMenu, setShowPaisMenu] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [importacionActiva, setImportacionActiva] = useState<number | null>(null);
  const [incluirIva, setIncluirIva] = useState(true);

  const [inversionData, setInversionData] = useState<InversionData>({
    monto: '',
    moneda: 'USD',
  });

  const [cpaMedio, setCpaMedio] = useState<CpaMedio>({ valor: '', moneda: 'USD' });

  const [gastosOperativos, setGastosOperativos] = useState<GastosOperativos>({
    gastos: [], costeDevolucionUnitario: ''
  });

  const [form, setForm] = useState<FormState>({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '', costoDevolucion: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [tasas, setTasas] = useState({ conf: 90, entr: 60 });
  const [cargando, setCargando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [tasaARS, setTasaARS] = useState(1200);

  useEffect(() => { TASAS_USD.ARS = tasaARS; }, [tasaARS]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('coinnecta_data_v5');
      if (saved) {
        const data = JSON.parse(saved);
        setProductos(data.productos || []);

        const loadedInversionData = data.inversionData || { monto: '', moneda: 'USD' };
        setInversionData(loadedInversionData);
        
        let migratedGastos: GastosOperativos = { gastos: [], costeDevolucionUnitario: '' };
        const loadedGastos = data.gastosOperativos || {};
        if (loadedGastos.shopify !== undefined && !loadedGastos.gastos) { // Old format detected
            migratedGastos.gastos.push({
                id: Date.now(),
                nombre: 'Shopify',
                monto: loadedGastos.shopify || '29',
                moneda: 'USD'
            });
            migratedGastos.costeDevolucionUnitario = loadedGastos.costeDevolucionUnitario || '';
        } else {
            migratedGastos = loadedGastos.gastos ? loadedGastos : { gastos: [{id: Date.now(), nombre: 'Shopify', monto: '29', moneda: 'USD'}], costeDevolucionUnitario: '' };
        }
        setGastosOperativos(migratedGastos);
        
        const migratedHistorico = (data.historico || []).map((h: any) => ({
            ...h,
            inversionData: h.inversionData || loadedInversionData,
            gastosOperativos: h.gastosOperativos || migratedGastos,
        }));
        setHistorico(migratedHistorico);

        setCpaMedio(data.cpaMedio || { valor: '', moneda: 'USD' });
      } else {
         setGastosOperativos({
            gastos: [{ id: Date.now(), nombre: 'Shopify', monto: '29', moneda: 'USD' }],
            costeDevolucionUnitario: ''
        });
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToSave = JSON.stringify({ productos, historico, inversionData, gastosOperativos, cpaMedio });
      localStorage.setItem('coinnecta_data_v5', dataToSave);
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }
  }, [productos, historico, inversionData, gastosOperativos, cpaMedio]);

  useEffect(() => {
    const pais = PAISES[paisSel];
    if (pais.nombre === 'España') {
      setInversionData(prev => ({ ...prev, moneda: 'EUR' }));
    } else {
      setInversionData(prev => ({ ...prev, moneda: 'USD' }));
    }
  }, [paisSel]);

  const calcular = useCallback((): ProductoCalculado | null => {
    const pvp = parseFloat(form.pvp) || 0;
    const coste = parseFloat(form.coste) || 0;
    const envio = parseFloat(form.envio) || 0;
    const cpaObjInput = parseFloat(form.cpaObj) || 0;
    const costoDevolucionUnit = paisSel === 'argentina' ? (parseFloat(form.envio) || 0) * 0.8
      : paisSel === 'guatemala' ? (parseFloat(form.envio) || 0) * 0.5
      : parseFloat(form.envio) || 0;

    if (pvp === 0) return null;

    const pais = PAISES[paisSel];
    const ivaFactor = incluirIva && pais.iva > 0 ? (1 + (pais.iva / 100)) : 1;
    const costeConIva = coste * ivaFactor;
    const beneficioBruto = pvp - costeConIva - envio;
    const margenBruto = (beneficioBruto / pvp) * 100;

    const cpaObj = cpaObjInput > 0 ? cpaObjInput : 0;

    const tasaConf = tasas.conf / 100;
    const tasaEntr = tasas.entr / 100;
    const tasaFinal = tasaConf * tasaEntr;

    const ingresoEsperado = pvp * tasaFinal;
    const costoProductoEsperado = costeConIva * tasaFinal;
    const costoEnvioEsperado = envio * tasaFinal;
    // Devoluciones: pedidos enviados que no se entregan pagan el flete de retorno
    const costoDevolucionEsperado = costoDevolucionUnit * tasaConf * (1 - tasaEntr);
    const beneficioEspCOD = ingresoEsperado - costoProductoEsperado - costoEnvioEsperado - costoDevolucionEsperado;

    const profitObjetivo = cpaObjInput > 0 ? beneficioEspCOD - cpaObj : null;

    return {
      coste, costeConIva, envio, beneficioBruto, margenBruto, cpaObj: cpaObjInput,
      tasaFinal, ingresoEsperado, costoProductoEsperado, costoEnvioEsperado,
      costoDevolucionEsperado, beneficioEspCOD, profitObjetivo
    };
  }, [form, paisSel, incluirIva, tasas]);
  
  const handleSubmit = () => {
    if (!form.nombre || !form.pvp) {
      setFeedbackMsg({type: 'error', text: 'Completa nombre y precio de venta.'});
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    const metricas = calcular();
    if (!metricas) return;

    if (editId) {
      setProductos(productos.map(p =>
        p.id === editId ? { ...p, ...form, ...metricas, pais: paisSel, incluirIva } : p
      ));
      setEditId(null);
    } else {
      setProductos([...productos, {
        id: Date.now(),
        ...form,
        ...metricas,
        pais: paisSel,
        incluirIva
      }]);
    }
    setForm({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '', costoDevolucion: '' });
  };

  const handleEdit = (p: Producto) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, pvp: p.pvp, coste: String(p.coste), envio: String(p.envio), cpaObj: p.cpaObj ? String(p.cpaObj) : '', costoDevolucion: (p as any).costoDevolucion || '' });
    setPaisSel(p.pais);
    setIncluirIva(p.incluirIva !== undefined ? p.incluirIva : true);
    setActiveTab('calcular');
    window.scrollTo(0, 0);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar este producto?')) {
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFeedbackMsg(null);
    setCargando(true);

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            throw new Error('El archivo Excel está vacío o no tiene filas de datos.');
        }

        const COLS = {
            STATUS: ['ESTATUS', 'K'],
            GANANCIA: ['GANANCIA', 'VALOR DE COMPRA EN PRODUCTOS', 'T'],
            FLETE: ['PRECIO FLETE', 'V'],
            COSTO_DEVOLUCION_FLETE: ['COSTO DEVOLUCION FLETE', 'W'],
            COSTO_PROVEEDOR: ['TOTAL EN PRECIOS DE PROVEEDOR', 'Y'],
        };

        const fileHeaders = Object.keys(jsonData[0] as object);
        const hasHeader = (keys: (string | number)[]) => keys.some(key => fileHeaders.includes(key));

        const missingHeaders = [
            { label: 'ESTATUS', keys: COLS.STATUS },
            { label: 'GANANCIA', keys: COLS.GANANCIA },
            { label: 'COSTO DEVOLUCION FLETE', keys: COLS.COSTO_DEVOLUCION_FLETE },
        ].filter(col => !hasHeader(col.keys)).map(col => col.label);

        if (missingHeaders.length > 0) {
            throw new Error(`Cabeceras incorrectas. Faltan las columnas: ${missingHeaders.join(', ')}.`);
        }

        const getNum = (row: any, keys: (string | number)[]): number => {
            for (const key of keys) {
                if (row[key] !== undefined) {
                    const val = parseFloat(row[key]);
                    return isNaN(val) ? 0 : val;
                }
            }
            return 0;
        };

        const getStr = (row: any, keys: (string | number)[]): string => {
            for (const key of keys) {
                if (row[key] !== undefined) {
                    return String(row[key]).toUpperCase().trim();
                }
            }
            return '';
        };

        let totalPedidos = jsonData.length;
        let rechazados = 0, cancelados = 0, enRuta = 0, novedades = 0;
        let entregados = 0, rehusadosTransito = 0, rehusadosRecepcionados = 0;
        let reclameOficina = 0, noConfirmables = 0;

        let facturacionEntregados = 0, facturacionIncidencia = 0;
        let costoProductosEntregados = 0, costoEnvioTotal = 0, costoDevolucionFleteTotal = 0;

        jsonData.forEach((row: any) => {
            const status = getStr(row, COLS.STATUS);
            const ganancia = getNum(row, COLS.GANANCIA);
            const costoProveedor = getNum(row, COLS.COSTO_PROVEEDOR);
            const flete = getNum(row, COLS.FLETE);
            const devolucionFlete = getNum(row, COLS.COSTO_DEVOLUCION_FLETE);

            switch (status) {
                case 'ENTREGADO':
                    entregados++;
                    facturacionEntregados += ganancia;
                    costoProductosEntregados += costoProveedor;
                    costoEnvioTotal += flete;
                    break;
                case 'RECHAZADO':
                    rechazados++;
                    break;
                case 'CANCELADO':
                    cancelados++;
                    break;
                case 'RECLAME EN OFICINA':
                    reclameOficina++;
                    break;
                case 'NOVEDAD':
                    novedades++;
                    facturacionIncidencia += ganancia;
                    break;
                case 'DEVOLUCION':
                case 'EN PROCESO DE DEVOLUCION':
                    rehusadosTransito++;
                    costoDevolucionFleteTotal += devolucionFlete;
                    break;
                case 'REHUSADO - RECEPCIONADO EN ALMACÉN':
                    rehusadosRecepcionados++;
                    costoDevolucionFleteTotal += devolucionFlete;
                    break;
                case 'EN BODEGA TRANSPORTADORA':
                case 'EN REPARTO':
                case 'REENVIO':
                case 'TELEMERCADEO':
                case 'EN RUTA':
                    enRuta++;
                    break;
            }
        });

        const enviados = totalPedidos - rechazados - cancelados - reclameOficina;

        const nuevaImportacion: HistoricoItem = {
            id: Date.now(),
            fecha: new Date().toLocaleString('es-ES'),
            archivo: file.name,
            pais: paisSel,
            datos: {
                total: totalPedidos, 
                entregados, 
                enviados, 
                facturacion: facturacionEntregados,
                costoProductos: costoProductosEntregados, 
                costoEnvioTotal,
                costoDevolucionFleteTotal,
                novedades, 
                facturacionIncidencia,
                rehusadosTransito, 
                rehusadosRecepcionados, 
                cancelados,
                rechazados, 
                reclameOficina, 
                noConfirmables,
                enRuta,
                envioIncidencia: 0, enBodega: 0, enReparto: 0, reenvio: 0,
            },
            inversionData: JSON.parse(JSON.stringify(inversionData)),
            gastosOperativos: JSON.parse(JSON.stringify(gastosOperativos)),
        };

        const nuevosHistoricos = [nuevaImportacion, ...historico];
        setHistorico(nuevosHistoricos);
        setImportacionActiva(nuevaImportacion.id);
        setFeedbackMsg({type: 'success', text: `¡Excel importado! ${totalPedidos} pedidos procesados.`});
        setActiveTab('resultados');

    } catch (error) {
        console.error("Error processing Excel file:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al procesar el archivo.";
        setFeedbackMsg({type: 'error', text: `Error al importar: ${errorMessage}`});
    } finally {
        setCargando(false);
        if (e.target) e.target.value = '';
        setTimeout(() => setFeedbackMsg(null), 8000);
    }
  };

  const verResultados = (importacionId: number) => {
    setImportacionActiva(importacionId);
    setActiveTab('resultados');
    window.scrollTo(0,0);
  };

  const calcProfit = useCallback((importacionId: number): ProfitData | null => {
    const importacion = historico.find(h => h.id === importacionId);
    if (!importacion) return null;

    const { datos, inversionData: historicInversion, gastosOperativos: historicGastos } = importacion;
    const paisData = PAISES[importacion.pais];
    const monedaPais = paisData.moneda;
    
    const { monto, moneda: monedaInversion } = historicInversion;

    const inversionPublicidadTotal = parseFloat(monto) || 0;
    const inversionPublicidadTotalEnMonedaLocal = convertir(inversionPublicidadTotal, monedaInversion, monedaPais);
    
    let gastosOperativosTotal = 0;
    historicGastos.gastos.forEach(gasto => {
        const montoGasto = parseFloat(gasto.monto) || 0;
        gastosOperativosTotal += convertir(montoGasto, gasto.moneda, monedaPais);
    });

    const facturacion = datos.facturacion || 0;
    const costoProductos = datos.costoProductos || 0;
    const costoEnvioTotal = datos.costoEnvioTotal || 0;
    
    let costoDevolucionFleteTotal = datos.costoDevolucionFleteTotal || 0;
    const devoluciones = datos.rehusadosTransito + datos.rehusadosRecepcionados;
    const devolucionUnitaria = parseFloat(historicGastos.costeDevolucionUnitario || '0');
    if (importacion.pais === 'espana' && costoDevolucionFleteTotal === 0 && devolucionUnitaria > 0) {
      costoDevolucionFleteTotal = devoluciones * devolucionUnitaria;
    }

    const costos = costoDevolucionFleteTotal;
    const profitOperativo = facturacion - costos;

    const beneficioGastos = facturacion;
    const beneficioPosibleDev = profitOperativo;

    const profitFinal = profitOperativo - inversionPublicidadTotalEnMonedaLocal - gastosOperativosTotal;
    
    const gastosAdsOperativos = inversionPublicidadTotalEnMonedaLocal + gastosOperativosTotal;
    const roi = gastosAdsOperativos > 0 ? (profitFinal / gastosAdsOperativos) * 100 : 0;
    const roas = inversionPublicidadTotalEnMonedaLocal > 0 ? facturacion / inversionPublicidadTotalEnMonedaLocal : 0;
    const cpaReal = datos.entregados > 0 ? inversionPublicidadTotalEnMonedaLocal / datos.entregados : 0;
    const tasaEntrega = datos.enviados > 0 ? (datos.entregados / datos.enviados) * 100 : 0;
    const tasaDevolucion = datos.enviados > 0 ? (devoluciones / datos.enviados) * 100 : 0;
    const ratioEntregaPorDevolucion = devoluciones > 0 ? datos.entregados / devoluciones : 0;
    const gananciaMediaPorEntrega = datos.entregados > 0 ? facturacion / datos.entregados : 0;
    const costoMedioPorDevolucion = devoluciones > 0 ? costoDevolucionFleteTotal / devoluciones : 0;

    return {
      ...datos,
      facturacion,
      costos,
      profitOperativo,
      profitFinal,
      inversionPublicidadTotal: inversionPublicidadTotalEnMonedaLocal,
      gastosOperativosTotal,
      pais: importacion.pais,
      cpaReal,
      roi,
      roas,
      inversionMoneda: monedaInversion,
      inversionEnCampana: inversionPublicidadTotal,
      beneficioGastos,
      beneficioPosibleDev,
      devoluciones,
      tasaEntrega,
      tasaDevolucion,
      ratioEntregaPorDevolucion,
      gananciaMediaPorEntrega,
      costoMedioPorDevolucion,
      costoDevolucionFleteTotal,
      inversionData: historicInversion,
    };
}, [historico]);

  const handleInversionChangeForReport = useCallback((newInversionData: InversionData) => {
    if (!importacionActiva) return;
    setHistorico(prev => prev.map(h => 
        h.id === importacionActiva ? { ...h, inversionData: newInversionData } : h
    ));
  }, [importacionActiva]);
  
  const pais = PAISES[paisSel];
  const prodsPais = productos.filter(p => p.pais === paisSel);
  const metricas = calcular();
  const profitData = importacionActiva ? calcProfit(importacionActiva) : null;
  const investmentCurrencies = [...new Set(['USD', 'EUR', pais.moneda])];
  
  // DYNAMIC CPA OPTIONS: Always show USD and the selected country's local currency.
  const cpaOptions = ['USD', pais.moneda];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans pb-10">
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-yellow-500/20 shadow-black/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              Coinnecta Pro
            </h1>
            <p className="text-xs text-gray-400">Calculadora Dropshipping Profesional</p>
          </div>
          
          <div className="flex items-center gap-3">
            {paisSel === 'argentina' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-xs text-blue-300 font-bold whitespace-nowrap">💱 ARS/USD</span>
                <input
                  type="number"
                  value={tasaARS}
                  onChange={(e) => setTasaARS(parseFloat(e.target.value) || 1)}
                  className="w-20 bg-transparent text-white text-sm font-bold text-center outline-none border-b border-blue-400/50"
                  min="1"
                />
              </div>
            )}
            <div className="relative">
              <button onClick={() => setShowPaisMenu(!showPaisMenu)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg cursor-pointer text-white text-sm font-bold hover:bg-yellow-500/20 transition-colors">
                <span className="text-2xl">{pais.flag}</span>
                <span>{pais.nombre}</span>
                <ChevronDown size={16} />
              </button>

              {showPaisMenu && (
                <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-yellow-500/30 rounded-xl min-w-[200px] shadow-2xl z-10 overflow-hidden">
                  {Object.entries(PAISES).map(([key, p]) => (
                    <button key={key} onClick={() => { setPaisSel(key); setShowPaisMenu(false); }} className={`w-full p-3 text-left ${paisSel === key ? 'bg-yellow-500/20' : 'hover:bg-gray-700'} transition-colors flex items-center gap-3 text-white text-sm`}>
                      <span className="text-2xl">{p.flag}</span>
                      <span className="font-bold">{p.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          {[
            { id: 'calcular', icon: Calculator, label: 'Productos', color: 'yellow' },
            { id: 'importar', icon: Upload, label: 'Importar', color: 'blue' },
            { id: 'resultados', icon: DollarSign, label: 'Resultados', color: 'green' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`p-3 md:p-4 font-bold rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 text-xs md:text-sm transition-all duration-300 transform
                ${isActive 
                    ? `bg-gradient-to-br from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg scale-105 border-2 border-white/50`
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`
                }>
                <tab.icon size={24} />
                <span>{tab.label}</span>
                </button>
            )
          })}
        </div>

        {feedbackMsg && (
          <div className={`p-4 mb-4 rounded-lg font-bold flex justify-between items-center ${feedbackMsg.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            <span className="text-sm">{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="ml-4 p-1 rounded-full hover:bg-white/10 transition">
              <X size={18} />
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'calcular' && (
            <>
              {/* Calculator Form Column */}
              <div className="space-y-6">
                 {/* Calculator form */}
                 <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                    <h2 className="text-xl font-bold mb-5 text-yellow-400 flex items-center gap-2">
                      {editId ? <Edit size={22} /> : <Plus size={22} />} {editId ? 'Editar Producto' : 'Calcular Producto'}
                    </h2>
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-300">📦 Nombre del Producto</label>
                            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Gafas de sol polarizadas" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">💰 Precio Venta ({pais.simbolo})</label>
                                <input type="number" value={form.pvp} onChange={(e) => setForm({ ...form, pvp: e.target.value })} placeholder="22000" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">🏷️ Coste Producto</label>
                                <input type="number" value={form.coste} onChange={(e) => setForm({ ...form, coste: e.target.value })} placeholder="4680" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">📮 Coste Envío</label>
                                <input type="number" value={form.envio} onChange={(e) => setForm({ ...form, envio: e.target.value })} placeholder="4680" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                            </div>
                        </div>
                        {pais.iva > 0 && (
                          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex justify-between items-center">
                              <div>
                                  <div className="text-sm font-bold text-gray-300">📊 ¿Añadir IVA al coste? ({pais.iva}%)</div>
                                  <div className="text-xs text-gray-400 mt-1">Activa si el proveedor cobra IVA</div>
                              </div>
                              <button onClick={() => setIncluirIva(!incluirIva)} className={`p-1 w-14 rounded-full transition-colors duration-300 ${incluirIva ? 'bg-green-500' : 'bg-gray-600'}`}>
                                  <span className={`block w-6 h-6 rounded-full bg-white transform transition-transform duration-300 ${incluirIva ? 'translate-x-6' : ''}`}></span>
                              </button>
                          </div>
                        )}
                        {/* CPA and Rates */}
                        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 space-y-4">
                            <h3 className="text-sm font-bold text-blue-300">⚙️ Tasas COD Esperadas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs mb-2 block text-gray-300 font-bold">📞 Confirman: <span className="text-yellow-400">{tasas.conf}%</span></label>
                                    <input type="range" min="1" max="100" value={tasas.conf} onChange={(e) => setTasas({ ...tasas, conf: parseInt(e.target.value) })} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs mb-2 block text-gray-300 font-bold">✅ Entregan: <span className="text-yellow-400">{tasas.entr}%</span></label>
                                    <input type="range" min="1" max="100" value={tasas.entr} onChange={(e) => setTasas({ ...tasas, entr: parseInt(e.target.value) })} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                                </div>
                            </div>
                            <div className="mt-2 p-2 bg-yellow-500/10 rounded-md text-center">
                                <span className="text-xs text-gray-300">📊 Tasa Final Esperada: </span>
                                <strong className="text-yellow-400 font-bold">{(tasas.conf * tasas.entr / 100).toFixed(1)}%</strong>
                            </div>
                        </div>
                         {/* CPA Medio */}
                        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30 space-y-4">
                            <h3 className="text-sm font-bold text-purple-300">🎯 CPA Medio de Campaña</h3>
                             <div>
                               <label className="block text-xs font-bold mb-2 text-gray-300">Moneda:</label>
                                <select
                                    value={cpaMedio.moneda}
                                    onChange={(e) => setCpaMedio({ ...cpaMedio, moneda: e.target.value })}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    {cpaOptions.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 text-gray-300">CPA que estás pagando:</label>
                                <input type="number" value={cpaMedio.valor} onChange={(e) => setCpaMedio({ ...cpaMedio, valor: e.target.value })} 
                                className="w-full p-3 text-xl font-bold rounded-lg border-2 border-purple-500/50 outline-none text-center bg-gray-700 text-white focus:ring-2 focus:ring-purple-500" placeholder="0.00" />
                                <p className="mt-2 text-xs text-gray-400 text-center">Ingresa tu CPA real de publicidad (en {cpaMedio.moneda})</p>
                            </div>
                        </div>
                     </div>
                 </div>
                 {/* ... Results column ... */}
                 {metricas && (
                   <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                     <h3 className="text-lg font-bold mb-4 text-yellow-400">💰 PROFIT POR PEDIDO</h3>
                      <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="p-2 bg-gray-700/50 rounded flex justify-between items-center text-xs">
                                <span className="text-gray-400">Ingreso esperado (PVP × tasa entrega):</span>
                                <span className="text-green-300 font-bold">+{pais.simbolo}{fmt(metricas.ingresoEsperado)}</span>
                              </div>
                              <div className="p-2 bg-gray-700/50 rounded flex justify-between items-center text-xs">
                                <span className="text-gray-400">Costo producto esperado:</span>
                                <span className="text-red-300 font-bold">−{pais.simbolo}{fmt(metricas.costoProductoEsperado)}</span>
                              </div>
                              <div className="p-2 bg-gray-700/50 rounded flex justify-between items-center text-xs">
                                <span className="text-gray-400">Costo envío (entregados):</span>
                                <span className="text-red-300 font-bold">−{pais.simbolo}{fmt(metricas.costoEnvioEsperado)}</span>
                              </div>
                              {metricas.costoDevolucionEsperado > 0 && (
                                <div className="p-2 bg-rose-500/10 rounded flex justify-between items-center text-xs border border-rose-500/30">
                                  <span className="text-rose-300">Flete retorno ({fmtDec((tasas.conf / 100) * (1 - tasas.entr / 100) * 100)}% pedidos devueltos):</span>
                                  <span className="text-rose-300 font-bold">−{pais.simbolo}{fmt(metricas.costoDevolucionEsperado)}</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg border-2 border-blue-500/40 flex justify-between items-center">
                              <span className="text-xs font-bold text-blue-200">Beneficio bruto esperado (COD):</span>
                              <span className="text-lg font-bold text-blue-300">{pais.simbolo}{fmt(metricas.beneficioEspCOD)}</span>
                            </div>

                            {cpaMedio.valor && parseFloat(cpaMedio.valor) > 0 ? (
                              (() => {
                                const pvp = parseFloat(form.pvp) || 0;
                                const cpaEnMonedaLocal = convertir(parseFloat(cpaMedio.valor), cpaMedio.moneda, pais.moneda);
                                const profitConCPA = metricas.beneficioEspCOD - cpaEnMonedaLocal;
                                const profitPercentage = pvp > 0 ? (profitConCPA / pvp) * 100 : 0;
                                
                                return (
                                  <div className={`p-4 rounded-xl text-center border-2 ${profitConCPA >= 0 ? 'bg-green-500/20 border-green-500/60' : 'bg-red-500/20 border-red-500/60'}`}>
                                    <p className="text-xs font-bold text-gray-400 uppercase">🎯 PROFIT FINAL POR PEDIDO</p>
                                    <p className={`my-1 text-5xl font-bold ${profitConCPA >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {fmtDec(profitPercentage)}%
                                    </p>
                                    <div className="flex justify-center gap-4 mt-2">
                                        <p className={`text-lg font-bold ${profitConCPA >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                          {pais.simbolo}{fmt(profitConCPA)}
                                        </p>
                                        <p className="text-lg text-gray-400">
                                          (${fmtDec(convertir(profitConCPA, pais.moneda, 'USD'))} USD)
                                        </p>
                                    </div>
                                    {profitConCPA < 0 && <div className="mt-3 p-2 bg-red-500/20 rounded-md text-center text-xs text-red-300 font-bold">⚠️ PRODUCTO NO RENTABLE</div>}
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="p-3 bg-yellow-500/10 rounded-lg text-center text-xs text-yellow-300">
                                💡 Ingresa tu CPA arriba para ver el profit final
                              </div>
                            )}
                          </div>
                   </div>
                 )}
                 {/* Submit button */}
                 <div className="flex gap-2 mt-6">
                    {editId && (
                      <button onClick={() => { setEditId(null); setForm({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '' }); }} className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition">Cancelar</button>
                    )}
                    <button onClick={handleSubmit} className="flex-1 py-3 px-4 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-lg transition flex items-center justify-center gap-2">
                      <Plus size={20} /> {editId ? 'Actualizar Producto' : 'Guardar Producto'}
                    </button>
                </div>
              </div>

              {/* Saved Products Column */}
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                 <h3 className="text-xl font-bold mb-5 text-gray-300">📦 Productos Guardados ({prodsPais.length})</h3>
                  {prodsPais.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <Package size={48} className="mx-auto mb-4 opacity-30" />
                      <p>No hay productos guardados para {pais.nombre}</p>
                      <p className="text-sm mt-2">Agrega tu primer producto</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prodsPais.map(p => {
                        // FIX: Property 'cpa8' does not exist on type 'Producto'. Changed to 'cpaObj' based on type definition.
                        const profitEscalaEquiv = p.beneficioEspCOD - p.cpaObj; // Legacy calc for display
                        return (
                          <div key={p.id} className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-white">{p.nombre}</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                PVP: {pais.simbolo}{fmt(p.pvp)} • Coste Total: {pais.simbolo}{fmt(p.costeConIva + p.envio)}
                              </p>
                              <p className={`mt-1 text-sm font-bold ${profitEscalaEquiv >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Beneficio Bruto Esperado: {pais.simbolo}{fmt(p.beneficioEspCOD)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(p)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"><Edit size={16} /></button>
                              <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </>
          )}

           {activeTab === 'importar' && (
              <>
                <div className="space-y-6">
                  {/* Investment */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                        <h2 className="text-xl font-bold mb-5 text-yellow-400 flex items-center gap-2"><DollarSign size={22}/>Inversión Publicitaria</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">Moneda Inversión:</label>
                                <select value={inversionData.moneda} onChange={(e) => setInversionData({ ...inversionData, moneda: e.target.value })} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg">
                                    {investmentCurrencies.map(currency => (
                                      <option key={currency} value={currency}>{currency}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">Monto Invertido ({inversionData.moneda}):</label>
                                <input type="number" value={inversionData.monto} onChange={(e) => setInversionData({ ...inversionData, monto: e.target.value })} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" placeholder="1000" />
                            </div>
                        </div>
                    </div>
                  
                </div>

                {/* File Upload Column */}
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-2 text-gray-300">📤 Importar Excel de Pedidos</h2>
                    <p className="text-sm text-gray-400 mb-6">Sube tu archivo Excel con el reporte de órdenes.</p>
                     <div className="bg-gray-900/50 p-6 rounded-xl border-2 border-dashed border-gray-600 text-center">
                        <Upload size={40} className="mx-auto text-gray-500 mb-4" />
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                            <span>{cargando ? 'Procesando...' : 'Seleccionar archivo'}</span>
                        </label>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={cargando} />
                        <p className="mt-4 text-xs text-gray-500">Soporta archivos .xlsx y .xls</p>
                    </div>

                    {historico.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-300">📋 Histórico de Importaciones</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                           {historico.map(h => (
                                <div key={h.id} className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{PAISES[h.pais].flag}</span>
                                            <h4 className="font-bold text-sm text-yellow-400 truncate">{h.archivo}</h4>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {h.fecha} • {h.datos.total} pedidos • {h.datos.entregados} entregados
                                        </p>
                                    </div>
                                    <button onClick={() => verResultados(h.id)} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 text-xs"><Eye size={14}/>Ver</button>
                                </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </>
            )}

            {activeTab === 'resultados' && (
              <>
               {!profitData ? (
                   <SummaryDashboard 
                    historico={historico} 
                    inversionData={inversionData} 
                    gastosOperativos={gastosOperativos}
                    setActiveTab={setActiveTab}
                  />
                ) : (
                <div className="lg:col-span-2">
                  <div className="mb-4">
                     <button onClick={() => setImportacionActiva(null)} className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition text-sm">
                        &larr; Volver al Resumen
                    </button>
                  </div>
                  <DetailedResultsDashboard 
                    profitData={profitData}
                    onInversionChange={handleInversionChangeForReport}
                    investmentCurrencies={investmentCurrencies}
                  />
                 </div>
                )}
              </>
            )}
        </div>
      </main>
    </div>
  );
}