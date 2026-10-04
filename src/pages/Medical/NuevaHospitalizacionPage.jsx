// frontend/src/pages/Hospitalizaciones/NuevaHospitalizacionPage.jsx
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createHospitalizacion } from '../../services/hospitalizacionService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import { getConsultas } from '../../services/consultaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import SelectField from '../../components/common/SelectField';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  BedDouble, Stethoscope, User, Check, X,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Info,
  ArrowRight, PawPrint, Heart, Users as UsersIcon,
  ClipboardList, Activity, Link2, FileText, Calendar,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  motivo: z
    .string()
    .min(1, 'El motivo es obligatorio')
    .min(5, 'Mínimo 5 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  consultaId: z.number().optional().nullable(),
  detallesIngreso: z.any().optional(),
});

/* ═══════════════════════════════════════════════════ */
const NuevaHospitalizacionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [doctores, setDoctores] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [detallesIngreso, setDetallesIngreso] = useState({});
  const [loading, setLoading] = useState(false);

  const {
    register, handleSubmit, setValue, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { detallesIngreso: {}, consultaId: null },
  });

  const mascotaIdWatch = watch('mascotaId');
  const doctorIdWatch = watch('doctorId');
  const motivoWatch = watch('motivo');
  const consultaIdWatch = watch('consultaId');

  /* Sincronizar JSON con el form */
  useEffect(() => {
    setValue('detallesIngreso', detallesIngreso, { shouldDirty: true });
  }, [detallesIngreso, setValue]);

  /* Cargas iniciales */
  useEffect(() => {
    loadDoctores();
    if (mascotaIdParam) cargarMascotaDesdeParam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaIdParam]);

  /* Recargar consultas cada vez que cambia la mascota */
  useEffect(() => {
    if (mascotaIdWatch) cargarConsultas(mascotaIdWatch);
    else setConsultas([]);
  }, [mascotaIdWatch]);

  const loadDoctores = async () => {
    try {
      const res = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(res.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre)));
    } catch {
      toast.error('Error al cargar doctores');
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

  const cargarConsultas = async (idMascota) => {
    try {
      const res = await getConsultas({ mascotaId: idMascota, sinHospitalizacion: true });
      setConsultas(res.data);
    } catch {
      toast.error('Error al cargar consultas');
    }
  };

  const handleMascotaSelected = (mascota) => {
    setMascotaSeleccionada(mascota);
    setValue('mascotaId', mascota.id, { shouldValidate: true });
    setValue('consultaId', null, { shouldDirty: true });
  };

  const onSubmit = async (data) => {
    try {
      await createHospitalizacion(data);
      toast.success('Hospitalización creada');
      navigate(
        mascotaIdParam
          ? `/mascotas/${mascotaIdParam}`
          : `/mascotas/${data.mascotaId}`
      );
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear hospitalización');
    }
  };

  /* Seleccionados */
  const doctorSeleccionado = useMemo(
    () => doctores.find((d) => d.id === Number(doctorIdWatch)),
    [doctores, doctorIdWatch]
  );

  const consultaSeleccionada = useMemo(
    () => consultas.find((c) => c.id === Number(consultaIdWatch)),
    [consultas, consultaIdWatch]
  );

  /* Opciones SelectField */
  const doctorOptions = useMemo(
    () =>
      doctores.map((d) => ({
        value: d.id,
        label: d.nombre,
        description: d.cargo?.nombre || '—',
        icon: User,
      })),
    [doctores]
  );

  const consultaOptions = useMemo(
    () => [
      { value: '', label: 'Ninguna', icon: X },
      ...consultas.map((c) => {
        const motivo = c.motivo || '';
        return {
          value: c.id,
          label: `${new Date(c.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })} · ${motivo.slice(0, 40)}${motivo.length > 40 ? '…' : ''}`,
          icon: Stethoscope,
        };
      }),
    ],
    [consultas]
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

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (mascotaIdWatch) filled++;
    if (doctorIdWatch) filled++;
    if (motivoWatch?.trim() && motivoWatch.length >= 5) filled++;
    return Math.round((filled / 3) * 100);
  }, [mascotaIdWatch, doctorIdWatch, motivoWatch]);

  /* Contadores */
  const detallesCount = Object.keys(detallesIngreso || {}).length;

  if (loading) {
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
        icon="🏥"
        breadcrumbs={
          mascotaSeleccionada
            ? [
                { label: 'Clientes', to: '/clientes' },
                {
                  label: mascotaSeleccionada.dueno?.nombre,
                  to: `/clientes/${mascotaSeleccionada.dueno?.id}`,
                },
                {
                  label: mascotaSeleccionada.nombre,
                  to: `/mascotas/${mascotaSeleccionada.id}`,
                },
                { label: 'Nueva Hospitalización' },
              ]
            : [
                { label: 'Hospitalizaciones', to: '/hospitalizaciones' },
                { label: 'Nueva Hospitalización' },
              ]
        }
        title="Nueva Hospitalización"
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
                <BedDouble
                  className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-500"
                  strokeWidth={2}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">
                Nueva hospitalización
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {mascotaSeleccionada
                  ? `${mascotaSeleccionada.nombre} — ${
                      mascotaSeleccionada.dueno?.nombre || 'sin dueño'
                    }`
                  : 'Sin mascota seleccionada'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {doctorSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Stethoscope className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    Dr. {doctorSeleccionado.nombre}
                  </span>
                )}
                {consultaSeleccionada && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Link2 className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    Consulta vinculada
                  </span>
                )}
                {detallesCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide"
                  >
                    <Activity className="w-3 h-3" strokeWidth={2.5} />
                    {detallesCount} detalle{detallesCount === 1 ? '' : 's'}
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
        <input type="hidden" {...register('mascotaId')} />

        {/* ClienteSearch (solo si no viene mascotaId por URL) */}
        {!mascotaIdParam && (
          <ClienteSearch onMascotaSelected={handleMascotaSelected} />
        )}

        {/* Mascota seleccionada (cuando viene por URL) */}
        {mascotaSeleccionada && mascotaIdParam && (
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <p className="text-sm">
              <span className="font-semibold text-slate-800">
                {mascotaSeleccionada.nombre}
              </span>
              <span className="text-slate-500">
                {' '}
                · Dueño: {mascotaSeleccionada.dueno?.nombre}
              </span>
            </p>
          </div>
        )}

        {/* ═══ Card: Datos de la hospitalización ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <ClipboardList
              className="w-4 h-4 text-indigo-600 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Datos de la hospitalización
            </h3>
          </div>

          <div className="space-y-4">
            {/* Doctor */}
            <FormField
              icon={Stethoscope}
              label="Doctor responsable"
              required
              state={fieldState('doctorId', doctorIdWatch)}
              error={errors.doctorId?.message}
              hint={
                doctorSeleccionado
                  ? `Cargo: ${doctorSeleccionado.cargo?.nombre || '—'}`
                  : 'Selecciona el doctor que atenderá al paciente'
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
                    tone="indigo"
                  />
                )}
              />
            </FormField>

            {/* Motivo */}
            <FormField
              icon={FileText}
              label="Motivo"
              required
              state={fieldState('motivo', motivoWatch)}
              error={errors.motivo?.message}
              hint={`${motivoWatch?.length || 0}/500 caracteres`}
            >
              <textarea
                rows="4"
                placeholder="Describe el motivo de la hospitalización..."
                {...register('motivo')}
                className={`${inputCls(fieldState('motivo', motivoWatch))} resize-none`}
              />
            </FormField>
          </div>
        </section>

        {/* ═══ Card: Consulta asociada ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Link2 className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">
              Consulta asociada
            </h3>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">
              Opcional
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Vincula la hospitalización con una consulta previa sin hospitalización
          </p>

          {!mascotaSeleccionada ? (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <AlertTriangle
                className="w-4 h-4 text-slate-500 shrink-0 mt-0.5"
                strokeWidth={2.2}
              />
              <p className="text-xs text-slate-600">
                Primero selecciona una mascota para ver sus consultas disponibles.
              </p>
            </div>
          ) : consultas.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle
                className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                strokeWidth={2.2}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">
                  No hay consultas disponibles
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Esta mascota no tiene consultas sin hospitalización asociada.
                </p>
              </div>
            </div>
          ) : (
            <Controller
              name="consultaId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  options={consultaOptions}
                  placeholder="Buscar consulta..."
                  tone="indigo"
                />
              )}
            />
          )}

          {/* Preview de la consulta seleccionada */}
          {consultaSeleccionada && (
            <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Calendar
                  className="w-4 h-4 text-indigo-600"
                  strokeWidth={2.2}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Consulta vinculada
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                  {consultaSeleccionada.motivo || 'Sin motivo'}
                </p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  {new Date(consultaSeleccionada.fecha).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ═══ Card: Detalles de ingreso ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Activity
              className="w-4 h-4 text-indigo-600 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Detalles de ingreso
            </h3>
            {detallesCount > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-indigo-100 text-indigo-700 text-[11px] font-semibold tabular-nums"
              >
                {detallesCount} {detallesCount === 1 ? 'valor' : 'valores'}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 font-normal">
              Opcional
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Pares clave-valor: peso, temperatura, condición inicial, etc.
          </p>
          <div className="rounded-lg border border-slate-200 bg-indigo-50/30 p-3">
            <JsonBuilder value={detallesIngreso} onChange={setDetallesIngreso} />
          </div>
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
            onClick={() =>
              mascotaIdParam
                ? navigate(`/mascotas/${mascotaIdParam}`)
                : navigate('/hospitalizaciones')
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
                Crear hospitalización
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

export default NuevaHospitalizacionPage;