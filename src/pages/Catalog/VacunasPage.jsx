// frontend/src/pages/Catalogos/VacunasPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getVacunas,
  createVacuna,
  updateVacuna,
  deleteVacuna,
} from '../../services/crudCatalogoService';
import { getEspecies } from '../../services/especieService';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import SelectField from '../../components/common/SelectField';
import toast from 'react-hot-toast';
import {
  Syringe, Plus, Search as SearchIcon, X,
  Tag, FileText, Power, PowerOff, Pencil,
  ClipboardList, Check, ArrowRight,
  Sparkles, CheckCircle2, XCircle, Info,
  Eye, EyeOff, PawPrint, ShieldCheck, Heart,
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
  descripcion: z
    .string()
    .max(300, 'Máximo 300 caracteres')
    .optional()
    .or(z.literal('')),
  especieId: z.number({ required_error: 'Especie requerida' }),
});

/* ═══════════════════════════════════════════════════ */
const VacunasPage = () => {
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
    defaultValues: { nombre: '', descripcion: '', especieId: null },
  });

  const nombreWatch = watch('nombre');
  const descripcionWatch = watch('descripcion');
  const especieIdWatch = watch('especieId');

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const [vacRes, espRes] = await Promise.all([
        getVacunas(params),
        getEspecies(),
      ]);
      setItems(vacRes.data);
      setEspecies(espRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '', descripcion: '', especieId: null });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      especieId: item.especieId,
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    const ok = await confirm({
      title: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} vacuna`,
      message: `¿Deseas ${accion} "${item.nombre}"?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      variant: accion === 'desactivar' ? 'danger' : 'default',
    });
    if (!ok) return;
    try {
      await updateVacuna(item.id, { ...item, activo: !item.activo });
      toast.success(
        `Vacuna ${accion === 'desactivar' ? 'desactivada' : 'activada'}`
      );
      loadData();
    } catch {
      toast.error(`Error al ${accion} vacuna`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateVacuna(selectedItem.id, data);
      else await createVacuna(data);
      toast.success(selectedItem ? 'Vacuna actualizada' : 'Vacuna creada');
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

  /* ── Filtro ── */
  const itemsFiltrados = useMemo(() => {
    return items
      .filter((v) => !filtroEspecie || v.especieId === parseInt(filtroEspecie))
      .filter(
        (v) => !busqueda || v.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
  }, [items, filtroEspecie, busqueda]);

  const hayFiltrosActivos = busqueda.trim() || filtroEspecie;

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroEspecie('');
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

  /* ── Especie seleccionada (para preview del form) ── */
  const especieSeleccionada = useMemo(
    () => especies.find((e) => e.id === Number(especieIdWatch)),
    [especies, especieIdWatch]
  );

  /* ── Columnas DataTable ── */
  const columns = [
    {
      header: 'Vacuna',
      accessorKey: 'nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <Syringe className="w-4 h-4 text-emerald-600" strokeWidth={2.2} />
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
      header: 'Especie',
      accessorKey: 'especie.nombre',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-slate-400">—</span>;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                          bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100"
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
            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
            <Syringe className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Vacunas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {itemsFiltrados.length} de {items.length} vacuna
              {items.length !== 1 && 's'}
              {hayFiltrosActivos && (
                <span className="text-emerald-600 font-medium"> (filtradas)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && (
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition border ${
                mostrarInactivos
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
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
                       bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                       hover:bg-emerald-700 active:bg-emerald-800 transition
                       shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nueva Vacuna
          </button>
        </div>
      </div>

      {/* ═══ Filtros ═══ */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Búsqueda */}
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
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    { value: '', label: 'Todas las especies', icon: PawPrint },
                    ...especieOptions,
                  ]}
                  placeholder="Filtrar por especie..."
                  tone="emerald"
                />
              )}
            />
          </div>

          {hayFiltrosActivos && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleLimpiarFiltros}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-emerald-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <Syringe className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayFiltrosActivos
              ? 'No hay vacunas que coincidan con tus filtros'
              : 'Aún no hay vacunas registradas'}
          </p>
          {!hayFiltrosActivos && (
            <button
              onClick={handleNew}
              className="mt-3 text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear la primera
            </button>
          )}
          {hayFiltrosActivos && (
            <button
              onClick={handleLimpiarFiltros}
              className="mt-3 text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP: DataTable */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <DataTable
              columns={columns}
              data={itemsFiltrados}
              onRowClick={handleEdit}
              showGlobalFilter={false}
            />
          </div>

          {/* MÓVIL: Cards */}
          <div className="md:hidden space-y-2.5">
            {itemsFiltrados.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleEdit(item)}
                className={`w-full text-left bg-white rounded-xl shadow-sm border overflow-hidden
                           transition active:scale-[0.995] active:bg-slate-50
                           ${item.activo
                             ? 'border-emerald-200 ring-1 ring-emerald-100'
                             : 'border-slate-200/60 opacity-70'}`}
              >
                {/* Barra superior de estado */}
                <div
                  className={`h-1 w-full ${
                    item.activo
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      : 'bg-slate-200'
                  }`}
                />

                <div className="p-3.5">
                  {/* Fila superior: ícono + nombre + estado */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        item.activo ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}
                    >
                      <Syringe
                        className={`w-5 h-5 ${
                          item.activo ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                        strokeWidth={2.2}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {item.nombre || 'Vacuna sin nombre'}
                      </p>
                      {item.especie?.nombre && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                          <PawPrint className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                          <span className="truncate">{item.especie.nombre}</span>
                        </div>
                      )}
                    </div>
                    {item.activo ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                                        bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                        Activa
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                                        bg-slate-100 text-slate-500 border border-slate-200">
                        <XCircle className="w-3 h-3" strokeWidth={2.5} />
                        Inactiva
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  {item.descripcion && (
                    <div className="flex items-start gap-2 px-2.5 py-2 mb-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                      <FileText
                        className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                        strokeWidth={2.2}
                      />
                      <p className="text-xs text-slate-700 line-clamp-2 leading-snug">
                        {item.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Acciones móvil */}
                  <div
                    className="flex border-t border-slate-100 -mx-3.5 -mb-3.5 mt-2 pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="flex-1 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 inline-flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
                      Editar
                    </button>
                    {isAdmin && (
                      <>
                        <div className="w-px bg-slate-100" />
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(item)}
                          className={`flex-1 py-2.5 text-xs font-medium inline-flex items-center justify-center gap-1.5 ${
                            item.activo
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {item.activo ? (
                            <>
                              <PowerOff className="w-3.5 h-3.5" strokeWidth={2.2} />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Power className="w-3.5 h-3.5" strokeWidth={2.2} />
                              Activar
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ═══ Modal Crear/Editar ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !isSubmitting && setModalOpen(false)}
        title={selectedItem ? 'Editar Vacuna' : 'Nueva Vacuna'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Banner */}
          <div className="p-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
              {selectedItem ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                {selectedItem ? 'Editando vacuna' : 'Nueva vacuna'}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                {selectedItem?.nombre || 'Completa los datos'}
              </p>
              {especieSeleccionada && (
                <p className="text-[11px] text-emerald-700 mt-0.5 flex items-center gap-1">
                  <PawPrint className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  {especieSeleccionada.nombre}
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
            hint={`${nombreWatch?.length || 0}/100 caracteres`}
          >
            <input
              type="text"
              placeholder="Ej: Antirrábica, Parvovirus..."
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
                ? `Aplicable a: ${especieSeleccionada.nombre}`
                : 'Selecciona la especie a la que aplica'
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
                  tone="emerald"
                />
              )}
            />
          </FormField>

          {/* Aviso sin especies */}
          {especies.length === 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">
                  No hay especies registradas
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Registra al menos una especie antes de crear vacunas.
                </p>
              </div>
            </div>
          )}

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
              placeholder="Notas sobre la vacuna, dosis, laboratorio..."
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
              disabled={isSubmitting || !isValid || especies.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         px-5 py-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-semibold
                         hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800
                         transition disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-emerald-600/25
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
                  {selectedItem ? 'Guardar cambios' : 'Crear vacuna'}
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
      idle: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-emerald-500`;
};

export default VacunasPage;