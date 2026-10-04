// frontend/src/pages/Vacunaciones/EditarVacunacionPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getVacunacion, updateVacunacion } from '../../services/vacunacionService';
import { getVacunas } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import SelectField from '../../components/common/SelectField';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Syringe, ShieldCheck, User, Calendar, FileText, Check, X,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Info,
  ArrowRight, PawPrint, Heart, Users as UsersIcon,
  ClipboardList, CalendarClock, Clock, Beaker, Dog,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
const formatFecha = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const diasHasta = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const target = new Date(fecha);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - hoy) / (1000 * 60 * 60 * 24));
};

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  vacunaId: z.number({ required_error: 'Selecciona una vacuna' }),
  doctorId: z.number({ required_error: 'Selecciona un doctor' }),
  proximoRefuerzo: z.string().optional(),
  detalles: z.any().optional(),
  observacion: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
});

/* ═══════════════════════════════════════════════════ */
const EditarVacunacionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vacunacion, setVacunacion] = useState(null);
  const [mascota, setMascota] = useState(null);
  const [vacunas, setVacunas] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loading, setLoading] = useState(true);

  const {
    register, handleSubmit, setValue, reset, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { detalles: {}, observacion: '' },
  });

  const vacunaIdWatch = watch('vacunaId');
  const doctorIdWatch = watch('doctorId');
  const refuerzoWatch = watch('proximoRefuerzo');
  const observacionWatch = watch('observacion');

  /* Sincronizar JSON con el form */
  useEffect(() => { setValue('detalles', detalles, { shouldDirty: true }); }, [detalles, setValue]);

  /* Carga de datos */
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const vacRes = await getVacunacion(id);
      const vac = vacRes.data;
      setVacunacion(vac);
      setDetalles(vac.detalles || {});

      const mascRes = await getMascota(vac.mascotaId);
      const masc = mascRes.data;
      setMascota(masc);

      const [vacunasRes, doctoresRes] = await Promise.all([
        getVacunas({ especieId: masc.especieId }),
        getTrabajadores(),
      ]);
      setVacunas(vacunasRes.data);
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(
        doctoresRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre))
      );

      reset({
        vacunaId: vac.vacunaId,
        doctorId: vac.doctorId,
        proximoRefuerzo: vac.proximoRefuerzo ? vac.proximoRefuerzo.split('T')[0] : '',
        observacion: vac.observacion || '',
      });
    } catch {
      toast.error('Error al cargar la vacunación');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateVacunacion(id, { ...data, detalles });
      toast.success('Vacunación actualizada');
      navigate(`/vacunaciones/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
    }
  };

  /* Seleccionados */
  const vacunaSeleccionada = useMemo(
    () => vacunas.find((v) => v.id === Number(vacunaIdWatch)),
    [vacunas, vacunaIdWatch]
  );
  const doctorSeleccionado = useMemo(
    () => doctores.find((d) => d.id === Number(doctorIdWatch)),
    [doctores, doctorIdWatch]
  );

  /* Opciones SelectField */
  const vacunaOptions = useMemo(
    () => vacunas.map((v) => ({
      value: v.id,
      label: v.nombre,
      icon: Syringe,
    })),
    [vacunas]
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

  /* Contadores */
  const detallesCount = Object.keys(detalles || {}).length;

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (vacunaIdWatch) filled++;
    if (doctorIdWatch) filled++;
    return Math.round((filled / 2) * 100);
  }, [vacunaIdWatch, doctorIdWatch]);

  /* Refuerzo */
  const refuerzoDias = diasHasta(refuerzoWatch);
  const refuerzoStatus = useMemo(() => {
    if (refuerzoDias === null) return null;
    if (refuerzoDias < 0) return { tone: 'red', label: 'Fecha pasada' };
    if (refuerzoDias === 0) return { tone: 'amber', label: 'Hoy' };
    if (refuerzoDias <= 7) return { tone: 'amber', label: `En ${refuerzoDias} días` };
    return { tone: 'emerald', label: `En ${refuerzoDias} días` };
  }, [refuerzoDias]);

  const refuerzoToneCls = refuerzoStatus ? {
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-600',     text: 'text-red-700' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600',   text: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', text: 'text-emerald-700' },
  }[refuerzoStatus.tone] : null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-emerald-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!vacunacion || !mascota) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Vacunación no encontrada</p>
          <button
            onClick={() => navigate('/vacunaciones')}
            className="mt-3 text-emerald-600 hover:text-emerald-800 text-sm font-medium"
          >
            ← Volver a vacunaciones
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="💉"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: mascota.dueno?.nombre, to: `/clientes/${mascota.dueno?.id}` },
          { label: mascota.nombre, to: `/mascotas/${mascota.id}` },
          { label: 'Vacunación', to: `/vacunaciones/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Vacunación"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <PawPrint className="w-3.5 h-3.5" strokeWidth={2.2} />
            {mascota.nombre}
            {vacunacion.vacuna?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  <Syringe className="w-3 h-3" strokeWidth={2.5} />
                  {vacunacion.vacuna.nombre}
                </span>
              </>
            )}
          </span>
        }
      />

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-white overflow-hidden mb-4">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                              bg-gradient-to-br from-emerald-100 to-emerald-50
                              border-2 border-white shadow-md
                              flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-500" strokeWidth={2} />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                Editando vacunación
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {mascota.nombre} — {mascota.dueno?.nombre || 'sin dueño'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {mascota.especie?.nombre && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Dog className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {mascota.especie.nombre}
                  </span>
                )}
                {vacunaSeleccionada && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Syringe className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {vacunaSeleccionada.nombre}
                  </span>
                )}
                {doctorSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    Dr. {doctorSeleccionado.nombre}
                  </span>
                )}
                {refuerzoStatus && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    text-[10px] font-bold uppercase tracking-wide
                    ${refuerzoStatus.tone === 'red'
                      ? 'bg-red-100 text-red-700'
                      : refuerzoStatus.tone === 'amber'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'}`}>
                    <CalendarClock className="w-3 h-3" strokeWidth={2.5} />
                    Refuerzo: {refuerzoStatus.label}
                  </span>
                )}
                {detallesCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide">
                    <Beaker className="w-3 h-3" strokeWidth={2.5} />
                    {detallesCount} detalle{detallesCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-emerald-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-emerald-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-emerald-300 to-emerald-500'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Datos de la vacunación ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Datos de la vacunación</h3>
          </div>

          <div className="space-y-4">
            {/* Vacuna */}
            <FormField
              icon={Syringe}
              label="Vacuna"
              required
              state={fieldState('vacunaId', vacunaIdWatch)}
              error={errors.vacunaId?.message}
              hint={
                vacunaSeleccionada
                  ? 'Vacuna seleccionada'
                  : vacunas.length === 0
                  ? 'No hay vacunas para esta especie'
                  : 'Elige la vacuna aplicada'
              }
            >
              <Controller
                name="vacunaId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    options={vacunaOptions}
                    placeholder="Buscar vacuna..."
                    disabled={vacunas.length === 0}
                    state={fieldState('vacunaId', vacunaIdWatch)}
                    tone="emerald"
                  />
                )}
              />
            </FormField>

            {/* Aviso sin vacunas */}
            {vacunas.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-900">
                    No hay vacunas para esta especie
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Registra vacunas para la especie {mascota.especie?.nombre || 'actual'} en el catálogo.
                  </p>
                </div>
              </div>
            )}

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
                  : 'Selecciona el doctor que aplicó la vacuna'
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
                    tone="emerald"
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        {/* ═══ Card: Próximo refuerzo ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <CalendarClock className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Próximo refuerzo</h3>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Fecha en la que el paciente debe volver para su refuerzo
          </p>

          <FormField
            icon={Calendar}
            label="Fecha de refuerzo"
            optional
            state={fieldState('proximoRefuerzo', refuerzoWatch)}
            error={errors.proximoRefuerzo?.message}
            hint={
              refuerzoWatch
                ? formatFecha(refuerzoWatch)
                : 'Deja vacío si no aplica'
            }
          >
            <input
              type="date"
              {...register('proximoRefuerzo')}
              className={inputCls(fieldState('proximoRefuerzo', refuerzoWatch))}
            />
          </FormField>

          {/* Preview del refuerzo */}
          {refuerzoWatch && refuerzoStatus && (
            <div className={`mt-3 p-3 rounded-lg border flex items-center gap-3
              ${refuerzoToneCls.bg} ${refuerzoToneCls.border}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${refuerzoToneCls.bg}`}>
                <CalendarClock className={`w-4 h-4 ${refuerzoToneCls.icon}`} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${refuerzoToneCls.text}`}>
                  Refuerzo programado
                </p>
                <p className="text-sm font-semibold text-slate-800 capitalize mt-0.5">
                  {formatFecha(refuerzoWatch)}
                </p>
                <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${refuerzoToneCls.text}`}>
                  <Clock className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  {refuerzoStatus.label}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ═══ Card: Detalles adicionales ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
            <Beaker className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Detalles adicionales</h3>
            {detallesCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-violet-100 text-violet-700 text-[11px] font-semibold tabular-nums">
                {detallesCount} {detallesCount === 1 ? 'valor' : 'valores'}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Pares clave-valor: lote, dosis, vía de administración, reacciones...
          </p>
          <div className="rounded-lg border border-slate-200 bg-violet-50/30 p-3">
            <JsonBuilder value={detalles} onChange={setDetalles} />
          </div>
        </section>

        {/* ═══ Card: Observación ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-slate-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-slate-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Observación</h3>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <FormField
            icon={FileText}
            label="Notas adicionales"
            optional
            state={fieldState('observacion', observacionWatch)}
            error={errors.observacion?.message}
            hint={`${observacionWatch?.length || 0}/500 caracteres`}
          >
            <textarea
              rows="3"
              placeholder="Reacciones observadas, indicaciones para el dueño..."
              {...register('observacion')}
              className={`${inputCls(fieldState('observacion', observacionWatch))} resize-none`}
            />
          </FormField>
        </section>

        {/* ═══ Footer sticky ═══ */}
        <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                        bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                        border-t border-slate-200 sm:border-0
                        flex flex-col sm:flex-row justify-end gap-2 z-10">
          <button
            type="button"
            onClick={() => navigate(`/vacunaciones/${id}`)}
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
                Guardar cambios
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
    idle:  { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: Info };

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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-emerald-500`;
};

export default EditarVacunacionPage;