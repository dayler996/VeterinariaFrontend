import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes, updateCliente } from '../../services/clienteService';
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search as SearchIcon, X, Pencil, Power,
  AlertTriangle, Heart, User, Phone, CreditCard,
  UserCheck, UserX, CheckCircle2, ClipboardList,
} from 'lucide-react';

const ClientesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Columnas DataTable (desktop) ── */
  const columns = [
    {
      header: 'Cliente',
      accessorKey: 'nombre',
      cell: ({ getValue, row }) => {
        const activo = row.original.activo;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                activo ? 'bg-cyan-100' : 'bg-slate-100'
              }`}
            >
              <User
                className={`w-4 h-4 ${activo ? 'text-cyan-600' : 'text-slate-400'}`}
                strokeWidth={2.2}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {getValue() || '—'}
              </p>
              <p className="text-[11px] text-slate-400 tabular-nums">
                #{row.original.id}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Cédula',
      accessorKey: 'cedula',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="text-sm text-slate-600 tabular-nums">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Teléfono',
      accessorKey: 'telefono',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="text-sm text-slate-600 tabular-nums">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Sexo',
      accessorKey: 'sexo',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-slate-400">—</span>;
        const isF = v.toLowerCase().startsWith('f');
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
              isF ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {v}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: ({ getValue }) => {
        const activo = getValue();
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
              activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {activo ? (
              <>
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                Activo
              </>
            ) : (
              <>
                <Power className="w-3 h-3" strokeWidth={2.5} />
                Inactivo
              </>
            )}
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/clientes/${row.original.id}/editar`)}
            className="p-2 rounded-lg text-cyan-600 hover:bg-cyan-50 transition"
            title="Editar"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.2} />
          </button>
          {isAdmin && (
            <button
              onClick={() => handleToggleActivo(row.original)}
              className={`p-2 rounded-lg transition ${
                row.original.activo
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
              title={row.original.activo ? 'Desactivar' : 'Activar'}
            >
              <Power className="w-4 h-4" strokeWidth={2.2} />
            </button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const res = await getClientes(params);
      setClientes(res.data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (cliente) => {
    const accion = cliente.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este cliente?`)) return;
    try {
      await updateCliente(cliente.id, { ...cliente, activo: !cliente.activo });
      toast.success(`Cliente ${accion}do`);
      loadClientes();
    } catch (error) {
      toast.error(`Error al ${accion} cliente`);
    }
  };

  const handleRowClick = (cliente) => {
    navigate(`/clientes/${cliente.id}`);
  };

  const handleNew = () => {
    navigate('/clientes/nuevo');
  };

  /* ── Filtro por texto ── */
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    const q = searchTerm.toLowerCase().trim();
    return clientes.filter((c) => {
      const nombre = c.nombre?.toLowerCase() || '';
      const cedula = c.cedula?.toLowerCase() || '';
      const telefono = c.telefono?.toLowerCase() || '';
      return nombre.includes(q) || cedula.includes(q) || telefono.includes(q);
    });
  }, [clientes, searchTerm]);

  const hayBusqueda = searchTerm.trim().length > 0;

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-cyan-600 rounded-full" />
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/25 shrink-0">
            <Users className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Clientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {clientesFiltrados.length} de {clientes.length} cliente
              {clientes.length !== 1 && 's'}
              {hayBusqueda && <span className="text-cyan-600 font-medium"> (filtrados)</span>}
            </p>
          </div>
        </div>

        <button
          onClick={handleNew}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     bg-cyan-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-cyan-700 active:bg-cyan-800 transition
                     shadow-sm shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nuevo Cliente
        </button>
      </div>

      {/* ═══ Filtros ═══ */}
      {clientes.length > 0 && (
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
                placeholder="Buscar por nombre, cédula o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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

            {/* Toggle inactivos (solo admin) */}
            {isAdmin && (
              <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                />
                <span className="whitespace-nowrap">Ver inactivos</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* ═══ Contenido ═══ */}
      {clientesFiltrados.length === 0 ? (
        /* Estado vacío */
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay clientes que coincidan con tu búsqueda'
              : 'Aún no hay clientes registrados'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={handleNew}
              className="mt-3 text-cyan-600 hover:text-cyan-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-cyan-600 hover:text-cyan-800 text-sm font-medium inline-flex items-center gap-1"
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
              data={clientesFiltrados}
              onRowClick={handleRowClick}
              rowClassName={(row) => (!row.activo ? 'opacity-50' : '')}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className={`bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden
                           transition ${!cliente.activo ? 'opacity-60' : ''}`}
              >
                {/* Cabecera clickeable */}
                <button
                  type="button"
                  onClick={() => handleRowClick(cliente)}
                  className="w-full text-left p-3.5 hover:bg-slate-50/60 active:bg-slate-100/60 transition
                             flex items-start gap-3"
                >
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                      cliente.activo ? 'bg-cyan-100' : 'bg-slate-100'
                    }`}
                  >
                    <User
                      className={`w-5 h-5 ${cliente.activo ? 'text-cyan-600' : 'text-slate-400'}`}
                      strokeWidth={2.2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-slate-800 leading-tight truncate">
                        {cliente.nombre || 'Sin nombre'}
                      </p>
                      <span
                        className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                          cliente.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cliente.activo ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {cliente.cedula && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <CreditCard className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                          <span className="tabular-nums">{cliente.cedula}</span>
                        </span>
                      )}
                      {cliente.telefono && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Phone className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                          <span className="tabular-nums">{cliente.telefono}</span>
                        </span>
                      )}
                    </div>
                    {cliente.sexo && (
                      <span
                        className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          cliente.sexo.toLowerCase().startsWith('f')
                            ? 'bg-pink-50 text-pink-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {cliente.sexo}
                      </span>
                    )}
                  </div>
                </button>

                {/* Acciones */}
                <div className="flex border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                               text-cyan-600 hover:bg-cyan-50 active:bg-cyan-100 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={2.3} />
                    Editar
                  </button>
                  {isAdmin && (
                    <>
                      <div className="w-px bg-slate-100" />
                      <button
                        onClick={() => handleToggleActivo(cliente)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition ${
                          cliente.activo
                            ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                            : 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" strokeWidth={2.3} />
                        {cliente.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientesPage;