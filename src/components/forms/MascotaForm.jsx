// frontend/src/components/forms/MascotaForm.jsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useMemo } from 'react';
import { getEspecies } from '../../services/especieService';
import { getRazas } from '../../services/razaService';
import ImageUploader from '../common/ImageUploader';
import SelectField from '../common/SelectField';
import { getImageUrl } from '../../utils/imageUtils';
import {
  PawPrint, Dog, Cat, Heart, Cake, Camera, Check, X,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Info,
  ArrowRight, Layers, Dna,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
const getEspecieIcon = (nombre) => {
  const n = (nombre || '').toLowerCase();
  if (n.includes('gat') || n.includes('fel')) return Cat;
  if (n.includes('perr') || n.includes('can')) return Dog;
  return PawPrint;
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  if (isNaN(nac)) return null;
  let anios = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) anios--;
  const meses = (m + 12) % 12;
  if (anios < 1) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'}`;
};

const esFechaPasada = (value) => {
  if (!value) return false;
  return new Date(value) < new Date();
};

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  sexo: z.enum(['M', 'F'], { required_error: 'Selecciona el sexo' }),
  fechaNacimiento: z
    .string()
    .min(1, 'La fecha es obligatoria')
    .refine(
      (v) => !v || new Date(v) <= new Date(),
      'La fecha no puede ser futura'
    ),
  especieId: z.number({ required_error: 'Selecciona la especie' }),
  razaId: z.number({ required_error: 'Selecciona la raza' }),
  clienteId: z.number({ required_error: 'Cliente requerido' }),
  foto: z.string().nullable().optional(),
});

/* ═══════════════════════════════════════════════════
   COMPONENTE
   ═══════════════════════════════════════════════════ */
