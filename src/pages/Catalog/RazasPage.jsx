// frontend/src/pages/Catalogos/RazasPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getRazas,
  createRaza,
  updateRaza,
  deleteRaza,
} from '../../services/razaService';
import { getEspecies } from '../../services/especieService';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import SelectField from '../../components/common/SelectField';
import toast from 'react-hot-toast';
import {
  PawPrint, Dog, Plus, Search as SearchIcon, X,
  Tag, Power, PowerOff, Pencil,
  ClipboardList, Check, ArrowRight,
  Sparkles, CheckCircle2, XCircle, Info,
  Eye, EyeOff, Heart, Layers, Filter,
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
  especieId: z.number({ required_error: 'Especie requerida' }),
});

/* ═══════════════════════════════════════════════════ */
const RazasPage = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  const [items, setItems] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const {
    register, handleSubmit, reset, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { nombre: '', especieId: null },
  });

  const nombreWatch = watch('nombre');
  const especieIdWatch = watch('especieId');

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const [razasRes, especiesRes] = await Promise.all([
        getRazas(params),
        getEspecies(),
      ]);
      setItems(razasRes.data);
      setEspecies(especiesRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '', especieId: null });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({ nombre: item.nombre, especieId: item.especieId });
    setModalOpen(true);
  };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    const ok = await confirm({
      title: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} raza`,
      message: `¿Deseas ${accion} "${item.nombre}"?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      variant: accion === 'desactivar' ? 'danger' : 'default',
    });
    if (!ok) return;
    try {
      await updateRaza(item.id, { ...item, activo: !item.activo });
      toast.success(
        `Raza ${accion === 'desactivar' ? 'desactivada' : 'activada'}`
      );
      loadData();
    } catch {
      toast.error(`Error al ${accion} raza`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateRaza(selectedItem.id, data);
      else await createRaza(data);
      toast.success(selectedItem ? 'Raza actualizada' : 'Raza creada');
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Opciones SelectField ── */
  const especieOptions = useMemo(
    () =>
      especies.map((e) => ({
        value: e.id,
        label: e.nombre,
        icon: PawPrint,
      })),
    [especies]
  );

  /* ── Filtro por texto + especie ── */
  const itemsFiltrados = useMemo(() => {
    return items
      .filter((r) => !filtroEspecie || r.especieId === parseInt(filtroEspecie))
      .filter(
        (r) => !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
  }, [items, filtroEspecie, busqueda]);

  const hayFiltrosActivos = busqueda.trim() || filtroEspecie;

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroEspecie('');
  };

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

  /* ── Nombre de la especie seleccionada (para el preview del form) ── */
  const especieSeleccionada = useMemo(
    () => especies.find((e) => e.id === Number(especieIdWatch)),
    [especies, especieIdWatch]
  );

  /* ── Columnas DataTable ── */
  const columns = [
    {
      header: 'Raza',
      accessorKey: 'nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
            <Dog className="w-4 h-4 text-teal-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">
            {getValue() || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Especie',
      accessorKey: 'especie.nombre',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-slate-400">—</span>;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                          bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100"
          >
            <PawPrint className="w-3 h-3" strokeWidth={2.5} />
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
            className="p-2 rounded-lg text-teal-600 hover:bg-teal-50 transition"
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/25 shrink-0">
            <Dog className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Razas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {itemsFiltrados.length} de {items.length} raza
              {items.length !== 1 && 's'}
              {hayFiltrosActivos && (
                <span className="text-teal-600 font-medium"> (filtradas)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && (
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition border ${
                mostrarInactivos
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
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
                       bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                       hover:bg-teal-700 active:bg-teal-800 transition
                       shadow-sm shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nueva Raza
          </button>
        </div>
      </div>

      {/* ═══ Filtros ═══ */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Búsqueda por nombre */}
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                strokeWidth={2.2}
              />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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

            {/* Filtro por especie */}
            <Controller
              name="__filtroEspecie"
              control={control}
              render={() => (
                <SelectField
                  value={filtroEspecie === '' ? '' : parseInt(filtroEspecie)}
                  onChange={(v) => setFiltroEspecie(v === '' ? '' : String(v))}
                  options={[
                    { value: '', label: 'Todas las especies', icon: Layers },
                    ...especieOptions,
                  ]}
                  placeholder="Filtrar por especie..."
                  tone="teal"
                />
              )}
            />
          </div>

          {/* Botón limpiar filtros */}
          {hayFiltrosActivos && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleLimpiarFiltros}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium inline-flex items-center gap-1"
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-teal-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <PawPrint className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayFiltrosActivos
              ? 'No hay razas que coincidan con tus filtros'
              : 'Aún no hay razas registradas'}
          </p>
          {!hayFiltrosActivos && (
            <button
              onClick={handleNew}
              className="mt-3 text-teal-600 hover:text-teal-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera
            </button>
          )}
          {hayFiltrosActivos && (
            <button
              onClick={handleLimpiarFiltros}
              className="mt-3 text-teal-600 hover:text-teal-800 text-sm font-medium inline-flex items-center gap-1"
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
        title={selectedItem ? 'Editar Raza' : 'Nueva Raza'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Banner */}
          <div className="p-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-600/25 shrink-0">
              {selectedItem ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                {selectedItem ? 'Editando raza' : 'Nueva raza'}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                {selectedItem?.nombre || 'Completa los datos'}
              </p>
              {especieSeleccionada && (
                <p className="text-[11px] text-teal-700 mt-0.5 flex items-center gap-1">
                  <PawPrint className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  {especieSeleccionada.nombre}
                </p>
              )}
            </div>
          </div>

          {/* Nombre */}
          <FormField
            icon={Tag}
            label="Nombre de la raza"
            required
            state={fieldState('nombre', nombreWatch)}
            error={errors.nombre?.message}
            hint={`${nombreWatch?.length || 0}/80 caracteres`}
          >
            <input
              type="text"
              placeholder="Ej: Labrador Retriever, Siamés..."
              {...register('nombre')}
              className={inputCls(fieldState('nombre', nombreWatch))}
            />
          </FormField>

          {/* Especie */}
          <FormField
            icon={PawPrint}
            label="Especie"
            required
            state={fieldState('especieId', especieIdWatch)}
            error={errors.especieId?.message}
            hint={
              especieSeleccionada
                ? `Pertenece a: ${especieSeleccionada.nombre}`
                : 'Selecciona la especie a la que pertenece'
            }
          >
            <Controller
              name="especieId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  options={especieOptions}
                  placeholder="Buscar especie..."
                  emptyMessage="No hay especies registradas"
                  state={fieldState('especieId', especieIdWatch)}
                  tone="teal"
                />
              )}
            />
          </FormField>

          {/* Aviso sin especies */}
          {especies.length === 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <Info
                className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                strokeWidth={2.2}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">
                  No hay especies registradas
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Registra al menos una especie antes de crear razas.
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
              disabled={isSubmitting || !isValid || especies.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         px-5 py-2.5 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg text-sm font-semibold
                         hover:from-teal-600 hover:to-teal-700 active:from-teal-700 active:to-teal-800
                         transition disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-teal-600/25
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
                  {selectedItem ? 'Guardar cambios' : 'Crear raza'}
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
      idle: { bg: 'bg-teal-100', text: 'text-teal-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-teal-100',
      text: 'text-teal-600',
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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-teal-500`;
};

export default RazasPage;