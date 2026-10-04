import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVacunaciones } from '../../services/vacunacionService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import {
  Syringe, Plus, Search as SearchIcon, X,
  Calendar, User, Users as UsersIcon, Heart,
  CalendarClock, ShieldCheck, ClipboardList,
} from 'lucide-react';

const VacunacionesPage = () => {
  const navigate = useNavigate();
  const [vacunaciones, setVacunaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Columnas de DataTable (desktop) ── */
  const columns = [
    {
      header: 'Fecha',
      accessorKey: 'fechaAplicacion',
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
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-emerald-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">
            {getValue() || '—'}
          </span>
        </div>
      ),
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
      header: 'Vacuna',
      accessorKey: 'vacuna.nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <Syringe className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={2.2} />
          <span className="text-sm text-slate-700 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Doctor',
      accessorKey: 'doctor.nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="text-sm text-slate-600 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Refuerzo',
      accessorKey: 'proximoRefuerzo',
      cell: ({ getValue }) => {
        const value = getValue();
        if (!value) {
          return <span className="text-xs text-slate-400">—</span>;
        }
        const fecha = new Date(value);
        const hoy = new Date();
        const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));

        // Vencido, próximo o vigente
        let colorCls = 'bg-slate-100 text-slate-600';
        if (diasRestantes < 0) colorCls = 'bg-red-100 text-red-700';
        else if (diasRestantes <= 7) colorCls = 'bg-amber-100 text-amber-700';
        else colorCls = 'bg-blue-100 text-blue-700';

        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium tabular-nums ${colorCls}`}>
            <CalendarClock className="w-3 h-3" strokeWidth={2.5} />
            {fecha.toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  useEffect(() => {
    loadVacunaciones();
  }, []);

  const loadVacunaciones = async () => {
    try {
      setLoading(true);
      const res = await getVacunaciones();
      setVacunaciones(res.data);
    } catch (error) {
      toast.error('Error al cargar vacunaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (vacunacion) => {
    navigate(`/vacunaciones/${vacunacion.id}`);
  };

  /* ── Filtro por texto ── */
  const vacunacionesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return vacunaciones;
    const q = searchTerm.toLowerCase().trim();
    return vacunaciones.filter((v) => {
      const mascota = v.mascota?.nombre?.toLowerCase() || '';
      const dueno = v.mascota?.dueno?.nombre?.toLowerCase() || '';
      const doctor = v.doctor?.nombre?.toLowerCase() || '';
      const vacuna = v.vacuna?.nombre?.toLowerCase() || '';
      return (
        mascota.includes(q) ||
        dueno.includes(q) ||
        doctor.includes(q) ||
        vacuna.includes(q)
      );
    });
  }, [vacunaciones, searchTerm]);

  const hayBusqueda = searchTerm.trim().length > 0;

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
            <Syringe className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Vacunaciones
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {vacunacionesFiltradas.length} de {vacunaciones.length} vacunaci
              {vacunaciones.length === 1 ? 'ón' : 'ones'}
              {hayBusqueda && <span className="text-emerald-600 font-medium"> (filtradas)</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/vacunaciones/nueva')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-emerald-700 active:bg-emerald-800 transition
                     shadow-sm shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva Vacunación
        </button>
      </div>

      {/* ═══ Búsqueda ═══ */}
      {vacunaciones.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por mascota, dueño, vacuna o doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
      {vacunacionesFiltradas.length === 0 ? (
        /* Estado vacío */
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay vacunaciones que coincidan con tu búsqueda'
              : 'Aún no hay vacunaciones registradas'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={() => navigate('/vacunaciones/nueva')}
              className="mt-3 text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1"
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
              data={vacunacionesFiltradas}
              onRowClick={handleRowClick}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {vacunacionesFiltradas.map((vacunacion) => {
              const refuerzo = vacunacion.proximoRefuerzo
                ? new Date(vacunacion.proximoRefuerzo)
                : null;
              const diasRestantes = refuerzo
                ? Math.ceil((refuerzo - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              let refuerzoCls = 'bg-slate-100 text-slate-600 border-slate-200';
              let refuerzoLabel = '';
              if (diasRestantes !== null) {
                if (diasRestantes < 0) {
                  refuerzoCls = 'bg-red-50 text-red-700 border-red-200';
                  refuerzoLabel = 'Vencido';
                } else if (diasRestantes <= 7) {
                  refuerzoCls = 'bg-amber-50 text-amber-700 border-amber-200';
                  refuerzoLabel = `En ${diasRestantes}d`;
                } else {
                  refuerzoCls = 'bg-blue-50 text-blue-700 border-blue-200';
                  refuerzoLabel = `En ${diasRestantes}d`;
                }
              }

              return (
                <button
                  key={vacunacion.id}
                  type="button"
                  onClick={() => handleRowClick(vacunacion)}
                  className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200/60
                             p-3.5 transition active:scale-[0.995] active:bg-slate-50
                             hover:border-slate-300"
                >
                  {/* Fila superior: ícono + mascota + fecha */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Syringe className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {vacunacion.mascota?.nombre || 'Mascota sin nombre'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                        <Calendar className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                        <span className="truncate tabular-nums">
                          {new Date(vacunacion.fechaAplicacion).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    {refuerzo && (
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${refuerzoCls}`}>
                        <CalendarClock className="w-3 h-3" strokeWidth={2.5} />
                        {refuerzoLabel}
                      </span>
                    )}
                  </div>

                  {/* Vacuna destacada */}
                  <div className="flex items-center gap-2 px-2.5 py-2 mb-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
                    <p className="text-xs font-medium text-blue-800 truncate">
                      {vacunacion.vacuna?.nombre || 'Vacuna sin nombre'}
                    </p>
                  </div>

                  {/* Datos: dueño + doctor */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UsersIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                          Dueño
                        </p>
                        <p className="text-xs text-slate-700 truncate">
                          {vacunacion.mascota?.dueno?.nombre || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                          Doctor
                        </p>
                        <p className="text-xs text-slate-700 truncate">
                          {vacunacion.doctor?.nombre || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fecha de refuerzo en detalle */}
                  {refuerzo && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                      <CalendarClock className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                      <span>Próximo refuerzo:</span>
                      <span className="font-medium text-slate-700 tabular-nums">
                        {refuerzo.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default VacunacionesPage;