const MascotaForm = ({ initialData, onSave, onCancel, clienteId }) => {
  const isEditing = !!initialData;

  const [especies, setEspecies] = useState([]);
  const [razas, setRazas] = useState([]);
  const [loadingRazas, setLoadingRazas] = useState(false);

  const {
    register, handleSubmit, watch, setValue, reset, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: initialData
      ? {
          ...initialData,
          clienteId: initialData.dueno?.id || clienteId,
          fechaNacimiento: initialData.fechaNacimiento
            ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0]
            : '',
        }
      : { clienteId },
  });

  const nombreWatch = watch('nombre');
  const sexoWatch = watch('sexo');
  const fechaWatch = watch('fechaNacimiento');
  const especieIdWatch = watch('especieId');
  const razaIdWatch = watch('razaId');
  const fotoWatch = watch('foto');

  /* Cargar especies */
  useEffect(() => { loadEspecies(); }, []);

  /* Cargar razas cuando cambia especie */
  useEffect(() => {
    if (especieIdWatch) loadRazas(especieIdWatch);
    else {
      setRazas([]);
      // Limpiar raza si no hay especie
      if (razaIdWatch) setValue('razaId', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [especieIdWatch]);

  /* Reset al editar */
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        clienteId: initialData.dueno?.id || clienteId,
        fechaNacimiento: initialData.fechaNacimiento
          ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0]
          : '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset]);

  const loadEspecies = async () => {
    try {
      const res = await getEspecies();
      setEspecies(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadRazas = async (especieId) => {
    setLoadingRazas(true);
    try {
      const res = await getRazas({ especieId });
      setRazas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRazas(false);
    }
  };

  const onSubmit = (data) => onSave(data);

  /* Opciones para SelectField */
  const especieOptions = useMemo(
    () => especies.map((e) => ({
      value: e.id,
      label: e.nombre,
      icon: getEspecieIcon(e.nombre),
    })),
    [especies]
  );

  const razaOptions = useMemo(
    () => razas.map((r) => ({
      value: r.id,
      label: r.nombre,
    })),
    [razas]
  );

  /* Estado por campo */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (touched && value !== undefined && value !== null && String(value).trim() !== '' && value !== 0) return 'valid';
    return 'idle';
  };

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (nombreWatch?.trim()) filled++;
    if (sexoWatch) filled++;
    if (fechaWatch) filled++;
    if (especieIdWatch) filled++;
    if (razaIdWatch) filled++;
    return Math.round((filled / 5) * 100);
  }, [nombreWatch, sexoWatch, fechaWatch, especieIdWatch, razaIdWatch]);

  /* Datos derivados */
  const especieSeleccionada = especies.find((e) => e.id === Number(especieIdWatch));
  const razaSeleccionada = razas.find((r) => r.id === Number(razaIdWatch));
  const EspecieIcon = getEspecieIcon(especieSeleccionada?.nombre);
  const edad = calcularEdad(fechaWatch);

  const initials = (nombreWatch || '').trim().charAt(0).toUpperCase() || '?';

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-cyan-50/60 via-white to-white overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              {fotoWatch ? (
                <img
                  src={getImageUrl(fotoWatch)}
                  alt="Preview"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                                bg-gradient-to-br from-cyan-100 to-cyan-50
                                border-2 border-white shadow-md
                                flex items-center justify-center">
                  <EspecieIcon className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-500" strokeWidth={2} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wider">
                {isEditing ? 'Editando mascota' : 'Vista previa'}
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {nombreWatch?.trim() || 'Nueva mascota'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {especieSeleccionada && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <EspecieIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {especieSeleccionada.nombre}
                  </span>
                )}
                {razaSeleccionada && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{razaSeleccionada.nombre}</span>
                  </>
                )}
                {sexoWatch && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    text-[10px] font-bold uppercase tracking-wide
                    ${sexoWatch === 'M'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-pink-100 text-pink-700'}`}>
                    {sexoWatch === 'M' ? '♂ Masc' : '♀ Fem'}
                  </span>
                )}
                {edad && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Cake className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {edad}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-cyan-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-500" strokeWidth={2.5} />
                Progreso del formulario
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-cyan-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-cyan-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Datos básicos ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-cyan-600 rounded-full"></span>
          <PawPrint className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Datos básicos</h3>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <FormField
            icon={PawPrint}
            label="Nombre de la mascota"
            required
            state={fieldState('nombre', nombreWatch)}
            error={errors.nombre?.message}
            hint={
              fieldState('nombre', nombreWatch) === 'valid'
                ? 'Nombre válido'
                : 'Como la conoces o aparece en su carnet'
            }
          >
            <input
              autoFocus
              placeholder="Ej: Toby, Luna, Max..."
              {...register('nombre')}
              className={inputCls(fieldState('nombre', nombreWatch))}
            />
          </FormField>

          {/* Sexo — Segmented */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-cyan-500" strokeWidth={2.2} />
              Sexo <span className="text-red-500">*</span>
              {sexoWatch && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                  Válido
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'M', label: 'Macho',    symbol: '♂', tone: 'blue' },
                { value: 'F', label: 'Hembra',   symbol: '♀', tone: 'pink' },
              ].map((opt) => {
                const isActive = sexoWatch === opt.value;
                const toneCls = opt.tone === 'blue'
                  ? {
                      active: 'bg-blue-500 border-blue-500 text-white shadow-blue-500/30',
                      hover: 'hover:border-blue-300 hover:bg-blue-50',
                    }
                  : {
                      active: 'bg-pink-500 border-pink-500 text-white shadow-pink-500/30',
                      hover: 'hover:border-pink-300 hover:bg-pink-50',
                    };
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('sexo', opt.value, { shouldValidate: true, shouldDirty: true })}
                    className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-lg
                               border-2 text-sm font-semibold transition-all
                               ${isActive
                                 ? `${toneCls.active} shadow-md`
                                 : `bg-white border-slate-200 text-slate-600 ${toneCls.hover}`}`}
                  >
                    <span className="text-lg leading-none">{opt.symbol}</span>
                    <span>{opt.label}</span>
                    {isActive && (
                      <Check className="w-4 h-4 absolute top-1.5 right-1.5 opacity-90" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('sexo')} />
            {errors.sexo && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errors.sexo.message}
              </p>
            )}
          </div>

          {/* Fecha nacimiento */}
          <FormField
            icon={Cake}
            label="Fecha de nacimiento"
            required
            state={fieldState('fechaNacimiento', fechaWatch)}
            error={errors.fechaNacimiento?.message}
            hint={
              edad
                ? `Edad calculada: ${edad}`
                : 'Fecha aproximada si no la conoces con exactitud'
            }
          >
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...register('fechaNacimiento')}
              className={inputCls(fieldState('fechaNacimiento', fechaWatch))}
            />
          </FormField>
        </div>
      </section>

      {/* ═══ Clasificación ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-cyan-600 rounded-full"></span>
          <Layers className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Clasificación</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Especie */}
          <FormField
            icon={Dog}
            label="Especie"
            required
            state={fieldState('especieId', especieIdWatch)}
            error={errors.especieId?.message}
            hint={especieSeleccionada ? 'Especie seleccionada' : 'Ej: Perro, Gato, Ave'}
          >
            <Controller
              name="especieId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue('razaId', undefined);
                  }}
                  options={especieOptions}
                  placeholder="Buscar especie..."
                  state={fieldState('especieId', especieIdWatch)}
                  tone="cyan"
                />
              )}
            />
          </FormField>

          {/* Raza */}
          <FormField
            icon={Dna}
            label="Raza"
            required
            state={fieldState('razaId', razaIdWatch)}
            error={errors.razaId?.message}
            hint={
              !especieIdWatch
                ? 'Primero selecciona la especie'
                : loadingRazas
                ? 'Cargando razas...'
                : razas.length === 0
                ? 'No hay razas para esta especie'
                : razaSeleccionada
                ? 'Raza seleccionada'
                : 'Elige la raza de la mascota'
            }
          >
            <Controller
              name="razaId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={razaOptions}
                  placeholder={
                    !especieIdWatch
                      ? 'Primero elige la especie'
                      : loadingRazas
                      ? 'Cargando...'
                      : 'Buscar raza...'
                  }
                  disabled={!especieIdWatch || loadingRazas || razas.length === 0}
                  state={fieldState('razaId', razaIdWatch)}
                  tone="cyan"
                />
              )}
            />
          </FormField>
        </div>

        {/* Aviso si no hay razas */}
        {especieIdWatch && !loadingRazas && razas.length === 0 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900">
                Sin razas registradas para esta especie
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Registra razas desde el catálogo o contacta al administrador.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ═══ Foto ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-cyan-600 rounded-full"></span>
          <Camera className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Foto de la mascota</h3>
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
          Una foto ayuda a identificar a la mascota rápidamente
        </p>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <ImageUploader
            value={fotoWatch}
            onChange={(url) => setValue('foto', url, { shouldDirty: true })}
            folder="mascota"
            label="Subir imagen"
          />
        </div>
      </section>

      {/* Input oculto clienteId */}
      <input type="hidden" {...register('clienteId')} />

      {/* ═══ Footer sticky ═══ */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                      bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                      border-t border-slate-200 sm:border-0
                      flex flex-col sm:flex-row justify-end gap-2 z-10">
        <button
          type="button"
          onClick={onCancel}
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
                     px-5 py-2.5 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-semibold
                     hover:from-cyan-600 hover:to-cyan-700 active:from-cyan-700 active:to-cyan-800
                     transition disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-md shadow-cyan-600/25
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
              {isEditing ? 'Guardar cambios' : 'Crear mascota'}
              <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* ═══════════════════════════════════════════════════
   FormField reutilizable
   ═══════════════════════════════════════════════════ */
const FormField = ({ icon: Icon, label, required, optional, state, error, hint, children }) => {
  const stateCls = {
    idle:  { bg: 'bg-cyan-100',    text: 'text-cyan-600',    hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-cyan-100', text: 'text-cyan-600', hintIcon: Info };

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

      <div className="relative">{children}</div>

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

/* ═══════════════════════════════════════════════════
   Clases input
   ═══════════════════════════════════════════════════ */
const inputCls = (state) => {
  const base = 'w-full rounded-lg px-3.5 py-2.5 text-sm bg-white border transition-colors ' +
               'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400 pr-10';
  if (state === 'error') return `${base} border-red-400 focus:ring-red-500`;
  if (state === 'valid') return `${base} border-emerald-300 focus:ring-emerald-500`;
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-cyan-500`;
};

export default MascotaForm;