import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOperaciones } from '../../services/operacionService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import {
  Stethoscope, Plus, Search as SearchIcon, X,
  Calendar, User, Heart, Activity, ClipboardList,
  Scissors,
} from 'lucide-react';

const OperacionesPage = () => {
  const navigate = useNavigate();
  const [operaciones, setOperaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Columnas de DataTable (desktop) ── */
  const columns = [
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {new Date(getValue()).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Mascota',
      accessorKey: 'mascota.nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-orange-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">
            {getValue() || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo.nombre',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                          bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
          <Stethoscope className="w-3 h-3" strokeWidth={2.5} />
          {getValue() || '—'}
        </span>
      ),
    },
    {
      header: 'Cirujano',
      accessorKey: 'cirujano.nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="text-sm text-slate-600 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadOperaciones();
  }, []);

  const loadOperaciones = async () => {
    try {
      setLoading(true);
      const res = await getOperaciones();
      setOperaciones(res.data);
    } catch (error) {
      toast.error('Error al cargar operaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (operacion) => {
    navigate(`/operaciones/${operacion.id}`);
  };

  /* ── Filtro por texto ── */
  const operacionesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return operaciones;
    const q = searchTerm.toLowerCase().trim();
    return operaciones.filter((o) => {
      const mascota = o.mascota?.nombre?.toLowerCase() || '';
      const tipo = o.tipo?.nombre?.toLowerCase() || '';
      const cirujano = o.cirujano?.nombre?.toLowerCase() || '';
      return mascota.includes(q) || tipo.includes(q) || cirujano.includes(q);
    });
  }, [operaciones, searchTerm]);

  const hayBusqueda = searchTerm.trim().length > 0;

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-orange-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/25 shrink-0">
            <Stethoscope className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Operaciones
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {operacionesFiltradas.length} de {operaciones.length} operaci
              {operaciones.length === 1 ? 'ón' : 'ones'}
              {hayBusqueda && <span className="text-orange-600 font-medium"> (filtradas)</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/operaciones/nueva')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-orange-700 active:bg-orange-800 transition
                     shadow-sm shadow-orange-600/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva Operación
        </button>
      </div>

      {/* ═══ Búsqueda ═══ */}
      {operaciones.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por mascota, tipo o cirujano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                           text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ Contenido ═══ */}
      {operacionesFiltradas.length === 0 ? (
        /* Estado vacío */
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay operaciones que coincidan con tu búsqueda'
              : 'Aún no hay operaciones registradas'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={() => navigate('/operaciones/nueva')}
              className="mt-3 text-orange-600 hover:text-orange-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-orange-600 hover:text-orange-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ═══ DESKTOP: Tabla ═══ */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <DataTable
              columns={columns}
              data={operacionesFiltradas}
              onRowClick={handleRowClick}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {operacionesFiltradas.map((operacion) => (
              <button
                key={operacion.id}
                type="button"
                onClick={() => handleRowClick(operacion)}
                className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200/60
                           p-3.5 transition active:scale-[0.995] active:bg-slate-50
                           hover:border-slate-300"
              >
                {/* Fila superior: ícono + mascota + fecha */}
                <div className="flex items-start gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-orange-600" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">
                      {operacion.mascota?.nombre || 'Mascota sin nombre'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                      <Calendar className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                      <span className="truncate tabular-nums">
                        {new Date(operacion.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tipo destacado */}
                {operacion.tipo?.nombre && (
                  <div className="flex items-center gap-2 px-2.5 py-2 mb-2.5 rounded-lg bg-orange-50 border border-orange-100">
                    <Activity className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
                    <p className="text-xs font-medium text-orange-800 truncate">
                      {operacion.tipo.nombre}
                    </p>
                  </div>
                )}

                {/* Cirujano */}
                <div className="flex items-center gap-1.5 min-w-0 pt-2 border-t border-slate-100">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                      Cirujano
                    </p>
                    <p className="text-xs text-slate-700 truncate">
                      {operacion.cirujano?.nombre || '—'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OperacionesPage;