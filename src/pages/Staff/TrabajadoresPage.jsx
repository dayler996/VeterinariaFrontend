import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrabajadores, createTrabajador, updateTrabajador } from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImageUploader from '../../components/common/ImageUploader';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import {
  UserCog, UserPlus, Pencil, Power, Search as SearchIcon, X,
  Check, AlertTriangle, CreditCard, Cake, Briefcase, Camera,
  Heart, Building2, Shield, CheckCircle2, ClipboardList,
  Users as UsersIcon, Filter, User as UserIcon,
} from 'lucide-react';

/* ── Schema ── */
const trabajadorSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().optional(),
  activo: z.boolean().default(true),
});

/* ═══════════════════════════════════════════════════ */
const TrabajadoresPage = () => {
  const navigate = useNavigate();
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [cedulaDisplay, setCedulaDisplay] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: { sexo: 'M', activo: true },
  });

  const foto = watch('foto');
  const activoWatch = watch('activo');

  /* ── Carga ── */
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trabRes, carRes] = await Promise.all([
        getTrabajadores(null, mostrarInactivos),
        getCargos(),
      ]);
      setTrabajadores(trabRes.data);
      setCargos(carRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  /* ── Handlers ── */
  const handleNew = () => {
    setSelectedTrabajador(null);
    setCedulaDisplay('');
    reset({ sexo: 'M', foto: '', activo: true });
    setModalOpen(true);
  };

  const handleEdit = (trabajador) => {
    setSelectedTrabajador(trabajador);
    setCedulaDisplay(trabajador.cedula || '');
    reset({
      nombre: trabajador.nombre,
      cedula: trabajador.cedula,
      sexo: trabajador.sexo,
      fechaNacimiento: trabajador.fechaNacimiento
        ? new Date(trabajador.fechaNacimiento).toISOString().split('T')[0]
        : '',
      cargoId: trabajador.cargoId,
      foto: trabajador.foto || '',
      activo: trabajador.activo,
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (trabajador) => {
    const accion = trabajador.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este trabajador?`)) return;
    try {
      await updateTrabajador(trabajador.id, { ...trabajador, activo: !trabajador.activo });
      toast.success(`Trabajador ${accion}do`);
      loadData();
    } catch {
      toast.error(`Error al ${accion} trabajador`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedTrabajador) {
        await updateTrabajador(selectedTrabajador.id, data);
        toast.success('Trabajador actualizado');
      } else {
        await createTrabajador(data);
        toast.success('Trabajador creado');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Filtrado ── */
  const trabajadoresFiltrados = useMemo(() => {
    return trabajadores
      .filter((t) => !filtroCargo || t.cargoId === parseInt(filtroCargo))
      .filter((t) => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase().trim();
        return (
          t.nombre?.toLowerCase().includes(q) ||
          t.cedula?.toLowerCase().includes(q) ||
          t.cargo?.nombre?.toLowerCase().includes(q)
        );
      });
  }, [trabajadores, busqueda, filtroCargo]);

  const hayFiltros = busqueda.trim() || filtroCargo;

  /* ── Columnas ── */
  const columns = [
    {
      header: 'Trabajador',
      accessorKey: 'nombre',
      cell: ({ row }) => {
        const t = row.original;
        const activo = t.activo;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            {t.foto ? (
              <img
                src={getImageUrl(t.foto)}
                alt={t.nombre}
                className={`w-9 h-9 rounded-lg object-cover border shrink-0
                  ${activo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                ${activo ? 'bg-slate-100' : 'bg-slate-50'}`}>
                <UserCog
                  className={`w-4 h-4 ${activo ? 'text-slate-600' : 'text-slate-400'}`}
                  strokeWidth={2.2}
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{t.nombre}</p>
              <p className="text-[11px] text-slate-400 tabular-nums">CI: {t.cedula}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Cargo',
      accessorKey: 'cargo.nombre',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-slate-400">—</span>;
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                            bg-slate-100 text-slate-700 border border-slate-200
                            text-[11px] font-semibold">
            <Briefcase className="w-3 h-3" strokeWidth={2.5} />
            {v}
          </span>
        );
      },
    },
    {
      header: 'Sexo',
      accessorKey: 'sexo',
      cell: ({ getValue }) => {
        const v = getValue();
        const isM = v === 'M';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold
            ${isM ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
            {isM ? '♂ M' : '♀ F'}
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
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
            ${activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
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
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/trabajadores/${row.original.id}/editar`)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
            title="Editar"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <button
            onClick={() => handleToggleActivo(row.original)}
            className={`p-2 rounded-lg transition
              ${row.original.activo
                ? 'text-red-600 hover:bg-red-50'
                : 'text-emerald-600 hover:bg-emerald-50'}`}
            title={row.original.activo ? 'Desactivar' : 'Activar'}
          >
            <Power className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-slate-700 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      <PageHeader
        icon="👨‍⚕️"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Personal' },
        ]}
        title="Personal"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <UserCog className="w-3.5 h-3.5" strokeWidth={2.2} />
            {trabajadoresFiltrados.length} de {trabajadores.length} trabajador{trabajadores.length !== 1 && 'es'}
            {hayFiltros && <span className="text-slate-600 font-medium"> (filtrados)</span>}
          </span>
        }
        actions={
          <>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition select-none">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="w-4 h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-500"
              />
              <span className="whitespace-nowrap">Inactivos</span>
            </label>
            <button
              onClick={handleNew}
              className="inline-flex items-center justify-center gap-1.5
                         bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-slate-900 active:bg-black transition
                         shadow-sm shadow-slate-800/20"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2.5} />
              Nuevo Trabajador
            </button>
          </>
        }
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-700/25 shrink-0">
          <UsersIcon className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Equipo de trabajo
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            Personal del sistema
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Shield className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            Cada trabajador tiene un cargo que define sus permisos
          </p>
        </div>
      </div>

      {/* ═══ Filtros ═══ */}
      {trabajadores.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Búsqueda */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <SearchIcon className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Búsqueda
              </label>
              <div className="relative">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  strokeWidth={2.2}
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula o cargo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                               text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Filtro por cargo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Cargo
              </label>
              <div className="relative">
                <Briefcase
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  strokeWidth={2.2}
                />
                <select
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white appearance-none cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                             hover:border-slate-400 transition"
                >
                  <option value="">Todos los cargos</option>
                  {cargos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {hayFiltros && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { setBusqueda(''); setFiltroCargo(''); }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold
                           inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Contenido ═══ */}
      {trabajadoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayFiltros
              ? 'No hay trabajadores que coincidan con tu búsqueda'
              : 'Aún no hay trabajadores registrados'}
          </p>
          {!hayFiltros && (
            <button
              onClick={handleNew}
              className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayFiltros && (
            <button
              onClick={() => { setBusqueda(''); setFiltroCargo(''); }}
              className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ═══ DESKTOP: Tabla ═══ */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <DataTable
              columns={columns}
              data={trabajadoresFiltrados}
              onRowClick={(row) => navigate(`/trabajadores/${row.id}`)}
              showGlobalFilter={false}
              rowClassName={(row) => (!row.activo ? 'opacity-60' : '')}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {trabajadoresFiltrados.map((t) => {
              const isM = t.sexo === 'M';
              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden
                             transition ${!t.activo ? 'opacity-60' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/trabajadores/${t.id}`)}
                    className="w-full text-left p-3.5 hover:bg-slate-50/60 active:bg-slate-100/60 transition
                               flex items-start gap-3"
                  >
                    {t.foto ? (
                      <img
                        src={getImageUrl(t.foto)}
                        alt={t.nombre}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <UserCog className="w-5 h-5 text-slate-600" strokeWidth={2.2} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {t.nombre || 'Sin nombre'}
                        </p>
                        <span
                          className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide
                            ${t.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'}`}
                        >
                          {t.activo ? 'On' : 'Off'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                        CI: {t.cedula}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {t.cargo?.nombre && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                                            bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            <Briefcase className="w-2.5 h-2.5" strokeWidth={2.5} />
                            {t.cargo.nombre}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold
                            ${isM ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}
                        >
                          {isM ? '♂ M' : '♀ F'}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/trabajadores/${t.id}/editar`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Editar
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      onClick={() => handleToggleActivo(t)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition
                        ${t.activo
                          ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                          : 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'}`}
                    >
                      <Power className="w-3.5 h-3.5" strokeWidth={2.3} />
                      {t.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ Modal ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !isSubmitting && setModalOpen(false)}
        title={selectedTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ─── Sección: Datos personales ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
              <UserCog className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">Datos personales</h3>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                placeholder="Ej: Juan Pérez"
                {...register('nombre')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                  ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.nombre && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.nombre.message}
                </p>
              )}
            </div>

            {/* Cédula + Sexo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                  Cédula <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cedulaDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw.length <= 10) {
                      setCedulaDisplay(raw);
                      setValue('cedula', raw, { shouldValidate: true });
                    }
                  }}
                  placeholder="12345678"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white tabular-nums
                    focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                    ${errors.cedula ? 'border-red-400' : 'border-slate-300'}`}
                />
                <input type="hidden" {...register('cedula')} />
                {errors.cedula && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                    {errors.cedula.message}
                  </p>
                )}
                {!errors.cedula && cedulaDisplay && (
                  <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                    {cedulaDisplay.length}/10 dígitos
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                  Sexo <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('sexo')}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                    ${errors.sexo ? 'border-red-400' : 'border-slate-300'}`}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {errors.sexo && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                    {errors.sexo.message}
                  </p>
                )}
              </div>
            </div>

            {/* Fecha nacimiento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                Fecha de nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('fechaNacimiento')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                  ${errors.fechaNacimiento ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.fechaNacimiento && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.fechaNacimiento.message}
                </p>
              )}
            </div>
          </section>

          {/* ─── Sección: Info laboral ─── */}
          <section className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
              <Briefcase className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">Información laboral</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                Cargo <span className="text-red-500">*</span>
              </label>
              <select
                {...register('cargoId', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                  ${errors.cargoId ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">Seleccione un cargo</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.cargoId && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.cargoId.message}
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                <Shield className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
                El cargo define los permisos y roles disponibles
              </p>
            </div>

            <div>
              <ImageUploader
                value={foto}
                onChange={(url) => setValue('foto', url)}
                folder="trabajador"
                label="Foto del trabajador"
              />
            </div>
          </section>

          {/* ─── Sección: Estado ─── */}
          <section className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer
                              hover:bg-slate-100 transition select-none">
              <input
                type="checkbox"
                {...register('activo')}
                className="w-4 h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-500"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-slate-700">
                  Trabajador activo
                </span>
                <span className="block text-[11px] text-slate-500">
                  Los inactivos no aparecen en listados operativos
                </span>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition
                  ${activoWatch ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
              >
                {activoWatch ? (
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
            </label>
          </section>

          {/* ─── Botones ─── */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2
                         px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                         hover:bg-slate-200 active:bg-slate-300 transition
                         order-2 sm:order-1 disabled:opacity-50"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2
                         px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium
                         hover:bg-slate-900 active:bg-black transition
                         order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-sm shadow-slate-800/20"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrabajadoresPage;