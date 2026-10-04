// frontend/src/pages/Estetica/NuevoServicioEsteticaPage.jsx
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createServicioEstetica } from '../../services/esteticaService';
import { getTiposEstetica, getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import SelectField from '../../components/common/SelectField';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Scissors, Sparkles, User, Check, X,
  AlertTriangle, CheckCircle2, XCircle, Info,
  ArrowRight, PawPrint, Heart, Users as UsersIcon,
  ClipboardList, FileText, Palette, Wand2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  tipoId: z.number({ required_error: 'Selecciona el tipo de servicio' }),
  mascotaId: z.number({ required_error: 'Selecciona una mascota' }),
  trabajadorId: z.number({ required_error: 'Selecciona un peluquero' }),
  observacion: z.any().optional(),
});

/* ═══════════════════════════════════════════════════ */
const NuevoServicioEsteticaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [peluqueros, setPeluqueros] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [observacion, setObservacion] = useState({});
  const [loading, setLoading] = useState(false);

  const {
    register, handleSubmit, setValue, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { observacion: {} },
  });

  const mascotaIdWatch = watch('mascotaId');
  const tipoIdWatch = watch('tipoId');
  const trabajadorIdWatch = watch('trabajadorId');

  /* Sincronizar JSON con el form */
  useEffect(() => { setValue('observacion', observacion, { shouldDirty: true }); }, [observacion, setValue]);

  /* Cargas iniciales */
  useEffect(() => {
    loadData();
    if (mascotaIdParam) cargarMascotaDesdeParam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaIdParam]);

  const loadData = async () => {
    try {
      const [servRes, catsRes, trabajadoresRes] = await Promise.all([
        getTiposEstetica(),
        getCategorias({ tipo: 'estetica' }),
        getTrabajadores(),
      ]);
      setServicios(servRes.data);
      setCategorias(catsRes.data);
      setPeluqueros(trabajadoresRes.data.filter((t) => t.cargo?.nombre === 'Peluquero Canino'));
    } catch {
      toast.error('Error al cargar datos');
    }
  };

  const cargarMascotaDesdeParam = async () => {
    try {
      setLoading(true);
      const res = await getMascota(mascotaIdParam);
      setMascotaSeleccionada(res.data);
      setValue('mascotaId', res.data.id, { shouldValidate: true });
    } catch {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoading(false);
    }
  };

  const handleMascotaSelected = (mascota) => {
    setMascotaSeleccionada(mascota);
    setValue('mascotaId', mascota.id, { shouldValidate: true });
  };

  const handleCategoriaChange = (catId) => {
    setCategoriaSeleccionada(catId === '' ? '' : String(catId));
    setValue('tipoId', undefined, { shouldDirty: true });
  };

  const onSubmit = async (data) => {
    try {
      await createServicioEstetica(data);
      toast.success('Servicio de estética creado');
      navigate(mascotaIdParam ? `/mascotas/${mascotaIdParam}` : `/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear servicio');
    }
  };

  /* Servicios filtrados por categoría */
  const serviciosFiltrados = useMemo(
    () => categoriaSeleccionada
      ? servicios.filter((s) => s.categoriaId === parseInt(categoriaSeleccionada))
      : [],
    [servicios, categoriaSeleccionada]
  );

  /* Seleccionados */
  const peluqueroSeleccionado = useMemo(
    () => peluqueros.find((p) => p.id === Number(trabajadorIdWatch)),
    [peluqueros, trabajadorIdWatch]
  );
  const tipoSeleccionado = useMemo(
    () => servicios.find((s) => s.id === Number(tipoIdWatch)),
    [servicios, tipoIdWatch]
  );

  /* Opciones SelectField */
  const categoriaOptions = useMemo(
    () => categorias.map((c) => ({
      value: c.id,
      label: c.nombre,
      icon: Palette,
    })),
    [categorias]
  );

  const tipoServicioOptions = useMemo(
    () => serviciosFiltrados.map((s) => ({
      value: s.id,
      label: s.nombre,
      icon: Sparkles,
    })),
    [serviciosFiltrados]
  );

  const peluqueroOptions = useMemo(
    () => peluqueros.map((p) => ({
      value: p.id,
      label: p.nombre,
      description: p.cargo?.nombre || 'Peluquero',
      icon: User,
    })),
    [peluqueros]
  );

  /* Estado por campo */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (touched && value !== undefined && value !== null &&
        String(value).trim() !== '' && value !== 0) return 'valid';
    return 'idle';
  };

  /* Contadores */
  const observacionCount = Object.keys(observacion || {}).length;

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (mascotaIdWatch) filled++;
    if (categoriaSeleccionada) filled++;
    if (tipoIdWatch) filled++;
    if (trabajadorIdWatch) filled++;
    return Math.round((filled / 4) * 100);
  }, [mascotaIdWatch, categoriaSeleccionada, tipoIdWatch, trabajadorIdWatch]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-pink-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="✂️"
        breadcrumbs={
          mascotaSeleccionada
            ? [
                { label: 'Clientes', to: '/clientes' },
                { label: mascotaSeleccionada.dueno?.nombre, to: `/clientes/${mascotaSeleccionada.dueno?.id}` },
                { label: mascotaSeleccionada.nombre, to: `/mascotas/${mascotaSeleccionada.id}` },
                { label: 'Nuevo Servicio' },
              ]
            : [
                { label: 'Estética', to: '/estetica' },
                { label: 'Nuevo Servicio' },
              ]
        }
        title="Nuevo Servicio de Estética"
        subtitle={
          mascotaSeleccionada ? (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <PawPrint className="w-3.5 h-3.5" strokeWidth={2.2} />
              {mascotaSeleccionada.nombre}
              <span className="text-slate-300">·</span>
              <UsersIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
              {mascotaSeleccionada.dueno?.nombre}
            </span>
          ) : (
            'Selecciona un cliente y una mascota'
          )
        }
      />

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-pink-50/60 via-white to-white overflow-hidden mb-4">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                              bg-gradient-to-br from-pink-100 to-pink-50
                              border-2 border-white shadow-md
                              flex items-center justify-center">
                <Scissors className="w-8 h-8 sm:w-9 sm:h-9 text-pink-500" strokeWidth={2} />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-pink-700 uppercase tracking-wider">
                Nuevo servicio
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {mascotaSeleccionada
                  ? `${mascotaSeleccionada.nombre} — ${mascotaSeleccionada.dueno?.nombre || 'sin dueño'}`
                  : 'Sin mascota seleccionada'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {tipoSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Sparkles className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {tipoSeleccionado.nombre}
                  </span>
                )}
                {peluqueroSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {peluqueroSeleccionado.nombre}
                  </span>
                )}
                {observacionCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide">
                    <FileText className="w-3 h-3" strokeWidth={2.5} />
                    {observacionCount} nota{observacionCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-pink-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-pink-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-pink-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-pink-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-pink-400 to-pink-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Formulario ═══ */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('mascotaId')} />

        {/* ClienteSearch (solo si no viene mascotaId por URL) */}
        {!mascotaIdParam && (
          <ClienteSearch onMascotaSelected={handleMascotaSelected} />
        )}

        {/* Mascota seleccionada (cuando viene por URL) */}
        {mascotaSeleccionada && mascotaIdParam && (
          <div className="p-3 bg-pink-50 border border-pink-100 rounded-lg flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-pink-600 shrink-0" strokeWidth={2.2} />
            <p className="text-sm">
              <span className="font-semibold text-slate-800">{mascotaSeleccionada.nombre}</span>
              <span className="text-slate-500"> · Dueño: {mascotaSeleccionada.dueno?.nombre}</span>
            </p>
          </div>
        )}

        {/* ═══ Card: Datos del servicio ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-pink-600 rounded-full"></span>
            <ClipboardList className="w-4 h-4 text-pink-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Datos del servicio</h3>
          </div>

          <div className="space-y-4">
            {/* Categoría */}
            <FormField
              icon={Palette}
              label="Categoría"
              required
              state={categoriaSeleccionada ? 'valid' : 'idle'}
              hint={
                categoriaSeleccionada
                  ? 'Categoría seleccionada'
                  : 'Filtra los tipos de servicio disponibles'
              }
            >
              <SelectField
                value={categoriaSeleccionada ? parseInt(categoriaSeleccionada) : ''}
                onChange={handleCategoriaChange}
                options={categoriaOptions}
                placeholder="Buscar categoría..."
                tone="pink"
                state={categoriaSeleccionada ? 'valid' : 'idle'}
              />
            </FormField>

            {/* Tipo de servicio */}
            <FormField
              icon={Wand2}
              label="Tipo de servicio"
              required
              state={fieldState('tipoId', tipoIdWatch)}
              error={errors.tipoId?.message}
              hint={
                !categoriaSeleccionada
                  ? 'Primero elige una categoría'
                  : serviciosFiltrados.length === 0
                  ? 'No hay servicios en esta categoría'
                  : tipoSeleccionado
                  ? 'Tipo seleccionado'
                  : 'Elige el tipo de servicio a realizar'
              }
            >
              <Controller
                name="tipoId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    options={tipoServicioOptions}
                    placeholder={
                      !categoriaSeleccionada
                        ? 'Primero elige una categoría'
                        : 'Buscar tipo de servicio...'
                    }
                    disabled={!categoriaSeleccionada || serviciosFiltrados.length === 0}
                    state={fieldState('tipoId', tipoIdWatch)}
                    tone="pink"
                  />
                )}
              />
            </FormField>

            {/* Aviso sin servicios */}
            {categoriaSeleccionada && serviciosFiltrados.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-900">
                    No hay servicios en esta categoría
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Registra tipos de servicio para esta categoría en el catálogo.
                  </p>
                </div>
              </div>
            )}

            {/* Peluquero */}
            <FormField
              icon={User}
              label="Peluquero"
              required
              state={fieldState('trabajadorId', trabajadorIdWatch)}
              error={errors.trabajadorId?.message}
              hint={
                peluqueroSeleccionado
                  ? `Cargo: ${peluqueroSeleccionado.cargo?.nombre || '—'}`
                  : 'Selecciona quien realizará el servicio'
              }
            >
              <Controller
                name="trabajadorId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    options={peluqueroOptions}
                    placeholder="Buscar peluquero..."
                    emptyMessage="No hay peluqueros registrados"
                    state={fieldState('trabajadorId', trabajadorIdWatch)}
                    tone="pink"
                  />
                )}
              />
            </FormField>

            {/* Aviso sin peluqueros */}
            {peluqueros.length === 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-red-900">
                    No hay peluqueros registrados
                  </p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Registra trabajadores con cargo "Peluquero Canino" para continuar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ Card: Observaciones ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Observaciones</h3>
            {observacionCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-violet-100 text-violet-700 text-[11px] font-semibold tabular-nums">
                {observacionCount} {observacionCount === 1 ? 'nota' : 'notas'}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Pares clave-valor: estado del pelaje, comportamiento, productos usados...
          </p>
          <div className="rounded-lg border border-slate-200 bg-violet-50/30 p-3">
            <JsonBuilder value={observacion} onChange={setObservacion} />
          </div>
        </section>

        {/* ═══ Footer sticky ═══ */}
        <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                        bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                        border-t border-slate-200 sm:border-0
                        flex flex-col sm:flex-row justify-end gap-2 z-10">
          <button
            type="button"
            onClick={() =>
              mascotaIdParam
                ? navigate(`/mascotas/${mascotaIdParam}`)
                : navigate('/estetica')
            }
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
                Crear servicio
                <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   FormField reutilizable
   ═══════════════════════════════════════════════════ */
const FormField = ({ icon: Icon, label, required, optional, state, error, hint, children }) => {
  const stateCls = {
    idle:  { bg: 'bg-pink-100',    text: 'text-pink-600',    hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-pink-100', text: 'text-pink-600', hintIcon: Info };

  const HintIcon = stateCls.hintIcon;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors ${stateCls.bg}`}>
          <Icon className={`w-3 h-3 ${stateCls.text}`} strokeWidth={2.5} />
        </span>
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        )}
        {state === 'valid' && !optional && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
            Válido
          </span>
        )}
      </label>

      <div className="relative">
        {children}
      </div>

      <div className="flex items-center justify-between gap-2 mt-1 min-h-[16px]">
        {error ? (
          <p className="text-red-600 text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {error}
          </p>
        ) : hint ? (
          <p className={`text-[11px] flex items-center gap-1 ${
            state === 'valid' ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            <HintIcon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {hint}
          </p>
        ) : <span />}
      </div>
    </div>
  );
};

export default NuevoServicioEsteticaPage;