import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistorialMedico } from '../../services/mascotaService';
import { generateHistorialMedicoPDF } from '../../services/pdfService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

/* ── Config de tipos de evento (colores + iconos + labels) ── */
const tipoMap = {
  consulta: {
    label: 'Consulta',
    icon: '🩺',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  vacunacion: {
    label: 'Vacunación',
    icon: '💉',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  estudio: {
    label: 'Estudio',
    icon: '🔬',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
  },
  operacion: {
    label: 'Operación',
    icon: '⚕️',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
  },
  estetica: {
    label: 'Estética',
    icon: '✂️',
    badge: 'bg-pink-100 text-pink-700',
    dot: 'bg-pink-500',
  },
  hospitalizacion: {
    label: 'Hospitalización',
    icon: '🏥',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

/* ── Formato de fecha: "12 Oct 2026" ── */
const formatearFecha = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ── Icono de filtro ── */
const FilterIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

/* ═══════════════════════════════════════════════════ */
const HistorialMedicoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [mascotaNombre, setMascotaNombre] = useState('');

  /* Filtros */
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const hayFiltrosActivos = filtroTipo || fechaInicio || fechaFin || busqueda;

  /* ── Carga ── */
  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        tipo: filtroTipo || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        busqueda: busqueda || undefined,
      };
      const res = await getHistorialMedico(id, params);
      setEventos(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
      if (res.data.data.length > 0 && res.data.data[0].mascotaNombre) {
        setMascotaNombre(res.data.data[0].mascotaNombre);
      }
    } catch (error) {
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [id, page, filtroTipo, fechaInicio, fechaFin, busqueda]);

  const handleLimpiarFiltros = () => {
    setFiltroTipo('');
    setFechaInicio('');
    setFechaFin('');
    setBusqueda('');
    setPage(1);
  };

  /* ── Export PDF ── */
  const handleExportPDF = async () => {
    if (eventos.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const sections = [
      {
        title: 'Historial Médico',
        type: 'table',
        headers: ['Fecha', 'Tipo', 'Descripción', 'Profesional'],
        data: eventos.map(e => [
          formatearFecha(e.fecha),
          tipoMap[e.tipo]?.label || e.tipo,
          e.descripcion,
          e.profesional || '-',
        ]),
      },
    ];
    const tituloPDF = mascotaNombre ? `Historial de ${mascotaNombre}` : 'Historial Médico';
    await generateHistorialMedicoPDF(tituloPDF, sections);
  };

  /* ── Columnas de la tabla (desktop) ── */
  const columns = [
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap font-medium text-gray-800">
          {formatearFecha(getValue())}
        </span>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ getValue }) => {
        const t = getValue();
        const cfg = tipoMap[t];
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg?.badge || 'bg-gray-100 text-gray-700'}`}>
            <span>{cfg?.icon || '📋'}</span>
            {cfg?.label || t}
          </span>
        );
      },
    },
    {
      header: 'Descripción',
      accessorKey: 'descripcion',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-700">{getValue()}</span>
      ),
    },
    {
      header: 'Profesional',
      accessorKey: 'profesional',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() || '—'}</span>
      ),
    },
    {
      header: 'Detalle',
      accessorKey: 'detalle',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500">{getValue() || '—'}</span>
      ),
    },
    {
      id: 'acciones',                      // ← agrega esta línea
  header: 'Acciones',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/${row.original.tipo}s/${row.original.id}`)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
        >
          Ver
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ),
    },
  ];

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
            {mascotaNombre ? `Historial de ${mascotaNombre}` : 'Historial Médico'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {total} {total === 1 ? 'evento registrado' : 'eventos registrados'}
            {hayFiltrosActivos && ' (filtrados)'}
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                     hover:bg-green-700 transition w-full sm:w-auto shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* ─── Filtros ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
        {/* Fila 1: buscador + toggle (móvil) */}
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
              placeholder="Buscar en descripción, profesional..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
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
            <FilterIcon />
            Filtros
            {hayFiltrosActivos && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
          </button>
        </div>

        {/* Fila 2: filtros (colapsables en móvil) */}
        <div className={`${filtrosAbiertos ? 'grid' : 'hidden'} sm:grid sm:grid-cols-3 gap-2 mt-3`}>
          <select
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(tipoMap).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }}
            placeholder="Fecha inicio"
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            type="date"
            value={fechaFin}
            onChange={(e) => { setFechaFin(e.target.value); setPage(1); }}
            placeholder="Fecha fin"
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botón limpiar */}
        {hayFiltrosActivos && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleLimpiarFiltros}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium
                         inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ─── Contenido ─── */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="animate-spin w-8 h-8 mx-auto text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 mt-3">Cargando historial...</p>
        </div>
      ) : eventos.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">
            {hayFiltrosActivos ? 'No hay eventos con esos filtros' : 'No hay registros en el historial'}
          </p>
          {hayFiltrosActivos && (
            <button
              onClick={handleLimpiarFiltros}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ═══ Vista Desktop: Tabla ═══ */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={eventos}
              onRowClick={(row) => navigate(`/${row.tipo}s/${row.id}`)}
              hidePagination
              showGlobalFilter={false}
              
            />
          </div>

          {/* ═══ Vista Móvil: Timeline / Cards ═══ */}
          <div className="md:hidden space-y-3">
            {eventos.map((e) => {
              const cfg = tipoMap[e.tipo] || { label: e.tipo, icon: '📋', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
              return (
                <div
                  key={`${e.tipo}-${e.id}`}
                  onClick={() => navigate(`/${e.tipo}s/${e.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
                             active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Cabecera: fecha + tipo */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                      <span className="text-xs font-semibold text-gray-700">
                        {formatearFecha(e.fecha)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${cfg.badge}`}>
                      <span>{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Cuerpo */}
                  <div className="p-3">
                    <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
                      {e.descripcion}
                    </p>

                    {e.profesional && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {e.profesional}
                      </p>
                    )}

                    {e.detalle && (
                      <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2 italic">
                        {e.detalle}
                      </p>
                    )}
                  </div>

                  {/* Flechita indicando que se puede tocar */}
                  <div className="flex items-center justify-end gap-1 px-3 py-2 border-t border-gray-50 text-[11px] font-medium text-blue-600">
                    Ver detalle
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Paginación ─── */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistorialMedicoPage;