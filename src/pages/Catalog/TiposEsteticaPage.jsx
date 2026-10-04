// frontend/src/pages/Catalogos/TiposEsteticaPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getTiposEstetica,
  createTipoEstetica,
  updateTipoEstetica,
  deleteTipoEstetica,
  getCategorias,
} from '../../services/crudCatalogoService';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import SelectField from '../../components/common/SelectField';
import toast from 'react-hot-toast';
import {
  Scissors, Plus, Search as SearchIcon, X,
  Tag, DollarSign, Power, PowerOff, Pencil,
  ClipboardList, Palette, Check, ArrowRight,
  Sparkles, CheckCircle2, XCircle, Info,
  Eye, EyeOff, Wand2, Heart,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  nombre: z
    .string()
    .min(1, 'Nombre requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  categoriaId: z.number().optional().nullable(),
  precioVenta: z.number().positive('Debe ser mayor a 0').optional().nullable(),
});

/* ═══════════════════════════════════════════════════ */
const TiposEsteticaPage = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register, handleSubmit, reset, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { nombre: '', categoriaId: null, precioVenta: null },
  });

  const nombreWatch = watch('nombre');
  const categoriaIdWatch = watch('categoriaId');
  const precioVentaWatch = watch('precioVenta');

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const [tiposRes, catsRes] = await Promise.all([
        getTiposEstetica(params),
        getCategorias({ tipo: 'estetica' }),
      ]);
      setItems(tiposRes.data);
      setCategorias(catsRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '', categoriaId: null, precioVenta: null });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({
      nombre: item.nombre,
      categoriaId: item.categoriaId ?? null,
      precioVenta: item.precioVenta ?? null,
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    const ok = await confirm({
      title: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} servicio de estética`,
      message: `¿Deseas ${accion} "${item.nombre}"?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      variant: accion === 'desactivar' ? 'danger' : 'default',
    });
    if (!ok) return;
    try {
      await updateTipoEstetica(item.id, { ...item, activo: !item.activo });
      toast.success(
        `Servicio ${accion === 'desactivar' ? 'desactivado' : 'activado'}`
      );
      loadData();
    } catch {
      toast.error(`Error al ${accion}`);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null,
        precioVenta: data.precioVenta || null,
      };
      if (selectedItem) await updateTipoEstetica(selectedItem.id, payload);
      else await createTipoEstetica(payload);
      toast.success(selectedItem ? 'Actualizado' : 'Creado');
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Opciones SelectField ── */
  const categoriaOptions = useMemo(
    () => [
      { value: '', label: 'Sin categoría', icon: X },
      ...categorias.map((c) => ({
        value: c.id,
        label: c.nombre,
        icon: Palette,
      })),
    ],
    [categorias]
  );

  /* ── Filtro por texto ── */
  const itemsFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase().trim();
    return items.filter((i) => {
      const nombre = i.nombre?.toLowerCase() || '';
      const cat = i.categoria?.nombre?.toLowerCase() || '';
      return nombre.includes(q) || cat.includes(q);
    });
  }, [items, searchTerm]);

  const hayBusqueda = searchTerm.trim().length > 0;

  /* ── Estado por campo (para FormField) ── */
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

  /* ── Columnas DataTable ── */
  const columns = [
    {
      header: 'Nombre',
      accessorKey: 'nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-pink-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">
            {getValue() || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Categoría',
      accessorKey: 'categoria.nombre',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-slate-400">—</span>;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                          bg-pink-50 text-pink-700 text-xs font-medium border border-pink-100"
          >
            <Palette className="w-3 h-3" strokeWidth={2.5} />
            {v}
          </span>
        );
      },
    },
    {
      header: 'Precio',
      accessorKey: 'precioVenta',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-slate-400">—</span>;
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                            bg-emerald-50 text-emerald-700 text-xs font-semibold tabular-nums border border-emerald-100">
            <DollarSign className="w-3 h-3" strokeWidth={2.5} />
            {Number(v).toFixed(2)}
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
            className="p-2 rounded-lg text-pink-600 hover:bg-pink-50 transition"
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-600/25 shrink-0">
            <Scissors className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Servicios de Estética
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {itemsFiltrados.length} de {items.length} servicio
              {items.length !== 1 && 's'}
              {hayBusqueda && (
                <span className="text-pink-600 font-medium"> (filtrados)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && (
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition border ${
                mostrarInactivos
                  ? 'bg-pink-50 border-pink-200 text-pink-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
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
                       bg-pink-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                       hover:bg-pink-700 active:bg-pink-800 transition
                       shadow-sm shadow-pink-600/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* ═══ Búsqueda ═══ */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-pink-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay servicios que coincidan con tu búsqueda'
              : 'Aún no hay servicios de estética'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={handleNew}
              className="mt-3 text-pink-600 hover:text-pink-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-pink-600 hover:text-pink-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar búsqueda
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
        title={selectedItem ? 'Editar Servicio de Estética' : 'Nuevo Servicio de Estética'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Banner */}
          <div className="p-3 rounded-lg border border-pink-200 bg-gradient-to-r from-pink-50 to-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md shadow-pink-600/25 shrink-0">
              {selectedItem ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-pink-700 uppercase tracking-wider">
                {selectedItem ? 'Editando servicio' : 'Nuevo servicio'}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                {selectedItem?.nombre || 'Completa los datos'}
              </p>
            </div>
          </div>

          {/* Nombre */}
          <FormField
            icon={Tag}
            label="Nombre"
            required
            state={fieldState('nombre', nombreWatch)}
            error={errors.nombre?.message}
            hint={`${nombreWatch?.length || 0}/100 caracteres`}
          >
            <input
              type="text"
              placeholder="Ej: Baño y corte"
              {...register('nombre')}
              className={inputCls(fieldState('nombre', nombreWatch))}
            />
          </FormField>

          {/* Categoría */}
          <FormField
            icon={Palette}
            label="Categoría"
            optional
            state={categoriaIdWatch ? 'valid' : 'idle'}
            hint={
              categoriaIdWatch
                ? 'Categoría asignada'
                : 'Sin categoría se mostrará como servicio general'
            }
          >
            <Controller
              name="categoriaId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  options={categoriaOptions}
                  placeholder="Buscar categoría..."
                  emptyMessage="No hay categorías registradas"
                  tone="pink"
                />
              )}
            />
          </FormField>

          {/* Precio */}
          <FormField
            icon={DollarSign}
            label="Precio de venta"
            optional
            state={fieldState('precioVenta', precioVentaWatch)}
            error={errors.precioVenta?.message}
            hint={
              precioVentaWatch
                ? `$${Number(precioVentaWatch).toFixed(2)}`
                : 'Deja vacío si aún no lo defines'
            }
          >
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('precioVenta', {
                setValueAs: (v) => (v === '' ? null : parseFloat(v)),
              })}
              className={inputCls(fieldState('precioVenta', precioVentaWatch))}
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
                         px-5 py-2.5 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg text-sm font-semibold
                         hover:from-pink-600 hover:to-pink-700 active:from-pink-700 active:to-pink-800
                         transition disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-pink-600/25
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
                  {selectedItem ? 'Guardar cambios' : 'Crear servicio'}
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
      idle: { bg: 'bg-pink-100', text: 'text-pink-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-pink-100',
      text: 'text-pink-600',
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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-pink-500`;
};

export default TiposEsteticaPage;