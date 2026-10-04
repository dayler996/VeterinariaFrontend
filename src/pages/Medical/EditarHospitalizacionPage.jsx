// frontend/src/pages/Hospitalizaciones/EditarHospitalizacionPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getHospitalizacion, updateHospitalizacion } from '../../services/hospitalizacionService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getConsultas, getConsulta } from '../../services/consultaService';
import SelectField from '../../components/common/SelectField';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  BedDouble, Stethoscope, FileText, ClipboardList,
  Activity, Link2, CalendarCheck, AlertTriangle,
  Check, X, Heart, Users as UsersIcon, LogOut,
  Sparkles, CheckCircle2, XCircle, Info, ArrowRight,
  PawPrint, Calendar, ListChecks,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  motivo: z
    .string()
    .min(1, 'El motivo es obligatorio')
    .min(5, 'Mínimo 5 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  detallesIngreso: z.any().optional(),
  consultaId: z.number().optional().nullable(),
  fechaAlta: z.string().optional(),
  notasAlta: z.any().optional(),
});

/* ═══════════════════════════════════════════════════ */
const EditarHospitalizacionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hospitalizacion, setHospitalizacion] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [detallesIngreso, setDetallesIngreso] = useState({});
  const [notasAlta, setNotasAlta] = useState({});
  const [loading, setLoading] = useState(true);
  const [consultasLoading, setConsultasLoading] = useState(false);

  const {
    register, handleSubmit, setValue, reset, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { detallesIngreso: {}, notasAlta: {}, consultaId: null },
  });

  const doctorIdWatch = watch('doctorId');
  const motivoWatch = watch('motivo');
  const consultaIdWatch = watch('consultaId');
  const fechaAltaWatch = watch('fechaAlta');

  /* Sincronizar JSON con el form */
  useEffect(() => {
    setValue('detallesIngreso', detallesIngreso, { shouldDirty: true });
  }, [detallesIngreso, setValue]);
  useEffect(() => {
    setValue('notasAlta', notasAlta, { shouldDirty: true });
  }, [notasAlta, setValue]);

  /* Carga de datos */
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const hospRes = await getHospitalizacion(id);
      const hosp = hospRes.data;
      setHospitalizacion(hosp);
      setDetallesIngreso(hosp.detallesIngreso || {});
      setNotasAlta(hosp.notasAlta || {});

      const doctoresRes = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(
        doctoresRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre))
      );

      await cargarConsultas(hosp.mascotaId, hosp.consultaId);

      reset({
        doctorId: hosp.doctorId,
        motivo: hosp.motivo,
        consultaId: hosp.consultaId ?? null,
        fechaAlta: hosp.fechaAlta
          ? new Date(hosp.fechaAlta).toISOString().split('T')[0]
          : '',
      });
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarConsultas = async (mascotaId, consultaActualId) => {
    setConsultasLoading(true);
    try {
      const res = await getConsultas({ mascotaId, sinHospitalizacion: true });
      let disponibles = res.data;
      if (consultaActualId) {
        const existe = disponibles.some((c) => c.id === consultaActualId);
        if (!existe) {
          const consultaActualRes = await getConsulta(consultaActualId);
          disponibles = [consultaActualRes.data, ...disponibles];
        }
      }
      setConsultas(disponibles);
    } catch (error) {
      console.error('Error cargando consultas:', error);
    } finally {
      setConsultasLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateHospitalizacion(id, {
        ...data,
        detallesIngreso,
        notasAlta,
        fechaAlta: data.fechaAlta || null,
      });
      toast.success('Hospitalización actualizada');
      navigate(`/hospitalizaciones/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
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
        icon: Stethoscope,
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
          icon: Calendar,
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

  /* Contadores */
  const detallesCount = Object.keys(detallesIngreso || {}).length;
  const notasAltaCount = Object.keys(notasAlta || {}).length;

  /* Progreso (doctor + motivo) */
  const progreso = useMemo(() => {
    let filled = 0;
    if (doctorIdWatch) filled++;
    if (motivoWatch?.trim() && motivoWatch.length >= 5) filled++;
    return Math.round((filled / 2) * 100);
  }, [doctorIdWatch, motivoWatch]);

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

  if (!hospitalizacion) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle
            className="w-10 h-10 text-slate-400 mx-auto mb-3"
            strokeWidth={1.8}
          />
          <p className="text-slate-500 text-sm">Hospitalización no encontrada</p>
          <button
            onClick={() => navigate('/hospitalizaciones')}
            className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← Volver a hospitalizaciones
          </button>
        </div>
      </div>
    );
  }

  const yaTieneAlta = !!hospitalizacion.fechaAlta;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="🏥"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          {
            label: hospitalizacion.mascota?.dueno?.nombre,
            to: `/clientes/${hospitalizacion.mascota?.dueno?.id}`,
          },
          {
            label: hospitalizacion.mascota?.nombre,
            to: `/mascotas/${hospitalizacion.mascotaId}`,
          },
          { label: 'Hospitalización', to: `/hospitalizaciones/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Hospitalización"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <PawPrint className="w-3.5 h-3.5" strokeWidth={2.2} />
            {hospitalizacion.mascota?.nombre}
            <span className="text-slate-300">·</span>
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {new Date(hospitalizacion.fechaIngreso).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
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
                Editando hospitalización
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {hospitalizacion.mascota?.nombre} —{' '}
                {hospitalizacion.mascota?.dueno?.nombre || 'sin dueño'}
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
                {notasAltaCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide"
                  >
                    <LogOut className="w-3 h-3" strokeWidth={2.5} />
                    {notasAltaCount} nota{notasAltaCount === 1 ? '' : 's'} alta
                  </span>
                )}
                {yaTieneAlta && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide"
                  >
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                    Ya dada de alta
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ═══ Card: Datos principales ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <ClipboardList
              className="w-4 h-4 text-indigo-600 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Datos principales
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
                  : 'Selecciona el doctor que atiende al paciente'
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
            Pares clave-valor: peso, temperatura, condición inicial...
          </p>
          <div className="rounded-lg border border-slate-200 bg-indigo-50/30 p-3">
            <JsonBuilder value={detallesIngreso} onChange={setDetallesIngreso} />
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
            Vincula la hospitalización con una consulta previa
          </p>

          <Controller
            name="consultaId"
            control={control}
            render={({ field }) => (
              <SelectField
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v === '' ? null : v)}
                options={consultaOptions}
                placeholder={
                  consultasLoading ? 'Cargando consultas...' : 'Buscar consulta...'
                }
                disabled={consultasLoading || yaTieneAlta}
                emptyMessage="No hay consultas disponibles"
                tone="indigo"
              />
            )}
          />

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

          {yaTieneAlta && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-100">
              <AlertTriangle
                className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"
                strokeWidth={2.5}
              />
              <p className="text-[11px] text-amber-700">
                No se puede cambiar la consulta porque el paciente ya fue dado de
                alta.
              </p>
            </div>
          )}
        </section>

        {/* ═══ Card: Alta ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <CalendarCheck
              className="w-4 h-4 text-indigo-600 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">Alta</h3>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">
              Opcional
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Registra la fecha de alta para finalizar la hospitalización
          </p>

          <div className="space-y-4">
            <FormField
              icon={Calendar}
              label="Fecha de alta"
              optional
              state={fieldState('fechaAlta', fechaAltaWatch)}
              error={errors.fechaAlta?.message}
              hint={
                fechaAltaWatch
                  ? 'La hospitalización quedará marcada como finalizada'
                  : 'Deja vacío si el paciente sigue internado'
              }
            >
              <input
                type="date"
                {...register('fechaAlta')}
                className={inputCls(fieldState('fechaAlta', fechaAltaWatch))}
              />
            </FormField>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Notas de alta
                </p>
                {notasAltaCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold tabular-nums">
                    {notasAltaCount}
                  </span>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-emerald-50/30 p-3">
                <JsonBuilder value={notasAlta} onChange={setNotasAlta} />
              </div>
            </div>
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
            onClick={() => navigate(`/hospitalizaciones/${id}`)}
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

export default EditarHospitalizacionPage;