// frontend/src/pages/Operaciones/NuevaOperacionPage.jsx
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createOperacion } from '../../services/operacionService';
import { getTiposOperacion, getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import SelectField from '../../components/common/SelectField';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Activity, Stethoscope, Scissors, User, Check, X,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Info,
  ArrowRight, PawPrint, Heart, Users as UsersIcon,
  ClipboardList, FileText, Palette, Layers,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  tipoId: z.number({ required_error: 'Selecciona el tipo de operación' }),
  mascotaId: z.number({ required_error: 'Selecciona una mascota' }),
  cirujanoId: z.number({ required_error: 'Selecciona un cirujano' }),
  notas: z.any().optional(),
});

/* ═══════════════════════════════════════════════════ */
const NuevaOperacionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [categorias, setCategorias] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [cirujanos, setCirujanos] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);

  const {
    register, handleSubmit, setValue, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { notas: {} },
  });

  const mascotaIdWatch = watch('mascotaId');
  const tipoIdWatch = watch('tipoId');
  const cirujanoIdWatch = watch('cirujanoId');

  /* Sincronizar JSON con el form */
  useEffect(() => { setValue('notas', notas, { shouldDirty: true }); }, [notas, setValue]);

  /* Cargas iniciales */
  useEffect(() => {
    loadData();
    if (mascotaIdParam) cargarMascotaDesdeParam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaIdParam]);

  const loadData = async () => {
    try {
      const [opsRes, catsRes, cirujanosRes] = await Promise.all([
        getTiposOperacion(),
        getCategorias({ tipo: 'operacion' }),
        getTrabajadores(),
      ]);
      setOperaciones(opsRes.data);
      setCategorias(catsRes.data);
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setCirujanos(cirujanosRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre)));
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
      await createOperacion(data);
      toast.success('Operación creada');
      navigate(mascotaIdParam ? `/mascotas/${mascotaIdParam}` : `/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear operación');
    }
  };

  /* Operaciones filtradas por categoría */
  const operacionesFiltradas = useMemo(
    () => categoriaSeleccionada
      ? operaciones.filter((op) => op.categoriaId === parseInt(categoriaSeleccionada))
      : [],
    [operaciones, categoriaSeleccionada]
  );

  /* Seleccionados */
  const cirujanoSeleccionado = useMemo(
    () => cirujanos.find((c) => c.id === Number(cirujanoIdWatch)),
    [cirujanos, cirujanoIdWatch]
  );
  const tipoSeleccionado = useMemo(
    () => operaciones.find((o) => o.id === Number(tipoIdWatch)),
    [operaciones, tipoIdWatch]
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

  const tipoOperacionOptions = useMemo(
    () => operacionesFiltradas.map((op) => ({
      value: op.id,
      label: op.nombre,
      icon: Activity,
    })),
    [operacionesFiltradas]
  );

  const cirujanoOptions = useMemo(
    () => cirujanos.map((c) => ({
      value: c.id,
      label: c.nombre,
      description: c.cargo?.nombre || '—',
      icon: User,
    })),
    [cirujanos]
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
  const notasCount = Object.keys(notas || {}).length;

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (mascotaIdWatch) filled++;
    if (categoriaSeleccionada) filled++;
    if (tipoIdWatch) filled++;
    if (cirujanoIdWatch) filled++;
    return Math.round((filled / 4) * 100);
  }, [mascotaIdWatch, categoriaSeleccionada, tipoIdWatch, cirujanoIdWatch]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-orange-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="⚕️"
        breadcrumbs={
          mascotaSeleccionada
            ? [
                { label: 'Clientes', to: '/clientes' },
                { label: mascotaSeleccionada.dueno?.nombre, to: `/clientes/${mascotaSeleccionada.dueno?.id}` },
                { label: mascotaSeleccionada.nombre, to: `/mascotas/${mascotaSeleccionada.id}` },
                { label: 'Nueva Operación' },
              ]
            : [
                { label: 'Operaciones', to: '/operaciones' },
                { label: 'Nueva Operación' },
              ]
        }
        title="Nueva Operación"
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
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-orange-50/60 via-white to-white overflow-hidden mb-4">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                              bg-gradient-to-br from-orange-100 to-orange-50
                              border-2 border-white shadow-md
                              flex items-center justify-center">
                <Activity className="w-8 h-8 sm:w-9 sm:h-9 text-orange-500" strokeWidth={2} />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider">
                Nueva operación
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {mascotaSeleccionada
                  ? `${mascotaSeleccionada.nombre} — ${mascotaSeleccionada.dueno?.nombre || 'sin dueño'}`
                  : 'Sin mascota seleccionada'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {tipoSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Stethoscope className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {tipoSeleccionado.nombre}
                  </span>
                )}
                {cirujanoSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Scissors className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {cirujanoSeleccionado.nombre}
                  </span>
                )}
                {notasCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide">
                    <FileText className="w-3 h-3" strokeWidth={2.5} />
                    {notasCount} nota{notasCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-orange-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-orange-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-orange-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-orange-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-orange-400 to-orange-600'
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
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
            <p className="text-sm">
              <span className="font-semibold text-slate-800">{mascotaSeleccionada.nombre}</span>
              <span className="text-slate-500"> · Dueño: {mascotaSeleccionada.dueno?.nombre}</span>
            </p>
          </div>
        )}

        {/* ═══ Card: Datos de la operación ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-orange-600 rounded-full"></span>
            <ClipboardList className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Datos de la operación</h3>
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
                  : 'Filtra los tipos de operación disponibles'
              }
            >
              <SelectField
                value={categoriaSeleccionada ? parseInt(categoriaSeleccionada) : ''}
                onChange={handleCategoriaChange}
                options={categoriaOptions}
                placeholder="Buscar categoría..."
                tone="orange"
                state={categoriaSeleccionada ? 'valid' : 'idle'}
              />
            </FormField>

            {/* Tipo de operación */}
            <FormField
              icon={Activity}
              label="Tipo de operación"
              required
              state={fieldState('tipoId', tipoIdWatch)}
              error={errors.tipoId?.message}
              hint={
                !categoriaSeleccionada
                  ? 'Primero elige una categoría'
                  : operacionesFiltradas.length === 0
                  ? 'No hay operaciones en esta categoría'
                  : tipoSeleccionado
                  ? 'Tipo seleccionado'
                  : 'Elige el tipo de operación'
              }
            >
              <Controller
                name="tipoId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    options={tipoOperacionOptions}
                    placeholder={
                      !categoriaSeleccionada
                        ? 'Primero elige una categoría'
                        : 'Buscar tipo de operación...'
                    }
                    disabled={!categoriaSeleccionada || operacionesFiltradas.length === 0}
                    state={fieldState('tipoId', tipoIdWatch)}
                    tone="orange"
                  />
                )}
              />
            </FormField>

            {/* Aviso sin operaciones */}
            {categoriaSeleccionada && operacionesFiltradas.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-900">
                    No hay operaciones en esta categoría
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Registra tipos de operación para esta categoría en el catálogo.
                  </p>
                </div>
              </div>
            )}

            {/* Cirujano */}
            <FormField
              icon={Scissors}
              label="Cirujano"
              required
              state={fieldState('cirujanoId', cirujanoIdWatch)}
              error={errors.cirujanoId?.message}
              hint={
                cirujanoSeleccionado
                  ? `Cargo: ${cirujanoSeleccionado.cargo?.nombre || '—'}`
                  : 'Selecciona el cirujano que realizará la operación'
              }
            >
              <Controller
                name="cirujanoId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    options={cirujanoOptions}
                    placeholder="Buscar cirujano..."
                    state={fieldState('cirujanoId', cirujanoIdWatch)}
                    tone="orange"
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        {/* ═══ Card: Notas quirúrgicas ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Notas quirúrgicas</h3>
            {notasCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-violet-100 text-violet-700 text-[11px] font-semibold tabular-nums">
                {notasCount} {notasCount === 1 ? 'nota' : 'notas'}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Pares clave-valor: hallazgos, técnica utilizada, complicaciones...
          </p>
          <div className="rounded-lg border border-slate-200 bg-violet-50/30 p-3">
            <JsonBuilder value={notas} onChange={setNotas} />
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
                : navigate('/operaciones')
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
                       px-5 py-2.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold
                       hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800
                       transition disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md shadow-orange-600/25
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
                Crear operación
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
    idle:  { bg: 'bg-orange-100',  text: 'text-orange-600',  hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-orange-100', text: 'text-orange-600', hintIcon: Info };

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

export default NuevaOperacionPage;