import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFacturas } from '../../services/facturaService';
import { getTrabajadores } from '../../services/trabajadorService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

/* ── Config de estados ── */
const estadoConfig = {
  PENDIENTE: { label: 'Pendiente', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  ABONADA:   { label: 'Abonada',   badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  PAGADA:    { label: 'Pagada',    badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  ANULADA:   { label: 'Anulada',   badge: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
};

const estados = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ABONADA', label: 'Abonada' },
  { value: 'PAGADA', label: 'Pagada' },
  { value: 'ANULADA', label: 'Anulada' },
];

/* ── Formato de moneda ── */
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

/* ═══════════════════════════════════════════════════ */
const InvoicesPage = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtros, setFiltros] = useState({
    search: '',
    estado: '',
    vendedorId: '',
    fechaInicio: '',
    fechaFin: '',
  });

  /* ── Carga de vendedores (una vez) ── */
  useEffect(() => {
    cargarVendedores();
  }, []);

  /* ── Recarga facturas cuando cambian filtros que van al backend ── */
  useEffect(() => {
    cargarFacturas();
  }, [filtros.estado, filtros.vendedorId, filtros.fechaInicio, filtros.fechaFin]);

  const cargarVendedores = async () => {
    try {
      const res = await getTrabajadores();
      setVendedores(res.data);
    } catch (error) {
      toast.error('Error al cargar vendedores');
    }
  };

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.fechaInicio) params.desde = filtros.fechaInicio;
      if (filtros.fechaFin) params.hasta = filtros.fechaFin;

      const res = await getFacturas(params);
      let facturasData = res.data;

      /* Filtro local: vendedor */
      if (filtros.vendedorId) {
        facturasData = facturasData.filter(
          f => f.vendedor?.id === parseInt(filtros.vendedorId)
        );
      }

      /* Filtro local: búsqueda por texto */
      if (filtros.search) {
        const q = filtros.search.toLowerCase();
        facturasData = facturasData.filter(f =>
          f.numero?.toLowerCase().includes(q) ||
          f.cliente?.nombre?.toLowerCase().includes(q) ||
          f.vendedor?.nombre?.toLowerCase().includes(q)
        );
      }

      setFacturas(facturasData);
    } catch (error) {
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarFacturas();
  };

  const handleLimpiar = () => {
    setFiltros({
      search: '',
      estado: '',
      vendedorId: '',
      fechaInicio: '',
      fechaFin: '',
    });
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v !== '');

  /* ── Resumen rápido (sumas) ── */
  const totalFacturado = facturas.reduce((s, f) => s + Number(f.total || 0), 0);
  const totalCobrado = facturas.reduce((s, f) => s + Number(f.montoPagado || 0), 0);
  const totalPorCobrar = facturas.reduce((s, f) => s + Number(f.saldoPendiente || 0), 0);

  /* ── Columnas ── */
  const columns = [
    {
      header: 'Factura',
      accessorKey: 'numero',
      cell: ({ getValue, row }) => (
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-800 truncate">
            {getValue()}
          </p>
          <p className="text-[11px] text-gray-400">
            {new Date(row.original.fecha).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      header: 'Cliente',
      accessorKey: 'cliente.nombre',
      cell: ({ getValue, row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            {getValue() || '—'}
          </p>
          <p className="text-[11px] text-gray-400 truncate">
            CI: {row.original.cliente?.cedula || '—'}
          </p>
        </div>
      ),
    },
    {
      header: 'Vendedor',
      accessorKey: 'vendedor.nombre',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 truncate">
          {getValue() || '—'}
        </span>
      ),
    },
    {
      header: 'Total',
      accessorKey: 'total',
      cell: ({ getValue }) => (
        <span className="block text-right text-sm font-semibold text-gray-800 tabular-nums">
          {fmt(getValue())}
        </span>
      ),
    },
    {
      header: 'Pagado',
      accessorKey: 'montoPagado',
      cell: ({ getValue }) => (
        <span className="block text-right text-sm text-green-700 tabular-nums">
          {fmt(getValue())}
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
            className={`block text-right text-sm font-medium tabular-nums
              ${anulada ? 'text-gray-400' : saldo > 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {fmt(saldo)}
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
          badge: 'bg-gray-100 text-gray-700',
          dot: 'bg-gray-400',
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        );
      },
    },
  ];

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Facturación</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {facturas.length} {facturas.length === 1 ? 'factura' : 'facturas'}
            {hayFiltrosActivos && ' (filtradas)'}
          </p>
        </div>

        <button
          onClick={() => navigate('/facturacion/nueva')}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                     hover:bg-blue-700 transition w-full sm:w-auto shadow-sm shadow-blue-600/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Factura
        </button>
      </div>

      {/* ═══ Resumen (mini cards) ═══ */}
      {facturas.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <ResumenCard
            label="Facturado"
            value={fmt(totalFacturado)}
            color="text-gray-800"
            bg="bg-gray-50"
          />
          <ResumenCard
            label="Cobrado"
            value={fmt(totalCobrado)}
            color="text-green-700"
            bg="bg-green-50"
          />
          <ResumenCard
            label="Por cobrar"
            value={fmt(totalPorCobrar)}
            color="text-red-600"
            bg="bg-red-50"
          />
        </div>
      )}

      {/* ═══ Filtros ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
        <form onSubmit={handleBuscar}>
          {/* Fila principal: buscador + toggle */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                name="search"
                value={filtros.search}
                onChange={handleFiltroChange}
                placeholder="Buscar por número, cliente o vendedor..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltrosAbiertos(o => !o)}
              className="sm:hidden inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                         text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              {hayFiltrosActivos && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Filtros adicionales */}
          <div className={`${filtrosAbiertos ? 'grid' : 'hidden'} sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3`}>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {estados.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>

            <select
              name="vendedorId"
              value={filtros.vendedorId}
              onChange={handleFiltroChange}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los vendedores</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>

            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-medium text-gray-500">
                Desde
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-medium text-gray-500">
                Hasta
              </label>
              <input
                type="date"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botones acción */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              Filtrar
            </button>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={handleLimpiar}
                className="inline-flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium
                           hover:bg-gray-200 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ═══ Tabla ═══ */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="animate-spin w-8 h-8 mx-auto text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 mt-3">Cargando facturas...</p>
        </div>
      ) : facturas.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">
            {hayFiltrosActivos ? 'No hay facturas con esos filtros' : 'No hay facturas registradas'}
          </p>
          {hayFiltrosActivos ? (
            <button
              onClick={handleLimpiar}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={() => navigate('/facturacion/nueva')}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Crear la primera factura
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={facturas}
          onRowClick={(factura) => navigate(`/facturacion/${factura.id}`)}
          showGlobalFilter={false}
          rowClassName={(row) => row.estadoPago === 'ANULADA' ? 'opacity-50' : ''}
        />
      )}
    </div>
  );
};

/* ── Mini card de resumen ── */
const ResumenCard = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-xl p-3 border border-gray-100`}>
    <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </p>
    <p className={`text-base sm:text-lg font-bold ${color} mt-0.5 tabular-nums truncate`}>
      {value}
    </p>
  </div>
);

export default InvoicesPage;