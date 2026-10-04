// frontend/src/pages/Catalogos/RolesPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { getRoles, createRol, updateRol, deleteRol } from '../../services/rolService';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  Shield, ShieldCheck, ShieldPlus, Pencil, Trash2,
  Search as SearchIcon, X, Check, AlertTriangle,
  ClipboardList, KeyRound, Plus, Power, Users as UsersIcon,
  Crown, UserCog, Briefcase, Lock, Star,
  Sparkles, CheckCircle2, XCircle, Info, ArrowRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const roleSchema = z.object({
  nombre: z
    .string()
    .min(1, 'Nombre requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres'),
});

/* ── Config visual por rol ── */
const getRolTone = (nombre) => {
  const n = (nombre || '').toUpperCase();
  if (n === 'ADMIN') return { tone: 'amber', Icon: Crown, label: 'Administrador' };
  if (n === 'VETERINARIO') return { tone: 'blue', Icon: UserCog, label: 'Veterinario' };
  if (n === 'RECEPCIONISTA')
    return { tone: 'cyan', Icon: Briefcase, label: 'Recepcionista' };
  if (n === 'PELUQUERO') return { tone: 'pink', Icon: Star, label: 'Peluquero' };
  return { tone: 'slate', Icon: Shield, label: nombre };
};

const TONE_CLS = {
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-600',
    dot: 'bg-cyan-500',
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-200',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-600',
    dot: 'bg-pink-500',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    dot: 'bg-slate-500',
  },
};

