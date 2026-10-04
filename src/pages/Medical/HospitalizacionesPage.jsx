import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHospitalizaciones } from '../../services/hospitalizacionService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import {
  BedDouble, Plus, Search as SearchIcon, X,
  Calendar, Users as UsersIcon, Heart,
  ClipboardList, FileText, LogOut, Activity,
  Clock, CheckCircle2,
} from 'lucide-react';

const HospitalizacionesPage = () => {
  const navigate = useNavigate();
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Columnas de DataTable (desktop) ── */
  const columns = [
    {
      header: 'Ingreso',
      accessorKey: 'fechaIngreso',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {new Date(getValue()).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Mascota',
      accessorKey: 'mascota.nombre',
      cell: ({ getValue, row }) => {
        const activa = !row.original.fechaAlta;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activa ? 'bg-indigo-100' : 'bg-slate-100'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${activa ? 'text-indigo-600' : 'text-slate-400'}`}
                strokeWidth={2.2}
              />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-slate-800 truncate block">
                {getValue() || '—'}
              </span>
              {activa && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  En curso
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Dueño',
      accessorKey: 'mascota.dueno.nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <UsersIcon className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="text-sm text-slate-600 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Motivo',
      accessorKey: 'motivo',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500 truncate block max-w-[280px]">
          {getValue() || '—'}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'fechaAlta',
      cell: ({ getValue }) => {
        const fechaAlta = getValue();
        if (!fechaAlta) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold
                              bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Activity className="w-3 h-3" strokeWidth={2.5} />
              En curso
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium
                            bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            Alta
          </span>
        );
      },
    },
    {
      header: 'Alta',
      accessorKey: 'fechaAlta',
      cell: ({ getValue }) => {
        const value = getValue();
        if (!value) return <span className="text-xs text-slate-400">—</span>;
        return (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(value).toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  useEffect(() => {
    loadHospitalizaciones();
  }, []);

  const loadHospitalizaciones = async () => {
    try {
      setLoading(true);
      const res = await getHospitalizaciones();
      setHospitalizaciones(res.data);
    } catch (error) {
      toast.error('Error al cargar hospitalizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (hospitalizacion) => {
    navigate(`/hospitalizaciones/${hospitalizacion.id}`);
  };

  /* ── Filtro por texto ── */
  const hospitalizacionesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return hospitalizaciones;
    const q = searchTerm.toLowerCase().trim();
    return hospitalizaciones.filter((h) => {
      const mascota = h.mascota?.nombre?.toLowerCase() || '';
      const dueno = h.mascota?.dueno?.nombre?.toLowerCase() || '';
      const motivo = h.motivo?.toLowerCase() || '';
      return mascota.includes(q) || dueno.includes(q) || motivo.includes(q);
    });
  }, [hospitalizaciones, searchTerm]);

  const hayBusqueda = searchTerm.trim().length > 0;

  /* Contador de activas */
  const activas = hospitalizacionesFiltradas.filter((h) => !h.fechaAlta).length;

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-indigo-600 rounded-full" />
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
            <BedDouble className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
                Hospitalizaciones
              </h1>
              {activas > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                  bg-indigo-100 text-indigo-700 text-xs font-semibold
                                  border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  {activas} en curso
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {hospitalizacionesFiltradas.length} de {hospitalizaciones.length} registro
              {hospitalizaciones.length !== 1 && 's'}
              {hayBusqueda && <span className="text-indigo-600 font-medium"> (filtrados)</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/hospitalizaciones/nueva')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-indigo-700 active:bg-indigo-800 transition
                     shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva Hospitalización
        </button>
      </div>

      {/* ═══ Búsqueda ═══ */}
      {hospitalizaciones.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por mascota, dueño o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
      {hospitalizacionesFiltradas.length === 0 ? (
        /* Estado vacío */
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay hospitalizaciones que coincidan con tu búsqueda'
              : 'Aún no hay hospitalizaciones registradas'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={() => navigate('/hospitalizaciones/nueva')}
              className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center gap-1"
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
              data={hospitalizacionesFiltradas}
              onRowClick={handleRowClick}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {hospitalizacionesFiltradas.map((h) => {
              const activa = !h.fechaAlta;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleRowClick(h)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm border overflow-hidden
                             transition active:scale-[0.995] active:bg-slate-50
                             ${activa
                               ? 'border-indigo-200 ring-1 ring-indigo-100'
                               : 'border-slate-200/60 hover:border-slate-300'}`}
                >
                  {/* Barra superior de estado */}
                  <div
                    className={`h-1 w-full ${activa ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' : 'bg-slate-200'}`}
                  />

                  <div className="p-3.5">
                    {/* Fila superior: ícono + mascota + badge */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          activa ? 'bg-indigo-100' : 'bg-slate-100'
                        }`}
                      >
                        <BedDouble
                          className={`w-5 h-5 ${activa ? 'text-indigo-600' : 'text-slate-500'}`}
                          strokeWidth={2.2}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {h.mascota?.nombre || 'Mascota sin nombre'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                          <Calendar className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                          <span className="truncate tabular-nums">
                            Ingreso:{' '}
                            {new Date(h.fechaIngreso).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      {activa ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                                          bg-indigo-100 text-indigo-700 border border-indigo-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          En curso
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                                          bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                          Alta
                        </span>
                      )}
                    </div>

                    {/* Motivo destacado */}
                    {h.motivo && (
                      <div className="flex items-start gap-2 px-2.5 py-2 mb-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" strokeWidth={2.2} />
                        <p className="text-xs text-slate-700 line-clamp-2 leading-snug">
                          {h.motivo}
                        </p>
                      </div>
                    )}

                    {/* Datos: dueño + alta */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <UsersIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                            Dueño
                          </p>
                          <p className="text-xs text-slate-700 truncate">
                            {h.mascota?.dueno?.nombre || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {h.fechaAlta ? (
                          <>
                            <LogOut className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.2} />
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                                Alta
                              </p>
                              <p className="text-xs text-slate-700 truncate tabular-nums">
                                {new Date(h.fechaAlta).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" strokeWidth={2.2} />
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                                Estado
                              </p>
                              <p className="text-xs text-indigo-700 font-medium truncate">
                                En tratamiento
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default HospitalizacionesPage;