// frontend/src/components/forms/CitaForm.jsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useMemo } from 'react';
import {
  Stethoscope, Activity, Scissors, User, Calendar,
  Clock, FileText, Check, X, AlertTriangle, Sparkles,
  CheckCircle2, XCircle, Info, ArrowRight, Trash2,
  PawPrint, AlertCircle,
} from 'lucide-react';
import SelectField from '../common/SelectField';

/* ═══════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════ */
const TIPOS_SERVICIO = [
  { value: 'consulta',  label: 'Consulta',   description: 'Consulta médica general',  Icon: Stethoscope, tone: 'blue' },
  { value: 'operacion', label: 'Operación',  description: 'Cirugía o procedimiento',  Icon: Activity,    tone: 'orange' },
  { value: 'estetica',  label: 'Estética',   description: 'Servicios de peluquería',  Icon: Scissors,    tone: 'pink' },
];

const CARGOS_POR_TIPO = {
  consulta:  ['Médico Veterinario', 'Cirujano Especialista'],
  operacion: ['Médico Veterinario', 'Cirujano Especialista'],
  estetica:  ['Peluquero Canino'],
};

const TONE_CLS = {
  blue:   { icon: 'text-blue-600',   bg: 'bg-blue-100',   active: 'bg-blue-500 border-blue-500 text-white shadow-blue-500/30',     hover: 'hover:border-blue-300 hover:bg-blue-50' },
  orange: { icon: 'text-orange-600', bg: 'bg-orange-100', active: 'bg-orange-500 border-orange-500 text-white shadow-orange-500/30', hover: 'hover:border-orange-300 hover:bg-orange-50' },
  pink:   { icon: 'text-pink-600',   bg: 'bg-pink-100',   active: 'bg-pink-500 border-pink-500 text-white shadow-pink-500/30',     hover: 'hover:border-pink-300 hover:bg-pink-50' },
};

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  mascotaId: z.number({ required_error: 'Selecciona una mascota' }),
  tipoServicio: z.string({ required_error: 'Selecciona el tipo de servicio' }).min(1, 'Selecciona el tipo de servicio'),
  doctorId: z.number({ required_error: 'Selecciona un profesional' }),
  fechaHora: z.string().min(1, 'Selecciona fecha y hora'),
  motivo: z.string().max(300, 'Máximo 300 caracteres').optional().or(z.literal('')),
  estadoCitaId: z.number().default(1),
});

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
const formatFechaHora = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return '';
  return d.toLocaleString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const esFechaFutura = (value) => {
  if (!value) return false;
  return new Date(value) > new Date();
};

/* ═══════════════════════════════════════════════════
   COMPONENTE
   ═══════════════════════════════════════════════════ */