/* ═══════════════════════════════════════════════════ */
const RolesPage = () => {
  const confirm = useConfirm();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(roleSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { nombre: '' },
  });

  const nombreWatch = watch('nombre');

  /* ── Carga ── */
  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await getRoles();
      setRoles(res.data);
    } catch {
      toast.error('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  /* ── Handlers ── */
  const handleNew = () => {
    setSelectedRol(null);
    reset({ nombre: '' });
    setModalOpen(true);
  };

  const handleEdit = (rol) => {
    setSelectedRol(rol);
    reset({ nombre: rol.nombre });
    setModalOpen(true);
  };

  const handleDelete = async (rol) => {
    const ok = await confirm({
      title: 'Eliminar rol',
      message: `¿Deseas eliminar el rol "${rol.nombre}"? Los usuarios con este rol podrían perder acceso. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteRol(rol.id);
      toast.success('Rol eliminado');
      loadRoles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = { nombre: data.nombre.toUpperCase().trim() };
      if (selectedRol) {
        await updateRol(selectedRol.id, payload);
        toast.success('Rol actualizado');
      } else {
        await createRol(payload);
        toast.success('Rol creado');
      }
      setModalOpen(false);
      loadRoles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Filtro ── */
  const rolesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return roles;
    const q = busqueda.toLowerCase().trim();
    return roles.filter((r) => r.nombre?.toLowerCase().includes(q));
  }, [roles, busqueda]);

  const hayBusqueda = busqueda.trim().length > 0;

  /* ── Estado por campo (para FormField) ── */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (
      touched &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    )
      return 'valid';
    return 'idle';
  };

  /* ── Preview dinámico del rol que se está escribiendo ── */
  const previewCfg = useMemo(() => {
    if (!nombreWatch?.trim()) return null;
    return getRolTone(nombreWatch);
  }, [nombreWatch]);

  /* ── Progreso ── */
  const progreso = useMemo(() => {
    if (
      nombreWatch?.trim() &&
      nombreWatch.trim().length >= 3 &&
      nombreWatch.trim().length <= 30
    )
      return 100;
    if (nombreWatch?.trim()) return 50;
    return 0;
  }, [nombreWatch]);

  /* ── Columnas ── */
  const columns = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          #{getValue()}
        </span>
      ),
    },
    {
      header: 'Rol',
      accessorKey: 'nombre',
      cell: ({ getValue }) => {
        const cfg = getRolTone(getValue());
        const tone = TONE_CLS[cfg.tone];
        const Icon = cfg.Icon;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.iconBg}`}
            >
              <Icon className={`w-4 h-4 ${tone.iconText}`} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {getValue()}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{cfg.label}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Tipo',
      accessorKey: 'nombre',
      cell: ({ getValue }) => {
        const cfg = getRolTone(getValue());
        const tone = TONE_CLS[cfg.tone];
        const Icon = cfg.Icon;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border
                            ${tone.bg} ${tone.text} ${tone.border}
                            text-[11px] font-semibold whitespace-nowrap`}
          >
            <Icon className="w-3 h-3" strokeWidth={2.5} />
            {cfg.tone === 'amber' ? 'Privilegiado' : 'Estándar'}
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
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
            title="Editar"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.2} />
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
        icon="🔐"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Roles' },
        ]}
        title="Roles y permisos"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Shield className="w-3.5 h-3.5" strokeWidth={2.2} />
            {rolesFiltrados.length} de {roles.length} rol
            {roles.length !== 1 && 'es'}
            {hayBusqueda && (
              <span className="text-slate-600 font-medium"> (filtrados)</span>
            )}
          </span>
        }
        actions={
          <button
            onClick={handleNew}
            className="inline-flex items-center justify-center gap-1.5
                       bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium
                       hover:bg-slate-900 active:bg-black transition
                       shadow-sm shadow-slate-800/20"
          >
            <ShieldPlus className="w-4 h-4" strokeWidth={2.5} />
            Nuevo Rol
          </button>
        }
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-700/25 shrink-0">
          <KeyRound className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Control de acceso
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            Administración de roles del sistema
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            Cada rol define los permisos de los usuarios asignados
          </p>
        </div>
      </div>

      {/* ═══ Buscador ═══ */}
      {roles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar rol por nombre..."
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
      )}

      {/* ═══ Contenido ═══ */}
      {rolesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay roles que coincidan con tu búsqueda'
              : 'Aún no hay roles registrados'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={handleNew}
              className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1"
            >
              <ShieldPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1"
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
              data={rolesFiltrados}
              onRowClick={handleEdit}
              showGlobalFilter={false}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {rolesFiltrados.map((rol) => {
              const cfg = getRolTone(rol.nombre);
              const tone = TONE_CLS[cfg.tone];
              const Icon = cfg.Icon;
              return (
                <div
                  key={rol.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleEdit(rol)}
                    className="w-full text-left p-3.5 hover:bg-slate-50/60 active:bg-slate-100/60 transition
                               flex items-start gap-3"
                  >
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${tone.iconBg}`}
                    >
                      <Icon className={`w-5 h-5 ${tone.iconText}`} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {rol.nombre}
                        </p>
                        <span className="shrink-0 text-[10px] font-mono text-slate-400 tabular-nums">
                          #{rol.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cfg.label}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border
                                        ${tone.bg} ${tone.text} ${tone.border}`}
                      >
                        <Icon className="w-2.5 h-2.5" strokeWidth={2.5} />
                        {cfg.tone === 'amber' ? 'Privilegiado' : 'Estándar'}
                      </span>
                    </div>
                  </button>

                  <div className="flex border-t border-slate-100">
                    <button
                      onClick={() => handleEdit(rol)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Editar
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      onClick={() => handleDelete(rol)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-red-600 hover:bg-red-50 active:bg-red-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Eliminar
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
        title={selectedRol ? 'Editar Rol' : 'Nuevo Rol'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ═══ Banner de contexto ═══ */}
          <div
            className={`p-3 rounded-lg border flex items-center gap-3 ${
              previewCfg
                ? `${TONE_CLS[previewCfg.tone].border} bg-gradient-to-r from-${previewCfg.tone}-50 to-white`
                : 'border-slate-200 bg-gradient-to-r from-slate-50 to-white'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md shrink-0 ${
                previewCfg
                  ? `bg-gradient-to-br from-${previewCfg.tone}-500 to-${previewCfg.tone}-600 shadow-${previewCfg.tone}-600/25`
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-700/25'
              }`}
            >
              {selectedRol ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  previewCfg
                    ? TONE_CLS[previewCfg.tone].text
                    : 'text-slate-600'
                }`}
              >
                {selectedRol ? 'Editando rol' : 'Nuevo rol'}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                {nombreWatch?.trim() || selectedRol?.nombre || 'Completa los datos'}
              </p>
              {previewCfg && (
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${TONE_CLS[previewCfg.tone].dot}`}
                  />
                  Categoría detectada: {previewCfg.label}
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

          {/* ── Sección: Datos del rol ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
              <Shield className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">
                Datos del rol
              </h3>
            </div>

            <FormField
              icon={ShieldCheck}
              label="Nombre del rol"
              required
              state={fieldState('nombre', nombreWatch)}
              error={errors.nombre?.message}
              hint={`${nombreWatch?.length || 0}/30 caracteres`}
            >
              <input
                autoFocus
                autoComplete="off"
                {...register('nombre')}
                placeholder="Ej: ADMIN, VETERINARIO, RECEPCIONISTA"
                className={`${inputCls(
                  fieldState('nombre', nombreWatch)
                )} uppercase tracking-wide`}
              />
            </FormField>

            {/* Hint informativo */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">
                  Nombres en mayúsculas
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  El sistema reconoce roles como <strong>ADMIN</strong>,{' '}
                  <strong>VETERINARIO</strong>, <strong>RECEPCIONISTA</strong> y{' '}
                  <strong>PELUQUERO</strong> con colores e iconos específicos.
                </p>
              </div>
            </div>
          </section>

          {/* ── Footer sticky ── */}
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
                  {selectedRol ? 'Guardar cambios' : 'Crear rol'}
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

export default RolesPage;