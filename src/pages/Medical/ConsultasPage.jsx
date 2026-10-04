import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConsultas } from '../../services/consultaService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import {
  Stethoscope, Plus, Search as SearchIcon, X,
  Calendar, User, Users as UsersIcon, FileText,
  ClipboardList, Heart,
} from 'lucide-react';

const ConsultasPage = () => {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Columnas de DataTable (desktop) ── */
  const columns = [
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {new Date(getValue()).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Mascota',
      accessorKey: 'mascota.nombre',
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
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
      header: 'Motivo',
      accessorKey: 'motivo',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500 truncate block max-w-[280px]">
          {getValue() || '—'}
        </span>
      ),
    },
  ];

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      setLoading(true);
      const res = await getConsultas();
      setConsultas(res.data);
    } catch (error) {
      toast.error('Error al cargar consultas');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (consulta) => {
    navigate(`/consultas/${consulta.id}`);
  };

  /* ── Filtro por texto ── */
  const consultasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return consultas;
    const q = searchTerm.toLowerCase().trim();
    return consultas.filter((c) => {
      const mascota = c.mascota?.nombre?.toLowerCase() || '';
      const dueno = c.mascota?.dueno?.nombre?.toLowerCase() || '';
      const doctor = c.doctor?.nombre?.toLowerCase() || '';
      const motivo = c.motivo?.toLowerCase() || '';
      return (
        mascota.includes(q) ||
        dueno.includes(q) ||
        doctor.includes(q) ||
        motivo.includes(q)
      );
    });
  }, [consultas, searchTerm]);

  const hayBusqueda = searchTerm.trim().length > 0;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
            <Stethoscope className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Consultas Médicas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {consultasFiltradas.length} de {consultas.length} consulta
              {consultas.length !== 1 && 's'}
              {hayBusqueda && <span className="text-blue-600 font-medium"> (filtradas)</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/consultas/nueva')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-blue-700 active:bg-blue-800 transition
                     shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva Consulta
        </button>
      </div>

      {/* ═══ Búsqueda ═══ */}
      {consultas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por mascota, dueño, doctor o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      {consultasFiltradas.length === 0 ? (
        /* Estado vacío */
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay consultas que coincidan con tu búsqueda'
              : 'Aún no hay consultas registradas'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={() => navigate('/consultas/nueva')}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
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
              data={consultasFiltradas}
              onRowClick={handleRowClick}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {consultasFiltradas.map((consulta) => (
              <button
                key={consulta.id}
                type="button"
                onClick={() => handleRowClick(consulta)}
                className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200/60
                           p-3.5 transition active:scale-[0.995] active:bg-slate-50
                           hover:border-slate-300"
              >
                {/* Fila superior: ícono + mascota + fecha */}
                <div className="flex items-start gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-blue-600" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">
                      {consulta.mascota?.nombre || 'Mascota sin nombre'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                      <Calendar className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                      <span className="truncate tabular-nums">
                        {new Date(consulta.fecha).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Datos: dueño + doctor */}
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <UsersIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                        Dueño
                      </p>
                      <p className="text-xs text-slate-700 truncate">
                        {consulta.mascota?.dueno?.nombre || '—'}
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
                        {consulta.doctor?.nombre || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Motivo */}
                {consulta.motivo && (
                  <div className="pt-2.5 border-t border-slate-100 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" strokeWidth={2.2} />
                    <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                      {consulta.motivo}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultasPage;