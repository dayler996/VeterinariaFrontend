// frontend/src/pages/Catalogos/TrabajadoresPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTrabajadores, createTrabajador, updateTrabajador,
} from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImageUploader from '../../components/common/ImageUploader';
import SelectField from '../../components/common/SelectField';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import {
  UserCog, UserPlus, Pencil, Power, Search as SearchIcon, X,
  Check, AlertTriangle, CreditCard, Cake, Briefcase, Camera,
  Heart, Building2, Shield, CheckCircle2, ClipboardList,
  Users as UsersIcon, Filter, User as UserIcon,
  Sparkles, XCircle, Info, ArrowRight,
  Mars, Venus,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const trabajadorSchema = z.object({
  nombre: z
    .string()
    .min(1, 'Nombre requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  cedula: z
    .string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .min(6, 'Mínimo 6 dígitos')
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
  const confirm = useConfirm();

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
    register, handleSubmit, reset, setValue, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(trabajadorSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { sexo: 'M', activo: true, cargoId: null, foto: '' },
  });

  const foto = watch('foto');
  const activoWatch = watch('activo');
  const nombreWatch = watch('nombre');
  const cedulaWatch = watch('cedula');
  const sexoWatch = watch('sexo');
  const fechaNacimientoWatch = watch('fechaNacimiento');
  const cargoIdWatch = watch('cargoId');

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
    reset({ sexo: 'M', foto: '', activo: true, cargoId: null });
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
    const ok = await confirm({
      title: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} trabajador`,
      message: `¿Deseas ${accion} a "${trabajador.nombre}"?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      variant: accion === 'desactivar' ? 'danger' : 'default',
    });
    if (!ok) return;
    try {
      await updateTrabajador(trabajador.id, {
        ...trabajador,
        activo: !trabajador.activo,
      });
      toast.success(
        `Trabajador ${accion === 'desactivar' ? 'desactivado' : 'activado'}`
      );
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

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroCargo('');
  };

  /* ── Estado por campo ── */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (
      touched &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '' &&
      value !== 0
    )
      return 'valid';
    return 'idle';
  };

  /* ── Opciones SelectField ── */
  const cargoOptions = useMemo(
    () =>
      cargos.map((c) => ({
        value: c.id,
        label: c.nombre,
        icon: Briefcase,
      })),
    [cargos]
  );

  const sexoOptions = useMemo(
    () => [
      { value: 'M', label: 'Masculino', icon: Mars },
      { value: 'F', label: 'Femenino', icon: Venus },
    ],
    []
  );

  /* ── Progreso (campos obligatorios: nombre, cédula, sexo, fecha, cargo) ── */
  const progreso = useMemo(() => {
    let filled = 0;
    if (nombreWatch?.trim()?.length >= 3) filled++;
    if (cedulaWatch?.length >= 6) filled++;
    if (sexoWatch) filled++;
    if (fechaNacimientoWatch) filled++;
    if (cargoIdWatch) filled++;
    return Math.round((filled / 5) * 100);
  }, [nombreWatch, cedulaWatch, sexoWatch, fechaNacimientoWatch, cargoIdWatch]);

  /* ── Cargo seleccionado (para preview) ── */
  const cargoSeleccionado = useMemo(
    () => cargos.find((c) => c.id === Number(cargoIdWatch)),
    [cargos, cargoIdWatch]
  );

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
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                  ${activo ? 'bg-slate-100' : 'bg-slate-50'}`}
              >
                <UserCog
                  className={`w-4 h-4 ${activo ? 'text-slate-600' : 'text-slate-400'}`}
                  strokeWidth={2.2}
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{t.nombre}</p>
              <p className="text-[11px] text-slate-400 tabular-nums">
                CI: {t.cedula}
              </p>
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
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                            bg-slate-100 text-slate-700 border border-slate-200
                            text-[11px] font-semibold"
          >
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
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border
              ${isM
                ? 'bg-blue-50 text-blue-700 border-blue-100'
                : 'bg-pink-50 text-pink-700 border-pink-100'}`}
          >
            {isM ? (
              <Mars className="w-3 h-3" strokeWidth={2.5} />
            ) : (
              <Venus className="w-3 h-3" strokeWidth={2.5} />
            )}
            {isM ? 'M' : 'F'}
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
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border
              ${activo
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200'}`}
          >
            {activo ? (
              <>
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                Activo
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" strokeWidth={2.5} />
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
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
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
            {trabajadoresFiltrados.length} de {trabajadores.length} trabajador
            {trabajadores.length !== 1 && 'es'}
            {hayFiltros && (
              <span className="text-slate-600 font-medium"> (filtrados)</span>
            )}
          </span>
        }
        actions={
          <>
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition border select-none ${
                mostrarInactivos
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
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
              <Controller
                name="__filtroCargo"
                control={control}
                render={() => (
                  <SelectField
                    value={filtroCargo === '' ? '' : parseInt(filtroCargo)}
                    onChange={(v) => setFiltroCargo(v === '' ? '' : String(v))}
                    options={[
                      { value: '', label: 'Todos los cargos', icon: Briefcase },
                      ...cargoOptions,
                    ]}
                    placeholder="Filtrar por cargo..."
                    tone="slate"
                  />
                )}
              />
            </div>
          </div>

          {hayFiltros && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleLimpiarFiltros}
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
              onClick={handleLimpiarFiltros}
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
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                                            bg-slate-100 text-slate-700 text-[10px] font-semibold"
                          >
                            <Briefcase className="w-2.5 h-2.5" strokeWidth={2.5} />
                            {t.cargo.nombre}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold
                            ${isM ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}
                        >
                          {isM ? (
                            <Mars className="w-2.5 h-2.5" strokeWidth={2.5} />
                          ) : (
                            <Venus className="w-2.5 h-2.5" strokeWidth={2.5} />
                          )}
                          {isM ? 'M' : 'F'}
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
          {/* ═══ Banner de contexto ═══ */}
          <div className="p-3 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-md shadow-slate-700/25 shrink-0">
              {selectedTrabajador ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                {selectedTrabajador ? 'Editando trabajador' : 'Nuevo trabajador'}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                {nombreWatch?.trim() || selectedTrabajador?.nombre || 'Completa los datos'}
              </p>
              {cargoSeleccionado && (
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  {cargoSeleccionado.nombre}
                </p>
              )}
            </div>
          </div>

          {/* ═══ Barra de progreso ═══ */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-slate-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  progreso === 100 ? 'text-emerald-600' : 'text-slate-700'
                }`}
              >
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-slate-400 to-slate-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          {/* ─── Sección: Datos personales ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
              <UserCog className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">
                Datos personales
              </h3>
            </div>

            {/* Nombre */}
            <FormField
              icon={UserIcon}
              label="Nombre completo"
              required
              state={fieldState('nombre', nombreWatch)}
              error={errors.nombre?.message}
              hint={`${nombreWatch?.length || 0}/100 caracteres`}
            >
              <input
                autoFocus
                autoComplete="off"
                placeholder="Ej: Juan Pérez"
                {...register('nombre')}
                className={inputCls(fieldState('nombre', nombreWatch))}
              />
            </FormField>

            {/* Cédula + Sexo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                icon={CreditCard}
                label="Cédula"
                required
                state={fieldState('cedula', cedulaWatch)}
                error={errors.cedula?.message}
                hint={
                  cedulaWatch
                    ? `${cedulaWatch.length}/10 dígitos`
                    : 'Solo números'
                }
              >
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={cedulaDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw.length <= 10) {
                      setCedulaDisplay(raw);
                      setValue('cedula', raw, { shouldValidate: true });
                    }
                  }}
                  placeholder="12345678"
                  className={`${inputCls(
                    fieldState('cedula', cedulaWatch)
                  )} tabular-nums`}
                />
                <input type="hidden" {...register('cedula')} />
              </FormField>

              <FormField
                icon={Heart}
                label="Sexo"
                required
                state={fieldState('sexo', sexoWatch)}
                error={errors.sexo?.message}
                hint={
                  sexoWatch === 'M'
                    ? 'Masculino'
                    : sexoWatch === 'F'
                    ? 'Femenino'
                    : 'Selecciona el sexo'
                }
              >
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      options={sexoOptions}
                      placeholder="Seleccionar sexo..."
                      state={fieldState('sexo', sexoWatch)}
                      tone="slate"
                    />
                  )}
                />
              </FormField>
            </div>

            {/* Fecha nacimiento */}
            <FormField
              icon={Cake}
              label="Fecha de nacimiento"
              required
              state={fieldState('fechaNacimiento', fechaNacimientoWatch)}
              error={errors.fechaNacimiento?.message}
              hint={
                fechaNacimientoWatch
                  ? new Date(fechaNacimientoWatch).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Selecciona la fecha'
              }
            >
              <input
                type="date"
                {...register('fechaNacimiento')}
                className={inputCls(fieldState('fechaNacimiento', fechaNacimientoWatch))}
              />
            </FormField>
          </section>

          {/* ─── Sección: Info laboral ─── */}
          <section className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
              <Briefcase className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">
                Información laboral
              </h3>
            </div>

            <FormField
              icon={Building2}
              label="Cargo"
              required
              state={fieldState('cargoId', cargoIdWatch)}
              error={errors.cargoId?.message}
              hint={
                cargoSeleccionado
                  ? `Asignado como: ${cargoSeleccionado.nombre}`
                  : 'El cargo define los permisos y roles disponibles'
              }
            >
              <Controller
                name="cargoId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v === '' ? null : v)}
                    options={cargoOptions}
                    placeholder="Buscar cargo..."
                    emptyMessage="No hay cargos registrados"
                    state={fieldState('cargoId', cargoIdWatch)}
                    tone="slate"
                  />
                )}
              />
            </FormField>

            <div>
              <ImageUploader
                value={foto}
                onChange={(url) => setValue('foto', url, { shouldDirty: true })}
                folder="trabajador"
                label="Foto del trabajador"
              />
            </div>
          </section>

          {/* ─── Sección: Estado ─── */}
          <section className="pt-3 border-t border-slate-100">
            <label
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer
                              hover:bg-slate-100 transition select-none"
            >
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

          {/* ─── Footer sticky ─── */}
          <div
            className="-mx-4 sm:-mx-6 px-4 sm:px-6 pt-3
                        flex flex-col sm:flex-row justify-end gap-2
                        border-t border-slate-200"
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium
                         hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition
                         disabled:opacity-50 order-2 sm:order-1"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         px-5 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-lg text-sm font-semibold
                         hover:from-slate-800 hover:to-slate-900 active:from-slate-900 active:to-black
                         transition disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-slate-800/25
                         order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  {selectedTrabajador ? 'Guardar cambios' : 'Crear trabajador'}
                  <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   FormField reutilizable
   ═══════════════════════════════════════════════════ */
const FormField = ({ icon: Icon, label, required, optional, state, error, hint, children }) => {
  const stateCls =
    {
      idle: { bg: 'bg-slate-100', text: 'text-slate-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      hintIcon: Info,
    };

  const HintIcon = stateCls.hintIcon;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors ${stateCls.bg}`}
        >
          <Icon className={`w-3 h-3 ${stateCls.text}`} strokeWidth={2.5} />
        </span>
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="ml-auto text-[11px] text-slate-400 font-normal">
            Opcional
          </span>
        )}
        {state === 'valid' && !optional && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
            Válido
          </span>
        )}
      </label>

      <div className="relative">{children}</div>

      <div className="flex items-center justify-between gap-2 mt-1 min-h-[16px]">
        {error ? (
          <p className="text-red-600 text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {error}
          </p>
        ) : hint ? (
          <p
            className={`text-[11px] flex items-center gap-1 ${
              state === 'valid' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <HintIcon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {hint}
          </p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Clases input
   ═══════════════════════════════════════════════════ */
const inputCls = (state) => {
  const base =
    'w-full rounded-lg px-3.5 py-2.5 text-sm bg-white border transition-colors ' +
    'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400';
  if (state === 'error') return `${base} border-red-400 focus:ring-red-500`;
  if (state === 'valid') return `${base} border-emerald-300 focus:ring-emerald-500`;
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-slate-500`;
};

export default TrabajadoresPage;