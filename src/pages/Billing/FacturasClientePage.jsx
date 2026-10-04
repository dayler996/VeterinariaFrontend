import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacturas } from '../../services/facturaService';
import { getCliente } from '../../services/clienteService';
import { generateHistorialFacturasPDF } from '../../services/pdfService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import {
  FileText, FileDown, Search as SearchIcon, X, Filter,
  ChevronRight, Receipt, TrendingUp, TrendingDown,
  Wallet, AlertTriangle, ClipboardList, Calendar,
} from 'lucide-react';

/* ── Config por estado de pago ── */
const estadoConfig = {
  PENDIENTE: {
    label: 'Pendiente',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  ABONADA: {
    label: 'Abonada',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  PAGADA: {
    label: 'Pagada',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ANULADA: {
    label: 'Anulada',
    badge: 'bg-slate-200 text-slate-600 border-slate-300',
    dot: 'bg-slate-400',
  },
};

const estados = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ABONADA', label: 'Abonada' },
  { value: 'PAGADA', label: 'Pagada' },
  { value: 'ANULADA', label: 'Anulada' },
];

const FacturasClientePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [search, setSearch] = useState('');

  const hayFiltros = estado || fechaInicio || fechaFin || search;

  useEffect(() => { cargarCliente(); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => {
    cargarFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, estado, fechaInicio, fechaFin, search]);

  const cargarCliente = async () => {
    try {
      const res = await getCliente(id);
      setCliente(res.data);
    } catch {
      toast.error('Error al cargar cliente');
    }
  };

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const params = {
        clienteId: id,
        page,
        limit: 10,
        estado: estado || undefined,
        desde: fechaInicio || undefined,
        hasta: fechaFin || undefined,
        search: search || undefined,
      };
      const res = await getFacturas(params);
      if (res.data && Array.isArray(res.data.data)) {
        setFacturas(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      } else if (Array.isArray(res.data)) {
        setFacturas(res.data);
        setTotalPages(1);
        setTotal(res.data.length);
      } else {
        throw new Error('Formato inesperado');
      }
    } catch (error) {
      console.error('Error cargando facturas:', error);
      toast.error('Error al cargar facturas');
      setFacturas([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setEstado('');
    setFechaInicio('');
    setFechaFin('');
    setSearch('');
    setPage(1);
  };

  const handleExportPDF = async () => {
    if (facturas.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const dataForPDF = facturas.map((f) => [
      f.numero,
      new Date(f.fecha).toLocaleDateString(),
      formatCurrency(f.total),
      formatCurrency(f.montoPagado),
      formatCurrency(f.saldoPendiente),
      f.estadoPago,
    ]);
    const sections = [
      {
        title: `Facturas de ${cliente?.nombre || 'Cliente'}`,
        type: 'table',
        headers: ['Número', 'Fecha', 'Total', 'Pagado', 'Saldo', 'Estado'],
        data: dataForPDF,
      },
    ];
    await generateHistorialFacturasPDF(`Facturas de ${cliente?.nombre || 'Cliente'}`, sections);
  };

  /* ── Totales (solo de la página actual) ── */
  const totalFacturado = facturas.reduce((s, f) => s + Number(f.total || 0), 0);
  const totalCobrado = facturas.reduce((s, f) => s + Number(f.montoPagado || 0), 0);
  const totalPorCobrar = facturas.reduce((s, f) => s + Number(f.saldoPendiente || 0), 0);

  /* ── Columnas DataTable (desktop) ── */
  const columns = [
    {
      header: 'Factura',
      accessorKey: 'numero',
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{getValue()}</p>
            <p className="text-[11px] text-slate-400 tabular-nums flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" strokeWidth={2.2} />
              {new Date(row.original.fecha).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Total',
      accessorKey: 'total',
      cell: ({ getValue }) => (
        <span className="block text-right text-sm font-semibold text-slate-800 tabular-nums">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      header: 'Pagado',
      accessorKey: 'montoPagado',
      cell: ({ getValue }) => (
        <span className="block text-right text-sm text-emerald-700 tabular-nums font-medium">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      header: 'Saldo',
      accessorKey: 'saldoPendiente',
      cell: ({ getValue, row }) => {
        const saldo = Number(getValue() || 0);
        const anulada = row.original.estadoPago === 'ANULADA';
        return (
          <span
            className={`block text-right text-sm font-medium tabular-nums ${
              anulada ? 'text-slate-400' : saldo > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(saldo)}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      accessorKey: 'estadoPago',
      cell: ({ getValue }) => {
        const cfg = estadoConfig[getValue()] || {
          label: getValue() || '—',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/facturacion/${row.original.id}`);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
        >
          Ver
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      ),
    },
  ];

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto">
      <PageHeader
        icon="🧾"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: cliente?.nombre || '...', to: `/clientes/${id}` },
          { label: 'Facturas' },
        ]}
        title={`Facturas de ${cliente?.nombre || '...'}`}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <FileText className="w-3.5 h-3.5" strokeWidth={2.2} />
            {total} {total === 1 ? 'factura' : 'facturas'}
            {hayFiltros && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold">
                Filtradas
              </span>
            )}
          </span>
        }
        actions={
          <button
            onClick={handleExportPDF}
            disabled={facturas.length === 0}
            className="inline-flex items-center justify-center gap-2
                       bg-blue-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium
                       hover:bg-blue-700 active:bg-blue-800 transition
                       disabled:opacity-50 shadow-sm shadow-blue-600/20"
          >
            <FileDown className="w-4 h-4" strokeWidth={2.2} />
            Exportar PDF
          </button>
        }
      />

      {/* ═══ Resumen (solo si hay facturas) ═══ */}
      {facturas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <ResumenCard
            icon={Receipt}
            label="Facturado"
            value={formatCurrency(totalFacturado)}
            tone="slate"
            hint="Total de facturas mostradas"
          />
          <ResumenCard
            icon={TrendingUp}
            label="Cobrado"
            value={formatCurrency(totalCobrado)}
            tone="emerald"
            hint="Pagos recibidos"
          />
          <ResumenCard
            icon={TrendingDown}
            label="Por cobrar"
            value={formatCurrency(totalPorCobrar)}
            tone="red"
            hint="Saldo pendiente"
          />
        </div>
      )}

      {/* ═══ Filtros ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por número de factura..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                           text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Toggle filtros móvil */}
          <button
            type="button"
            onClick={() => setFiltrosAbiertos((o) => !o)}
            className="sm:hidden relative inline-flex items-center justify-center gap-2 px-3 py-2.5
                       border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <Filter className="w-4 h-4" strokeWidth={2.2} />
            <span>Filtros</span>
            {hayFiltros && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filtros adicionales */}
        <div className={`${filtrosAbiertos ? 'grid' : 'hidden'} sm:grid sm:grid-cols-3 gap-2 mt-3`}>
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {estados.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-medium text-slate-500">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-medium text-slate-500">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {hayFiltros && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleLimpiarFiltros}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ═══ Contenido ═══ */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando facturas...</p>
        </div>
      ) : facturas.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayFiltros
              ? 'No hay facturas con esos filtros'
              : 'Este cliente no tiene facturas registradas'}
          </p>
          {hayFiltros ? (
            <button
              onClick={handleLimpiarFiltros}
              className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={() => navigate('/facturacion/nueva')}
              className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Receipt className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera factura
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: DataTable */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <DataTable
              columns={columns}
              data={facturas}
              onRowClick={(factura) => navigate(`/facturacion/${factura.id}`)}
              showGlobalFilter={false}
              hidePagination
              rowClassName={(row) => (row.estadoPago === 'ANULADA' ? 'opacity-50' : '')}
            />
          </div>

          {/* Móvil: cards táctiles */}
          <div className="lg:hidden space-y-2.5">
            {facturas.map((f) => {
              const cfg = estadoConfig[f.estadoPago] || {
                label: f.estadoPago || '—',
                badge: 'bg-slate-100 text-slate-600 border-slate-200',
                dot: 'bg-slate-400',
              };
              const anulada = f.estadoPago === 'ANULADA';
              const saldo = Number(f.saldoPendiente || 0);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => navigate(`/facturacion/${f.id}`)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm border border-slate-200/60
                             p-3.5 transition active:scale-[0.995] active:bg-slate-50
                             hover:border-slate-300 ${anulada ? 'opacity-60' : ''}`}
                >
                  {/* Fila superior: # + estado */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5 text-blue-600" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {f.numero}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                          {new Date(f.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Grid montos */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Total
                      </p>
                      <p className="text-sm font-semibold text-slate-800 tabular-nums mt-0.5 truncate">
                        {formatCurrency(f.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Pagado
                      </p>
                      <p className="text-sm font-medium text-emerald-700 tabular-nums mt-0.5 truncate">
                        {formatCurrency(f.montoPagado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Saldo
                      </p>
                      <p
                        className={`text-sm font-medium tabular-nums mt-0.5 truncate ${
                          anulada ? 'text-slate-400' : saldo > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(saldo)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── Card de resumen ── */
const ResumenCard = ({ icon: Icon, label, value, tone = 'slate', hint }) => {
  const tones = {
    slate: {
      bg: 'bg-slate-50 border-slate-200',
      icon: 'bg-slate-100 text-slate-600',
      value: 'text-slate-800',
    },
    emerald: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-600',
      value: 'text-emerald-700',
    },
    red: {
      bg: 'bg-red-50 border-red-200',
      icon: 'bg-red-100 text-red-600',
      value: 'text-red-600',
    },
  }[tone];

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${tones.bg}`}>
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tones.icon}`}>
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </div>
        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className={`text-base sm:text-lg font-bold tabular-nums truncate ${tones.value}`}>
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{hint}</p>
      )}
    </div>
  );
};

export default FacturasClientePage;