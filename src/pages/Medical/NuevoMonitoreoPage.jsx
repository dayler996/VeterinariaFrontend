// frontend/src/pages/Monitoreos/NuevoMonitoreoPage.jsx
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createMonitoreo } from '../../services/monitoreoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getHospitalizacion } from '../../services/hospitalizacionService';
import { useAuth } from '../../context/AuthContext';
import SelectField from '../../components/common/SelectField';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Activity, Stethoscope, FileText, ListChecks,
  Check, X, AlertTriangle, Heart,
  Sparkles, CheckCircle2, XCircle, Info, ArrowRight,
  PawPrint, Calendar, BedDouble, Users as UsersIcon,
  ClipboardList, TrendingUp,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  hospitalizacionId: z.number({ required_error: 'Hospitalización requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  detalles: z.any().optional(),
  observaciones: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
});

/* ═══════════════════════════════════════════════════ */
const NuevoMonitoreoPage = () => {
  const { id } = useParams(); // id de la hospitalización
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hospitalizacion, setHospitalizacion] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loadingDoctores, setLoadingDoctores] = useState(true);
  const [loadingHosp, setLoadingHosp] = useState(true);

  const {
    register, handleSubmit, setValue, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      hospitalizacionId: parseInt(id),
      doctorId: user?.trabajador?.id || '',
      detalles: {},
      observaciones: '',
    },
  });

  const doctorIdWatch = watch('doctorId');
  const observacionesWatch = watch('observaciones');

  /* Sincronizar JSON con el form */
  useEffect(() => {
    setValue('detalles', detalles, { shouldDirty: true });
  }, [detalles, setValue]);

  /* Cargas iniciales */
  useEffect(() => {
    loadDoctores();
    loadHospitalizacion();
    setValue('hospitalizacionId', parseInt(id), { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDoctores = async () => {
    try {
      setLoadingDoctores(true);
      const res = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(
        res.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre))
      );
    } catch {
      toast.error('Error al cargar doctores');
    } finally {
      setLoadingDoctores(false);
    }
  };

  const loadHospitalizacion = async () => {
    try {
      setLoadingHosp(true);
      const res = await getHospitalizacion(id);
      setHospitalizacion(res.data);
    } catch {
      // Silencioso: solo es para el preview
    } finally {
      setLoadingHosp(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await createMonitoreo({ ...data, detalles });
      toast.success('Monitoreo registrado');
      navigate(`/hospitalizaciones/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar monitoreo');
    }
  };

  /* Seleccionados */
  const doctorSeleccionado = useMemo(
    () => doctores.find((d) => d.id === Number(doctorIdWatch)),
    [doctores, doctorIdWatch]
  );

  /* Opciones SelectField */
  const doctorOptions = useMemo(
    () =>
      doctores.map((d) => ({
        value: d.id,
        label: d.nombre,
        description: d.cargo?.nombre || '—',
        icon: Stethoscope,
      })),
    [doctores]
  );

  /* Estado por campo */
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

  /* Contadores */
  const detallesCount = Object.keys(detalles || {}).length;

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (doctorIdWatch) filled++;
    if (detallesCount > 0) filled++;
    return Math.round((filled / 2) * 100);
  }, [doctorIdWatch, detallesCount]);

  if (loadingDoctores || loadingHosp) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-indigo-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="📈"
        breadcrumbs={
          hospitalizacion
            ? [
                { label: 'Hospitalizaciones', to: '/hospitalizaciones' },
                {
                  label: hospitalizacion.mascota?.nombre || 'Hospitalización',
                  to: `/hospitalizaciones/${id}`,
                },
                { label: 'Nuevo Monitoreo' },
              ]
            : [
                { label: 'Hospitalizaciones', to: '/hospitalizaciones' },
                { label: 'Nuevo Monitoreo' },
              ]
        }
        title="Nuevo Monitoreo"
        subtitle={
          hospitalizacion ? (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <PawPrint className="w-3.5 h-3.5" strokeWidth={2.2} />
              {hospitalizacion.mascota?.nombre}
              <span className="text-slate-300">·</span>
              <BedDouble className="w-3.5 h-3.5" strokeWidth={2.2} />
              Ingreso:{' '}
              {new Date(hospitalizacion.fechaIngreso).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          ) : (
            'Registra los signos y observaciones del paciente'
          )
        }
      />

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-indigo-50/60 via-white to-white overflow-hidden mb-4">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                              bg-gradient-to-br from-indigo-100 to-indigo-50
                              border-2 border-white shadow-md
                              flex items-center justify-center"
              >
                <Activity
                  className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-500"
                  strokeWidth={2}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">
                Nuevo registro de monitoreo
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {hospitalizacion
                  ? `${hospitalizacion.mascota?.nombre} — ${
                      hospitalizacion.mascota?.dueno?.nombre || 'sin dueño'
                    }`
                  : 'Registro de signos vitales'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {doctorSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Stethoscope className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    Dr. {doctorSeleccionado.nombre}
                  </span>
                )}
                {hospitalizacion?.mascota?.dueno?.nombre && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <UsersIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {hospitalizacion.mascota.dueno.nombre}
                  </span>
                )}
                {detallesCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide"
                  >
                    <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                    {detallesCount} signo{detallesCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-indigo-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  progreso === 100 ? 'text-emerald-600' : 'text-indigo-700'
                }`}
              >
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Formulario ═══ */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('hospitalizacionId')} />

        {/* ═══ Card: Doctor ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <ClipboardList
              className="w-4 h-4 text-indigo-600 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Doctor responsable
            </h3>
          </div>

          <FormField
            icon={Stethoscope}
            label="Doctor que atiende al paciente"
            required
            state={fieldState('doctorId', doctorIdWatch)}
            error={errors.doctorId?.message}
            hint={
              doctorSeleccionado
                ? `Cargo: ${doctorSeleccionado.cargo?.nombre || '—'}`
                : 'Selecciona el doctor que realizó el monitoreo'
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
                  placeholder={
                    loadingDoctores ? 'Cargando doctores...' : 'Buscar doctor...'
                  }
                  disabled={loadingDoctores}
                  state={fieldState('doctorId', doctorIdWatch)}
                  tone="indigo"
                />
              )}
            />
          </FormField>
        </section>

        {/* ═══ Card: Signos y detalles ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <ListChecks
              className="w-4 h-4 text-indigo-600 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Signos y detalles
            </h3>
            {detallesCount > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-indigo-100 text-indigo-700 text-[11px] font-semibold tabular-nums"
              >
                {detallesCount} {detallesCount === 1 ? 'registro' : 'registros'}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 font-normal">
              Opcional
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Pares clave-valor: temperatura, frecuencia cardíaca, saturación...
          </p>
          <div className="rounded-lg border border-slate-200 bg-indigo-50/30 p-3">
            <JsonBuilder value={detalles} onChange={setDetalles} />
          </div>
        </section>

        {/* ═══ Card: Observaciones ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <FileText
              className="w-4 h-4 text-indigo-600 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Observaciones
            </h3>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">
              Opcional
            </span>
          </div>

          <FormField
            icon={FileText}
            label="Notas adicionales"
            optional
            state={fieldState('observaciones', observacionesWatch)}
            error={errors.observaciones?.message}
            hint={`${observacionesWatch?.length || 0}/500 caracteres`}
          >
            <textarea
              rows="4"
              placeholder="Evolución del paciente, indicaciones, notas adicionales..."
              {...register('observaciones')}
              className={`${inputCls(
                fieldState('observaciones', observacionesWatch)
              )} resize-none`}
            />
          </FormField>
        </section>

        {/* ═══ Footer sticky ═══ */}
        <div
          className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                        bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                        border-t border-slate-200 sm:border-0
                        flex flex-col sm:flex-row justify-end gap-2 z-10"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
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
                       px-5 py-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg text-sm font-semibold
                       hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800
                       transition disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md shadow-indigo-600/25
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
                Guardar monitoreo
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
  const stateCls =
    {
      idle: { bg: 'bg-indigo-100', text: 'text-indigo-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
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
    'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400 pr-10';
  if (state === 'error') return `${base} border-red-400 focus:ring-red-500`;
  if (state === 'valid') return `${base} border-emerald-300 focus:ring-emerald-500`;
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-indigo-500`;
};

export default NuevoMonitoreoPage;