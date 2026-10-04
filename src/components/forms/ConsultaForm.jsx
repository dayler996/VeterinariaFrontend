// frontend/src/components/forms/ConsultaForm.jsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useMemo } from 'react';
import SelectField from '../common/SelectField';
import JsonBuilder from '../common/JsonBuilder';
import ImageUploader from '../common/ImageUploader';
import {
  Stethoscope, User, FileText, Pill, Camera, Check, X,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Info,
  ArrowRight, PawPrint, Heart, ClipboardList, Beaker,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  mascotaId: z.number({ required_error: 'Selecciona una mascota' }),
  doctorId: z.number({ required_error: 'Selecciona un doctor' }),
  motivo: z
    .string()
    .min(1, 'El motivo es obligatorio')
    .min(5, 'Mínimo 5 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  diagnostico: z.any().optional(),
  recetaDetalle: z.any().optional(),
  fotoReceta: z.string().nullable().optional(),
  citaId: z.number().optional(),
});

/* ═══════════════════════════════════════════════════
   COMPONENTE
   ═══════════════════════════════════════════════════ */
const ConsultaForm = ({
  initialData,
  onSave,
  onCancel,
  mascotas = [],
  doctores = [],
  citaId,
}) => {
  const isEditing = !!initialData;

  /* Estados para JsonBuilder */
  const [diagnostico, setDiagnostico] = useState({});
  const [recetaDetalle, setRecetaDetalle] = useState({});

  const {
    register, handleSubmit, watch, setValue, reset, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: initialData
      ? { ...initialData }
      : { citaId },
  });

  /* Watchers */
  const mascotaIdWatch = watch('mascotaId');
  const doctorIdWatch = watch('doctorId');
  const motivoWatch = watch('motivo');
  const fotoRecetaWatch = watch('fotoReceta');

  /* Reset al editar + cargar JSON */
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setDiagnostico(initialData.diagnostico || {});
      setRecetaDetalle(initialData.recetaDetalle || {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset]);

  /* Sincronizar JSON con el form */
  useEffect(() => { setValue('diagnostico', diagnostico, { shouldDirty: true }); }, [diagnostico, setValue]);
  useEffect(() => { setValue('recetaDetalle', recetaDetalle, { shouldDirty: true }); }, [recetaDetalle, setValue]);

  /* Seleccionados */
  const mascotaSeleccionada = useMemo(
    () => mascotas.find((m) => m.id === Number(mascotaIdWatch)),
    [mascotas, mascotaIdWatch]
  );
  const doctorSeleccionado = useMemo(
    () => doctores.find((d) => d.id === Number(doctorIdWatch)),
    [doctores, doctorIdWatch]
  );

  /* Opciones para SelectField */
  const mascotaOptions = useMemo(
    () => mascotas.map((m) => ({
      value: m.id,
      label: m.nombre,
      description: `Dueño: ${m.dueno?.nombre || 'sin dueño'}`,
      icon: PawPrint,
    })),
    [mascotas]
  );

  const doctorOptions = useMemo(
    () => doctores.map((d) => ({
      value: d.id,
      label: d.nombre,
      description: d.cargo?.nombre || '—',
      icon: User,
    })),
    [doctores]
  );

  /* Estado por campo */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (touched && value !== undefined && value !== null &&
        String(value).trim() !== '' && value !== 0) return 'valid';
    return 'idle';
  };

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (mascotaIdWatch) filled++;
    if (doctorIdWatch) filled++;
    if (motivoWatch?.trim() && motivoWatch.length >= 5) filled++;
    return Math.round((filled / 3) * 100);
  }, [mascotaIdWatch, doctorIdWatch, motivoWatch]);

  /* Contadores JSON */
  const diagnosticoCount = Object.keys(diagnostico || {}).length;
  const recetaCount = Object.keys(recetaDetalle || {}).length;

  /* Submit */
  const onSubmit = (data) => {
    // Asegurar que diagnostico y recetaDetalle van como objetos
    const payload = {
      ...data,
      diagnostico: diagnostico || {},
      recetaDetalle: recetaDetalle || {},
    };
    onSave(payload);
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-white overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                              bg-gradient-to-br from-blue-100 to-blue-50
                              border-2 border-white shadow-md
                              flex items-center justify-center">
                <Stethoscope className="w-8 h-8 sm:w-9 sm:h-9 text-blue-500" strokeWidth={2} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                {isEditing ? 'Editando consulta' : 'Vista previa'}
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {mascotaSeleccionada
                  ? `${mascotaSeleccionada.nombre} — ${mascotaSeleccionada.dueno?.nombre || 'sin dueño'}`
                  : 'Nueva consulta'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {doctorSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    Dr. {doctorSeleccionado.nombre}
                  </span>
                )}
                {diagnosticoCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide">
                    <Beaker className="w-3 h-3" strokeWidth={2.5} />
                    {diagnosticoCount} dx
                  </span>
                )}
                {recetaCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                    <Pill className="w-3 h-3" strokeWidth={2.5} />
                    {recetaCount} med
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-blue-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-500" strokeWidth={2.5} />
                Progreso del formulario
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-blue-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Datos de la consulta ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Datos de la consulta</h3>
        </div>

        <div className="space-y-4">
          {/* Mascota */}
          <FormField
            icon={PawPrint}
            label="Mascota"
            required
            state={fieldState('mascotaId', mascotaIdWatch)}
            error={errors.mascotaId?.message}
            hint={
              mascotaSeleccionada
                ? `Dueño: ${mascotaSeleccionada.dueno?.nombre || '—'}`
                : 'Selecciona la mascota que fue atendida'
            }
          >
            <Controller
              name="mascotaId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={mascotaOptions}
                  placeholder="Buscar mascota..."
                  state={fieldState('mascotaId', mascotaIdWatch)}
                  tone="blue"
                />
              )}
            />
          </FormField>

          {/* Doctor */}
          <FormField
            icon={User}
            label="Doctor"
            required
            state={fieldState('doctorId', doctorIdWatch)}
            error={errors.doctorId?.message}
            hint={
              doctorSeleccionado
                ? `Cargo: ${doctorSeleccionado.cargo?.nombre || '—'}`
                : 'Selecciona el doctor que atendió'
            }
          >
            <Controller
              name="doctorId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={doctorOptions}
                  placeholder="Buscar doctor..."
                  state={fieldState('doctorId', doctorIdWatch)}
                  tone="blue"
                />
              )}
            />
          </FormField>

          {/* Motivo */}
          <FormField
            icon={FileText}
            label="Motivo de la consulta"
            required
            state={fieldState('motivo', motivoWatch)}
            error={errors.motivo?.message}
            hint={`${motivoWatch?.length || 0}/500 caracteres`}
          >
            <textarea
              rows="4"
              placeholder="Describe el motivo por el cual se atendió a la mascota..."
              {...register('motivo')}
              className={`${inputCls(fieldState('motivo', motivoWatch))} resize-none`}
            />
          </FormField>
        </div>
      </section>

      {/* ═══ Diagnóstico ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
          <Beaker className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Diagnóstico</h3>
          {diagnosticoCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full
                              bg-violet-100 text-violet-700 text-[11px] font-semibold tabular-nums">
              {diagnosticoCount} {diagnosticoCount === 1 ? 'valor' : 'valores'}
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
          Agrega pares clave-valor: síntomas, hallazgos, conclusión diagnóstica...
        </p>
        <div className="rounded-lg border border-slate-200 bg-violet-50/30 p-3">
          <JsonBuilder value={diagnostico} onChange={setDiagnostico} />
        </div>
      </section>

      {/* ═══ Receta ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
          <Pill className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Receta</h3>
          {recetaCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full
                              bg-emerald-100 text-emerald-700 text-[11px] font-semibold tabular-nums">
              {recetaCount} {recetaCount === 1 ? 'medicamento' : 'medicamentos'}
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
          Pares clave-valor: medicamento, dosis, frecuencia, duración...
        </p>
        <div className="rounded-lg border border-slate-200 bg-emerald-50/30 p-3">
          <JsonBuilder value={recetaDetalle} onChange={setRecetaDetalle} />
        </div>
      </section>

      {/* ═══ Foto de la receta ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
          <Camera className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Foto de la receta</h3>
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
          Adjunta una imagen de la receta física si aplica
        </p>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <ImageUploader
            value={fotoRecetaWatch}
            onChange={(url) => setValue('fotoReceta', url, { shouldDirty: true })}
            folder="receta"
            label="Subir imagen"
          />
        </div>
      </section>

      {/* citaId oculto */}
      {citaId && <input type="hidden" {...register('citaId')} value={citaId} />}

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
                     px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold
                     hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800
                     transition disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-md shadow-blue-600/25
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
              {isEditing ? 'Guardar cambios' : 'Crear consulta'}
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
    idle:  { bg: 'bg-blue-100',    text: 'text-blue-600',    hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-blue-100', text: 'text-blue-600', hintIcon: Info };

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
        {state === 'valid' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
          </span>
        )}
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

/* ═══════════════════════════════════════════════════
   Clases input
   ═══════════════════════════════════════════════════ */
const inputCls = (state) => {
  const base = 'w-full rounded-lg px-3.5 py-2.5 text-sm bg-white border transition-colors ' +
               'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400 pr-10';
  if (state === 'error') return `${base} border-red-400 focus:ring-red-500`;
  if (state === 'valid') return `${base} border-emerald-300 focus:ring-emerald-500`;
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-blue-500`;
};

export default ConsultaForm;