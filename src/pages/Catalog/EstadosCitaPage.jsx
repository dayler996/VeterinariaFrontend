// frontend/src/pages/Catalogos/EstadosCitaPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getEstadosCita,
  createEstadoCita,
  updateEstadoCita,
  deleteEstadoCita,
} from '../../services/crudCatalogoService';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  CalendarCheck, Plus, Search as SearchIcon, X,
  Tag, Pencil, Trash2,
  ClipboardList, Check, ArrowRight,
  Sparkles, CheckCircle2, XCircle, Info,
  Clock, Bookmark, Layers,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  nombre: z
    .string()
    .min(1, 'Nombre requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
});

/* ═══════════════════════════════════════════════════ */
const EstadosCitaPage = () => {
  const confirm = useConfirm();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { nombre: '' },
  });

  const nombreWatch = watch('nombre');

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await getEstadosCita();
      setItems(res.data);
    } catch {
      toast.error('Error al cargar estados');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '' });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({ nombre: item.nombre });
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Eliminar estado de cita',
      message:
        'Se eliminarán también las citas asociadas a este estado. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteEstadoCita(item.id);
      toast.success('Estado eliminado');
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateEstadoCita(selectedItem.id, data);
      else await createEstadoCita(data);
      toast.success(selectedItem ? 'Estado actualizado' : 'Estado creado');
      setModalOpen(false);
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Filtro por texto ── */
  const itemsFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase().trim();
    return items.filter((i) => i.nombre?.toLowerCase().includes(q));
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
      String(value).trim() !== ''
    )
      return 'valid';
    return 'idle';
  };

  /* ── Columnas DataTable ── */
  const columns = [
    {
      header: 'Estado',
      accessorKey: 'nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4 text-sky-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">
            {getValue() || '—'}
          </span>
        </div>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 transition"
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

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/25 shrink-0">
            <CalendarCheck className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Estados de Cita
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {itemsFiltrados.length} de {items.length} estado
              {items.length !== 1 && 's'}
              {hayBusqueda && (
                <span className="text-sky-600 font-medium"> (filtrados)</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleNew}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-sky-700 active:bg-sky-800 transition
                     shadow-sm shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nuevo Estado
        </button>
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
              placeholder="Buscar por nombre de estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-sky-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <Bookmark className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay estados que coincidan con tu búsqueda'
              : 'Aún no hay estados registrados'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={handleNew}
              className="mt-3 text-sky-600 hover:text-sky-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 text-sky-600 hover:text-sky-800 text-sm font-medium inline-flex items-center gap-1"
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
        title={selectedItem ? 'Editar Estado' : 'Nuevo Estado'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Banner */}
          <div className="p-3 rounded-lg border border-sky-200 bg-gradient-to-r from-sky-50 to-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-600/25 shrink-0">
              {selectedItem ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">
                {selectedItem ? 'Editando estado' : 'Nuevo estado'}
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
            hint={`${nombreWatch?.length || 0}/50 caracteres`}
          >
            <input
              type="text"
              placeholder="Ej: Programada, Confirmada, Cancelada..."
              {...register('nombre')}
              className={inputCls(fieldState('nombre', nombreWatch))}
            />
          </FormField>

          {/* Aviso si está editando (hay citas asociadas) */}
          {selectedItem && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <Info
                className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                strokeWidth={2.2}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">
                  Este estado podría tener citas asociadas
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Si lo eliminas, se eliminarán también las citas vinculadas.
                </p>
              </div>
            </div>
          )}

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
                         px-5 py-2.5 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-lg text-sm font-semibold
                         hover:from-sky-600 hover:to-sky-700 active:from-sky-700 active:to-sky-800
                         transition disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-sky-600/25
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
                  {selectedItem ? 'Guardar cambios' : 'Crear estado'}
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
      idle: { bg: 'bg-sky-100', text: 'text-sky-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-sky-100',
      text: 'text-sky-600',
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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-sky-500`;
};

export default EstadosCitaPage;