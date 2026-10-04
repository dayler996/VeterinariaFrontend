// frontend/src/pages/Catalogos/CategoriasPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '../../services/crudCatalogoService';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import SelectField from '../../components/common/SelectField';
import toast from 'react-hot-toast';
import {
  FolderOpen, Plus, Search as SearchIcon, X,
  Tag, FileText, Palette, Power, PowerOff, Pencil,
  ClipboardList, Check, ArrowRight,
  Sparkles, CheckCircle2, XCircle, Info,
  Eye, EyeOff, Layers, Microscope, Stethoscope, Scissors,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  nombre: z
    .string()
    .min(1, 'Nombre requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),
  descripcion: z
    .string()
    .max(300, 'Máximo 300 caracteres')
    .optional()
    .or(z.literal('')),
  tipo: z.enum(['estudio', 'operacion', 'estetica'], {
    required_error: 'Tipo requerido',
  }),
});

/* ── Config de tipos (colores + iconos) ── */
const tipoMap = {
  estudio: {
    label: 'Estudio',
    icon: Microscope,
    chip: 'bg-violet-50 text-violet-700 border-violet-100',
    dot: 'bg-violet-500',
    tone: 'violet',
  },
  operacion: {
    label: 'Operación',
    icon: Stethoscope,
    chip: 'bg-orange-50 text-orange-700 border-orange-100',
    dot: 'bg-orange-500',
    tone: 'orange',
  },
  estetica: {
    label: 'Estética',
    icon: Scissors,
    chip: 'bg-pink-50 text-pink-700 border-pink-100',
    dot: 'bg-pink-500',
    tone: 'pink',
  },
};

