import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCliente, updateCliente } from '../../services/clienteService';
import { updateMascota } from '../../services/mascotaService';
import { DataTable } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import {
  User, Pencil, FileText, Power, Search as SearchIcon, X,
  CreditCard, Phone, MapPin, Heart,
  Dog, Cat, PawPrint, Plus, ClipboardList, CheckCircle2,
  AlertTriangle, Home,
} from 'lucide-react';

const ClienteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const confirm = useConfirm();

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [mostrarMascotasInactivas, setMostrarMascotasInactivas] = useState(false);
  const [busquedaMascota, setBusquedaMascota] = useState('');

  useEffect(() => { loadCliente(); /* eslint-disable-next-line */ }, [id]);

  const loadCliente = async () => {
    try {
      setLoading(true);
      const res = await getCliente(id);
      setCliente(res.data);
      setImageError(false);
    } catch {
      toast.error('Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCliente = async () => {
    const accion = cliente.activo ? 'desactivar' : 'activar';
    const ok = await confirm({
      title: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} cliente`,
      message: `¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} a ${cliente.nombre}?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      variant: accion === 'desactivar' ? 'warning' : 'success',
    });
    if (!ok) return;
    try {
      await updateCliente(id, { ...cliente, activo: !cliente.activo });
      toast.success(`Cliente ${accion}do`);
      loadCliente();
    } catch {
      toast.error(`Error al ${accion} cliente`);
    }
  };

  const handleToggleMascota = async (mascota) => {
    const accion = mascota.activo ? 'desactivar' : 'activar';
    const ok = await confirm({
      title: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} mascota`,
      message: `¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} a ${mascota.nombre}?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      variant: accion === 'desactivar' ? 'warning' : 'success',
    });
    if (!ok) return;
    try {
      await updateMascota(mascota.id, { ...mascota, activo: !mascota.activo });
      toast.success(`Mascota ${accion}da`);
      loadCliente();
    } catch {
      toast.error(`Error al ${accion} mascota`);
    }
  };

  /* ── Columnas DataTable mascotas ── */
  const mascotaColumns = [
    {
      header: 'Mascota',
      accessorKey: 'nombre',
      cell: ({ getValue, row }) => {
        const activa = row.original.activo;
        const especie = row.original.especie?.nombre?.toLowerCase() || '';
        const Icon = especie.includes('gat') ? Cat : Dog;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                activa ? 'bg-cyan-100' : 'bg-slate-100'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 ${activa ? 'text-cyan-600' : 'text-slate-400'}`}
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
      header: 'Especie',
      accessorKey: 'especie.nombre',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600">{getValue() || '—'}</span>
      ),
    },
    {
      header: 'Raza',
      accessorKey: 'raza.nombre',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500">{getValue() || '—'}</span>
      ),
    },
    {
      header: 'Sexo',
      accessorKey: 'sexo',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-slate-400">—</span>;
        const isM = v === 'M';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
              isM ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
            }`}
          >
            {isM ? '♂ M' : '♀ F'}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: ({ getValue }) => {
        const activa = getValue();
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
              activa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {activa ? (
              <>
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                Activa
              </>
            ) : (
              <>
                <Power className="w-3 h-3" strokeWidth={2.5} />
                Inactiva
              </>
            )}
          </span>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            id: 'acciones',
            header: '',
            cell: ({ row }) => (
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleMascota(row.original)}
                  className={`p-2 rounded-lg transition ${
                    row.original.activo
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={row.original.activo ? 'Desactivar' : 'Activar'}
                >
                  <Power className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const mascotasFiltradas = (cliente?.mascotas || [])
    .filter((m) => mostrarMascotasInactivas || m.activo)
    .filter((m) => {
      if (!busquedaMascota) return true;
      const q = busquedaMascota.toLowerCase();
      return (
        m.nombre?.toLowerCase().includes(q) ||
        m.especie?.nombre?.toLowerCase().includes(q) ||
        m.raza?.nombre?.toLowerCase().includes(q)
      );
    });

  const totalMascotasActivas = (cliente?.mascotas || []).filter((m) => m.activo).length;
  const totalMascotasInactivas = (cliente?.mascotas || []).filter((m) => !m.activo).length;

  if (loading) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-cyan-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Cliente no encontrado</p>
          <button
            onClick={() => navigate('/clientes')}
            className="mt-3 text-cyan-600 hover:text-cyan-800 text-sm font-medium"
          >
            ← Volver a clientes
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto">
      <PageHeader
        icon="👤"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: cliente.nombre },
        ]}
        title={cliente.nombre}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <CreditCard className="w-3.5 h-3.5" strokeWidth={2.2} />
            CI: {cliente.cedula}
            {!cliente.activo && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-semibold">
                  <Power className="w-3 h-3" strokeWidth={2.5} />
                  Inactivo
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/clientes/${id}/editar`)}
              className="inline-flex items-center justify-center gap-1.5
                         bg-white text-slate-700 border border-slate-200
                         px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <Pencil className="w-4 h-4" strokeWidth={2.2} />
              Editar
            </button>
            <button
              onClick={() => navigate(`/clientes/${id}/facturas`)}
              className="inline-flex items-center justify-center gap-1.5
                         bg-cyan-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-cyan-700 active:bg-cyan-800 transition
                         shadow-sm shadow-cyan-600/20"
            >
              <FileText className="w-4 h-4" strokeWidth={2.2} />
              Facturas
            </button>
            {isAdmin && (
              <button
                onClick={handleToggleCliente}
                className={`inline-flex items-center justify-center gap-1.5
                           text-white px-3 py-2 rounded-lg text-sm font-medium transition
                           shadow-sm ${
                             cliente.activo
                               ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                               : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                           }`}
              >
                <Power className="w-4 h-4" strokeWidth={2.2} />
                {cliente.activo ? 'Desactivar' : 'Activar'}
              </button>
            )}
          </>
        }
      />

      {/* ═══ Card: Info cliente ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Foto / avatar */}
          <div className="shrink-0 mx-auto sm:mx-0">
            {cliente.foto && !imageError ? (
              <img
                src={getImageUrl(cliente.foto)}
                alt={cliente.nombre}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-200 shadow-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-2xl flex items-center justify-center border border-cyan-100">
                <User className="w-12 h-12 text-cyan-500" strokeWidth={1.8} />
              </div>
            )}
          </div>

          {/* Datos */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoBlock
                icon={CreditCard}
                label="Cédula"
                value={cliente.cedula}
                tone="cyan"
              />
              <InfoBlock
                icon={Phone}
                label="Teléfono"
                value={cliente.telefono}
                tone="cyan"
              />
              <InfoBlock
                icon={User}
                label="Sexo"
                value={cliente.sexo === 'M' ? 'Masculino' : cliente.sexo === 'F' ? 'Femenino' : '—'}
                tone="cyan"
              />
              <div className="sm:col-span-3">
                <InfoBlock
                  icon={MapPin}
                  label="Dirección"
                  value={cliente.direccion || '—'}
                  tone="cyan"
                />
              </div>
            </div>

            {/* Stats mascotas */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                  <PawPrint className="w-4 h-4 text-cyan-600" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Mascotas activas
                  </p>
                  <p className="text-lg font-bold text-cyan-700 tabular-nums">
                    {totalMascotasActivas}
                  </p>
                </div>
              </div>

              {isAdmin && totalMascotasInactivas > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Power className="w-4 h-4 text-slate-500" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Inactivas
                    </p>
                    <p className="text-lg font-bold text-slate-500 tabular-nums">
                      {totalMascotasInactivas}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Card: Mascotas ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Header de la sección */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1 h-5 bg-cyan-600 rounded-full"></span>
              <PawPrint className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Mascotas
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
                {mascotasFiltradas.length}
                {isAdmin && mostrarMascotasInactivas && totalMascotasInactivas > 0
                  ? ` / ${totalMascotasActivas + totalMascotasInactivas}`
                  : ''}
              </span>
            </div>

            <Link
              to={`/clientes/${id}/nueva-mascota`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5
                         bg-cyan-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium
                         hover:bg-cyan-700 active:bg-cyan-800 transition
                         shadow-sm shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Nueva Mascota
            </Link>
          </div>

          {/* Filtros */}
          {(totalMascotasActivas + totalMascotasInactivas) > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <div className="relative flex-1">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  strokeWidth={2.2}
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, especie o raza..."
                  value={busquedaMascota}
                  onChange={(e) => setBusquedaMascota(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                {busquedaMascota && (
                  <button
                    type="button"
                    onClick={() => setBusquedaMascota('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                               text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {isAdmin && totalMascotasInactivas > 0 && (
                <label className="inline-flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap select-none">
                  <input
                    type="checkbox"
                    checked={mostrarMascotasInactivas}
                    onChange={(e) => setMostrarMascotasInactivas(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                  />
                  Ver inactivas
                </label>
              )}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-3 sm:p-5">
          {mascotasFiltradas.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                <PawPrint className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
              </div>
              <p className="text-sm text-slate-500 font-medium px-4">
                {busquedaMascota
                  ? 'No hay mascotas que coincidan con la búsqueda'
                  : isAdmin && !mostrarMascotasInactivas && totalMascotasInactivas > 0
                  ? `Este cliente tiene ${totalMascotasInactivas} mascota${totalMascotasInactivas > 1 ? 's' : ''} inactiva${totalMascotasInactivas > 1 ? 's' : ''}`
                  : 'Este cliente no tiene mascotas registradas'}
              </p>
              {!busquedaMascota && (
                <Link
                  to={`/clientes/${id}/nueva-mascota`}
                  className="mt-3 inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Registrar la primera
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop: DataTable */}
              <div className="hidden lg:block">
                <DataTable
                  columns={mascotaColumns}
                  data={mascotasFiltradas}
                  onRowClick={(mascota) => navigate(`/mascotas/${mascota.id}`)}
                  showGlobalFilter={false}
                  rowClassName={(row) => (!row.activo ? 'opacity-50' : '')}
                />
              </div>

              {/* Móvil: cards táctiles */}
              <div className="lg:hidden space-y-2.5">
                {mascotasFiltradas.map((m) => {
                  const especie = m.especie?.nombre?.toLowerCase() || '';
                  const Icon = especie.includes('gat') ? Cat : Dog;
                  const isM = m.sexo === 'M';
                  return (
                    <div
                      key={m.id}
                      className={`bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden
                                 transition ${!m.activo ? 'opacity-60' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/mascotas/${m.id}`)}
                        className="w-full text-left p-3.5 hover:bg-slate-50/60 active:bg-slate-100/60 transition
                                   flex items-start gap-3"
                      >
                        <div
                          className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                            m.activo ? 'bg-cyan-100' : 'bg-slate-100'
                          }`}
                        >
                          <Icon
                            className={`w-5.5 h-5.5 ${m.activo ? 'text-cyan-600' : 'text-slate-400'}`}
                            strokeWidth={2.2}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm text-slate-800 truncate">
                              {m.nombre || 'Sin nombre'}
                            </p>
                            <span
                              className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                m.activo
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {m.activo ? 'On' : 'Off'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {m.especie?.nombre && (
                              <span className="text-[11px] text-slate-500">
                                {m.especie.nombre}
                              </span>
                            )}
                            {m.raza?.nombre && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="text-[11px] text-slate-500">
                                  {m.raza.nombre}
                                </span>
                              </>
                            )}
                          </div>
                          {m.sexo && (
                            <span
                              className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isM ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                              }`}
                            >
                              {isM ? '♂ M' : '♀ F'}
                            </span>
                          )}
                        </div>
                      </button>

                      {isAdmin && (
                        <div className="flex border-t border-slate-100">
                          <button
                            onClick={() => handleToggleMascota(m)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition ${
                              m.activo
                                ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                                : 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" strokeWidth={2.3} />
                            {m.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Bloque de info reutilizable ── */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    cyan: 'bg-cyan-50 text-cyan-600',
    slate: 'bg-slate-100 text-slate-500',
  }[tone];

  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneCls}`}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">
          {value || '—'}
        </p>
      </div>
    </div>
  );
};

export default ClienteDetailPage;