const CitaForm = ({
  initialData, onSave, onCancel, onDelete,
  doctores: todosDoctores = [], mascotas = [], estados = [],
}) => {
  const isEditing = !!initialData;
  const [doctoresFiltrados, setDoctoresFiltrados] = useState([]);

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
          fechaHora: initialData.fechaHora
            ? new Date(initialData.fechaHora).toISOString().slice(0, 16)
            : '',
          tipoServicio: initialData.tipoServicio || '',
        }
      : { estadoCitaId: 1, tipoServicio: '' },
  });

  const tipoServicioSeleccionado = watch('tipoServicio');
  const doctorIdWatch = watch('doctorId');
  const fechaHoraWatch = watch('fechaHora');
  const motivoWatch = watch('motivo');
  const mascotaIdWatch = watch('mascotaId');
  const estadoIdWatch = watch('estadoCitaId');

  /* Reset */
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        fechaHora: initialData.fechaHora
          ? new Date(initialData.fechaHora).toISOString().slice(0, 16)
          : '',
        tipoServicio: initialData.tipoServicio || '',
      });
    }
  }, [initialData, reset]);

  /* Inferir tipo desde el doctor al editar */
  useEffect(() => {
    if (!initialData || !todosDoctores.length) return;
    if (tipoServicioSeleccionado) return;
    const doctor = todosDoctores.find((d) => d.id === initialData.doctorId);
    if (!doctor) return;
    const cargo = doctor.cargo?.nombre;
    const tipoInferido = Object.entries(CARGOS_POR_TIPO).find(([, cargos]) =>
      cargos.includes(cargo)
    )?.[0];
    if (tipoInferido) setValue('tipoServicio', tipoInferido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, todosDoctores]);

  /* Filtrar doctores */
  useEffect(() => {
    if (tipoServicioSeleccionado && todosDoctores) {
      const cargosPermitidos = CARGOS_POR_TIPO[tipoServicioSeleccionado] || [];
      setDoctoresFiltrados(todosDoctores.filter((d) =>
        cargosPermitidos.includes(d.cargo?.nombre)
      ));
    } else {
      setDoctoresFiltrados([]);
    }
  }, [tipoServicioSeleccionado, todosDoctores]);

  /* Seleccionados */
  const mascotaSeleccionada = useMemo(
    () => mascotas.find((m) => m.id === Number(mascotaIdWatch)),
    [mascotas, mascotaIdWatch]
  );
  const doctorSeleccionado = useMemo(
    () => doctoresFiltrados.find((d) => d.id === Number(doctorIdWatch))
      || todosDoctores.find((d) => d.id === Number(doctorIdWatch)),
    [doctoresFiltrados, todosDoctores, doctorIdWatch]
  );
  const estadoSeleccionado = useMemo(
    () => estados.find((e) => e.id === Number(estadoIdWatch)),
    [estados, estadoIdWatch]
  );

  /* Opciones para selects */
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
    () => doctoresFiltrados.map((d) => ({
      value: d.id,
      label: d.nombre,
      description: d.cargo?.nombre || '—',
      icon: User,
    })),
    [doctoresFiltrados]
  );

  const estadoOptions = useMemo(
    () => estados.map((e) => ({
      value: e.id,
      label: e.nombre,
    })),
    [estados]
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
    if (tipoServicioSeleccionado) filled++;
    if (doctorIdWatch) filled++;
    if (fechaHoraWatch) filled++;
    return Math.round((filled / 4) * 100);
  }, [mascotaIdWatch, tipoServicioSeleccionado, doctorIdWatch, fechaHoraWatch]);

  const onSubmit = (data) => {
    const { tipoServicio, ...citaData } = data;
    onSave({
      ...citaData,
      mascotaId: Number(citaData.mascotaId),
      doctorId: Number(citaData.doctorId),
      estadoCitaId: Number(citaData.estadoCitaId),
    });
  };

  const handleDelete = () => {
    if (window.confirm('¿Está seguro de eliminar esta cita?')) onDelete();
  };

  const sinDoctores = tipoServicioSeleccionado && doctoresFiltrados.length === 0;
  const fechaValida = fechaHoraWatch && esFechaFutura(fechaHoraWatch);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ═══ Vista previa ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-white overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              {tipoServicioSeleccionado ? (
                (() => {
                  const cfg = TIPOS_SERVICIO.find((t) => t.value === tipoServicioSeleccionado);
                  const Icon = cfg.Icon;
                  const tone = TONE_CLS[cfg.tone];
                  return (
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
                                     border-2 border-white shadow-md ${tone.bg}`}>
                      <Icon className={`w-8 h-8 sm:w-9 sm:h-9 ${tone.icon}`} strokeWidth={2.2} />
                    </div>
                  );
                })()
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50
                                border-2 border-white shadow-md flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-500" strokeWidth={2.2} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                {isEditing ? 'Editando cita' : 'Vista previa'}
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {mascotaSeleccionada
                  ? `${mascotaSeleccionada.nombre} — ${mascotaSeleccionada.dueno?.nombre || 'sin dueño'}`
                  : 'Nueva cita'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {tipoServicioSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Sparkles className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {TIPOS_SERVICIO.find((t) => t.value === tipoServicioSeleccionado)?.label}
                  </span>
                )}
                {doctorSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {doctorSeleccionado.nombre}
                  </span>
                )}
                {fechaHoraWatch && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                    <Calendar className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {new Date(fechaHoraWatch).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
                {estadoSeleccionado && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                    {estadoSeleccionado.nombre}
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

      {/* ═══ Detalles ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Detalles de la cita</h3>
        </div>

        <div className="space-y-4">

          {/* Mascota */}
          <FormField
            icon={PawPrint}
            label="Mascota"
            required
            state={fieldState('mascotaId', mascotaIdWatch)}
            error={errors.mascotaId?.message}
            hint={mascotaSeleccionada
              ? `Dueño: ${mascotaSeleccionada.dueno?.nombre || '—'}`
              : 'Selecciona la mascota que será atendida'}
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

          {/* Tipo de servicio — Segmented control */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
              Tipo de servicio <span className="text-red-500">*</span>
              {tipoServicioSeleccionado && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                  Válido
                </span>
              )}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIPOS_SERVICIO.map((opt) => {
                const isActive = tipoServicioSeleccionado === opt.value;
                const tone = TONE_CLS[opt.tone];
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setValue('tipoServicio', opt.value, { shouldValidate: true, shouldDirty: true });
                      setValue('doctorId', undefined);
                    }}
                    className={`relative flex items-center gap-2.5 px-3 py-3 rounded-lg
                               border-2 text-left transition-all
                               ${isActive
                                 ? `${tone.active} shadow-md`
                                 : `bg-white border-slate-200 text-slate-600 ${tone.hover}`}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                     ${isActive ? 'bg-white/20' : tone.bg}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tone.icon}`} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {opt.label}
                      </p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                        {opt.description}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 absolute top-1.5 right-1.5 opacity-90" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('tipoServicio')} />
            {errors.tipoServicio && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errors.tipoServicio.message}
              </p>
            )}
          </div>

          {/* Profesional */}
          <FormField
            icon={User}
            label="Profesional"
            required
            state={doctorIdWatch ? 'valid' : 'idle'}
            error={errors.doctorId?.message}
            hint={sinDoctores
              ? null
              : doctorSeleccionado
              ? `Cargo: ${doctorSeleccionado.cargo?.nombre || '—'}`
              : tipoServicioSeleccionado
              ? 'Elige quién atenderá la cita'
              : 'Primero elige un tipo de servicio'}
          >
            <Controller
              name="doctorId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={doctorOptions}
                  placeholder={
                    !tipoServicioSeleccionado
                      ? 'Primero elige el tipo de servicio'
                      : sinDoctores
                      ? 'Sin profesionales disponibles'
                      : 'Buscar profesional...'
                  }
                  disabled={!tipoServicioSeleccionado || sinDoctores}
                  state={errors.doctorId ? 'error' : doctorIdWatch ? 'valid' : 'idle'}
                  tone="blue"
                />
              )}
            />
          </FormField>

          {sinDoctores && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 -mt-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-900">
                  No hay profesionales disponibles
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  No encontramos profesionales con el cargo requerido. Contacta al administrador o cambia el tipo de servicio.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Fecha y hora ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <Clock className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Fecha y hora</h3>
        </div>

        <FormField
          icon={Calendar}
          label="Fecha y hora de la cita"
          required
          state={fieldState('fechaHora', fechaHoraWatch)}
          error={errors.fechaHora?.message}
          hint={fechaValida
            ? 'Cita programada a futuro'
            : fechaHoraWatch
            ? 'La fecha está en el pasado'
            : 'Selecciona cuándo será la cita'}
        >
          <input
            type="datetime-local"
            {...register('fechaHora')}
            className={inputCls(fieldState('fechaHora', fechaHoraWatch))}
          />
        </FormField>

        {fechaHoraWatch && (
          <div className={`mt-2 flex items-start gap-2 p-2.5 rounded-lg border ${
            fechaValida ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-200'
          }`}>
            {fechaValida ? (
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" strokeWidth={2.5} />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.5} />
            )}
            <p className={`text-[11px] ${fechaValida ? 'text-blue-700' : 'text-amber-700'}`}>
              {fechaValida ? 'Cita programada para el ' : 'La fecha está en el pasado: '}
              <span className="font-semibold capitalize">{formatFechaHora(fechaHoraWatch)}</span>
            </p>
          </div>
        )}
      </section>

      {/* ═══ Notas y estado ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <FileText className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Notas y estado</h3>
        </div>

        <div className="space-y-4">
          <FormField
            icon={FileText}
            label="Motivo"
            optional
            state={fieldState('motivo', motivoWatch)}
            error={errors.motivo?.message}
            hint={`${motivoWatch?.length || 0}/300 caracteres`}
          >
            <textarea
              rows="3"
              placeholder="Describe el motivo de la cita (opcional)..."
              {...register('motivo')}
              className={`${inputCls(fieldState('motivo', motivoWatch))} resize-none`}
            />
          </FormField>

          <FormField
            icon={Activity}
            label="Estado"
            state={fieldState('estadoCitaId', estadoIdWatch)}
            hint="Estado actual de la cita"
          >
            <Controller
              name="estadoCitaId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={estadoOptions}
                  placeholder="Selecciona un estado"
                  state={fieldState('estadoCitaId', estadoIdWatch)}
                  tone="blue"
                  searchable={false}
                />
              )}
            />
          </FormField>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                      bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                      border-t border-slate-200 sm:border-0
                      flex flex-col sm:flex-row justify-end gap-2 z-10">
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium
                       hover:bg-red-100 hover:border-red-300 active:bg-red-200 transition
                       disabled:opacity-50
                       order-3 sm:order-1 sm:mr-auto"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
            Eliminar
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium
                     hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition
                     disabled:opacity-50
                     order-2 sm:order-2"
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
                     order-1 sm:order-3"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={2.5} />
              {isEditing ? 'Guardar cambios' : 'Crear cita'}
              <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* ═══════════════════════════════════════════════════
   FormField
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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-blue-500`;
};

export default CitaForm;