/* ═══════════════════════════════════════════════════ */
const CategoriasPage = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register, handleSubmit, reset, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { nombre: '', descripcion: '', tipo: 'estudio' },
  });

  const nombreWatch = watch('nombre');
  const descripcionWatch = watch('descripcion');
  const tipoWatch = watch('tipo');

  useEffect(() => { loadItems(); /* eslint-disable-next-line */ }, [mostrarInactivos]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const res = await getCategorias(params);
      setItems(res.data);
    } catch {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '', descripcion: '', tipo: 'estudio' });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      tipo: item.tipo,
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    const ok = await confirm({
      title: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} categoría`,
      message: `¿Deseas ${accion} "${item.nombre}"?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      variant: accion === 'desactivar' ? 'danger' : 'default',
    });
    if (!ok) return;
    try {
      await updateCategoria(item.id, { ...item, activo: !item.activo });
      toast.success(
        `Categoría ${accion === 'desactivar' ? 'desactivada' : 'activada'}`
      );
      loadItems();
    } catch {
      toast.error(`Error al ${accion} categoría`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateCategoria(selectedItem.id, data);
      else await createCategoria(data);
      toast.success(selectedItem ? 'Categoría actualizada' : 'Categoría creada');
      setModalOpen(false);
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Opciones SelectField (tipo) ── */
  const tipoOptions = useMemo(
    () =>
      Object.entries(tipoMap).map(([key, cfg]) => ({
        value: key,
        label: cfg.label,
        icon: cfg.icon,
      })),
    []
  );

  /* ── Filtros (tipo + búsqueda) ── */
  const itemsFiltrados = useMemo(() => {
    return items
      .filter((c) => !filtroTipo || c.tipo === filtroTipo)
      .filter(
        (c) =>
          !searchTerm.trim() ||
          c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [items, filtroTipo, searchTerm]);

  const hayFiltrosActivos = filtroTipo || searchTerm.trim();

  const handleLimpiarFiltros = () => {
    setFiltroTipo('');
    setSearchTerm('');
  };

  /* ── Estado por campo ── */
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

  /* ── Contadores por tipo (para chips) ── */
  const countsPorTipo = useMemo(() => {
    return {
      '': items.length,
      estudio: items.filter((i) => i.tipo === 'estudio').length,
      operacion: items.filter((i) => i.tipo === 'operacion').length,
      estetica: items.filter((i) => i.tipo === 'estetica').length,
    };
  }, [items]);

  /* ── Columnas DataTable ── */
  const columns = [
    {
      header: 'Categoría',
      accessorKey: 'nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <FolderOpen className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">
            {getValue() || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Descripción',
      accessorKey: 'descripcion',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500 truncate block max-w-[320px]">
          {getValue() || '—'}
        </span>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ getValue }) => {
        const v = getValue();
        const cfg = tipoMap[v];
        if (!cfg) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                              bg-slate-100 text-slate-600 text-xs font-medium">
              {v || '—'}
            </span>
          );
        }
        const Icon = cfg.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                          text-xs font-medium border ${cfg.chip}`}
          >
            <Icon className="w-3 h-3" strokeWidth={2.5} />
            {cfg.label}
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
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${
              activo
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {activo ? (
              <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            ) : (
              <XCircle className="w-3 h-3" strokeWidth={2.5} />
            )}
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
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
              {row.original.activo ? (
                <PowerOff className="w-4 h-4" strokeWidth={2.2} />
              ) : (
                <Power className="w-4 h-4" strokeWidth={2.2} />
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-600/25 shrink-0">
            <FolderOpen className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Categorías
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {itemsFiltrados.length} de {items.length} categoría
              {items.length !== 1 && 's'}
              {hayFiltrosActivos && (
                <span className="text-slate-700 font-medium"> (filtradas)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && (
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition border ${
                mostrarInactivos
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
              />
              {mostrarInactivos ? (
                <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
              ) : (
                <EyeOff className="w-3.5 h-3.5" strokeWidth={2.2} />
              )}
              Inactivos
            </label>
          )}
          <button
            onClick={handleNew}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                       bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                       hover:bg-slate-800 active:bg-slate-900 transition
                       shadow-sm shadow-slate-700/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* ═══ Filtros ═══ */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4 space-y-3">
          {/* Chips de tipo */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroTipo('')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                !filtroTipo
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" strokeWidth={2.5} />
              Todas
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                  !filtroTipo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {countsPorTipo['']}
              </span>
            </button>
            {Object.entries(tipoMap).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = filtroTipo === key;
              return (
                <button
                  key={key}
                  onClick={() => setFiltroTipo(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    isActive
                      ? `${cfg.chip} ring-1 ring-inset ring-current`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {cfg.label}
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isActive ? 'bg-white/50 text-current' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {countsPorTipo[key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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

          {/* Botón limpiar */}
          {hayFiltrosActivos && (
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleLimpiarFiltros}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Contenido ═══ */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-slate-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <FolderOpen className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayFiltrosActivos
              ? 'No hay categorías que coincidan con tus filtros'
              : 'Aún no hay categorías registradas'}
          </p>
          {!hayFiltrosActivos && (
            <button
              onClick={handleNew}
              className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera
            </button>
          )}
          {hayFiltrosActivos && (
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          <DataTable
            columns={columns}
            data={itemsFiltrados}
            onRowClick={handleEdit}
            showGlobalFilter={false}
          />
        </div>
      )}

      {/* ═══ Modal Crear/Editar ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !isSubmitting && setModalOpen(false)}
        title={selectedItem ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Banner */}
          <div className="p-3 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md shadow-slate-700/25 shrink-0">
              {selectedItem ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                {selectedItem ? 'Editando categoría' : 'Nueva categoría'}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                {selectedItem?.nombre || 'Completa los datos'}
              </p>
              {tipoMap[tipoWatch] && (
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${tipoMap[tipoWatch].dot}`} />
                  {tipoMap[tipoWatch].label}
                </p>
              )}
            </div>
          </div>

          {/* Nombre */}
          <FormField
            icon={Tag}
            label="Nombre"
            required
            state={fieldState('nombre', nombreWatch)}
            error={errors.nombre?.message}
            hint={`${nombreWatch?.length || 0}/80 caracteres`}
          >
            <input
              type="text"
              placeholder="Ej: Radiografías, Cirugías mayores..."
              {...register('nombre')}
              className={inputCls(fieldState('nombre', nombreWatch))}
            />
          </FormField>

          {/* Tipo */}
          <FormField
            icon={Palette}
            label="Tipo"
            required
            state={fieldState('tipo', tipoWatch)}
            error={errors.tipo?.message}
            hint={
              tipoMap[tipoWatch]
                ? `Agrupa categorías de ${tipoMap[tipoWatch].label.toLowerCase()}`
                : 'Selecciona el tipo de categoría'
            }
          >
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={tipoOptions}
                  placeholder="Seleccionar tipo..."
                  tone="slate"
                />
              )}
            />
          </FormField>

          {/* Descripción */}
          <FormField
            icon={FileText}
            label="Descripción"
            optional
            state={fieldState('descripcion', descripcionWatch)}
            error={errors.descripcion?.message}
            hint={`${descripcionWatch?.length || 0}/300 caracteres`}
          >
            <textarea
              rows="3"
              placeholder="Notas sobre qué incluye esta categoría..."
              {...register('descripcion')}
              className={`${inputCls(
                fieldState('descripcion', descripcionWatch)
              )} resize-none`}
            />
          </FormField>

          {/* Footer sticky modal */}
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
                         px-5 py-2.5 bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-lg text-sm font-semibold
                         hover:from-slate-700 hover:to-slate-800 active:from-slate-800 active:to-slate-900
                         transition disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-slate-700/25
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
                  {selectedItem ? 'Guardar cambios' : 'Crear categoría'}
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

export default CategoriasPage;