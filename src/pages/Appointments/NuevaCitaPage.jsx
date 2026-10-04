import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCita } from '../../services/citaService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import { getEstadosCita } from '../../services/estadoCitaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Calendar, CalendarPlus, Stethoscope, Scissors,
  Activity, AlertTriangle, Check, X, Heart,
  Users as UsersIcon, Clock, FileText, ClipboardList,
} from 'lucide-react';

const tiposServicio = [
  { value: 'consulta', label: 'Consulta médica', Icon: Stethoscope },
  { value: 'operacion', label: 'Operación / Cirugía', Icon: Activity },
  { value: 'estetica', label: 'Servicio de estética', Icon: Scissors },
];

const cargosPorTipo = {
  consulta: ['Médico Veterinario', 'Cirujano Especialista'],
  operacion: ['Médico Veterinario', 'Cirujano Especialista'],
  estetica: ['Peluquero Canino'],
};

const schema = z.object({
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  tipoServicio: z.string({ required_error: 'Tipo de servicio requerido' }),
  doctorId: z.number({ required_error: 'Profesional requerido' }),
  fechaHora: z.string().min(1, 'Fecha y hora requerida'),
  motivo: z.string().optional(),
  estadoCitaId: z.number().default(1),
});

const NuevaCitaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');
  const fechaHoraParam = searchParams.get('fechaHora');

  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todosTrabajadores, setTodosTrabajadores] = useState([]);

  const fechaHoraInicial = fechaHoraParam
    ? new Date(fechaHoraParam).toISOString().slice(0, 16)
    : '';

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fechaHora: fechaHoraInicial, estadoCitaId: 1, tipoServicio: '' },
  });

  const tipoServicioSeleccionado = watch('tipoServicio');
  const fechaHoraWatch = watch('fechaHora');
  const motivoWatch = watch('motivo');

  useEffect(() => {
    if (tipoServicioSeleccionado && todosTrabajadores.length > 0) {
      const cargosPermitidos = cargosPorTipo[tipoServicioSeleccionado] || [];
      setDoctores(todosTrabajadores.filter((t) => cargosPermitidos.includes(t.cargo?.nombre)));
    } else {
      setDoctores([]);
    }
    setValue('doctorId', undefined);
  }, [tipoServicioSeleccionado, todosTrabajadores, setValue]);

  useEffect(() => {
    loadDoctoresYEstados();
    if (mascotaIdParam) cargarMascotaDesdeParam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaIdParam]);

  const loadDoctoresYEstados = async () => {
    try {
      const [trabajadoresRes, estadosRes] = await Promise.all([
        getTrabajadores(),
        getEstadosCita(),
      ]);
      setTodosTrabajadores(trabajadoresRes.data);
      setEstados(estadosRes.data);
    } catch {
      toast.error('Error al cargar datos');
    }
  };

  const cargarMascotaDesdeParam = async () => {
    try {
      setLoading(true);
      const res = await getMascota(mascotaIdParam);
      setMascotaSeleccionada(res.data);
      setValue('mascotaId', res.data.id);
    } catch {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoading(false);
    }
  };

  const handleMascotaSelected = (mascota) => {
    setMascotaSeleccionada(mascota);
    setValue('mascotaId', mascota.id);
  };

  const onSubmit = async (data) => {
    try {
      await createCita(data);
      toast.success('Cita creada');
      navigate('/citas');
    } catch {
      toast.error('Error al crear cita');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="📅"
        breadcrumbs={
          mascotaSeleccionada
            ? [
                { label: 'Clientes', to: '/clientes' },
                { label: mascotaSeleccionada.dueno?.nombre, to: `/clientes/${mascotaSeleccionada.dueno?.id}` },
                { label: mascotaSeleccionada.nombre, to: `/mascotas/${mascotaSeleccionada.id}` },
                { label: 'Nueva Cita' },
              ]
            : [
                { label: 'Citas', to: '/citas' },
                { label: 'Nueva Cita' },
              ]
        }
        title="Nueva Cita"
        subtitle={
          mascotaSeleccionada ? (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
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

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
          <CalendarPlus className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Nueva cita
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {mascotaSeleccionada
              ? `Agendar cita para ${mascotaSeleccionada.nombre}`
              : 'Agenda una nueva cita'}
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Completa los datos para reservar el turno
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5 space-y-4">
        {!mascotaIdParam && <ClienteSearch onMascotaSelected={handleMascotaSelected} />}

        {mascotaSeleccionada && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
            <Heart className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <p className="text-sm">
              <span className="font-semibold text-slate-800">{mascotaSeleccionada.nombre}</span>
              <span className="text-slate-500"> · Dueño: {mascotaSeleccionada.dueno?.nombre}</span>
            </p>
          </div>
        )}

        {(mascotaSeleccionada || fechaHoraParam) && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('mascotaId')} />

            {/* ═══ Tipo de servicio ═══ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
                Tipo de servicio <span className="text-red-500">*</span>
              </label>
              <select
                {...register('tipoServicio')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.tipoServicio ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">Seleccione un tipo</option>
                {tiposServicio.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.tipoServicio && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.tipoServicio.message}
                </p>
              )}
            </div>

            {/* ═══ Profesional ═══ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
                Profesional <span className="text-red-500">*</span>
              </label>
              <select
                {...register('doctorId', { valueAsNumber: true })}
                disabled={!tipoServicioSeleccionado || doctores.length === 0}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50
                  ${errors.doctorId ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">
                  {!tipoServicioSeleccionado
                    ? 'Primero selecciona un tipo de servicio'
                    : 'Seleccione un profesional'}
                </option>
                {doctores.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.cargo?.nombre})
                  </option>
                ))}
              </select>
              {errors.doctorId && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.doctorId.message}
                </p>
              )}
              {tipoServicioSeleccionado && doctores.length === 0 && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  No hay profesionales disponibles para este tipo.
                </p>
              )}
            </div>

            {/* ═══ Fecha y hora ═══ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
                Fecha y hora <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('fechaHora')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.fechaHora ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.fechaHora && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.fechaHora.message}
                </p>
              )}
              {fechaHoraWatch && !errors.fechaHora && (
                <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-blue-50 border border-blue-100">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-[11px] text-blue-700">
                    Cita programada para{' '}
                    <span className="font-semibold">
                      {new Date(fechaHoraWatch).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>{' '}
                    a las{' '}
                    <span className="font-semibold tabular-nums">
                      {new Date(fechaHoraWatch).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* ═══ Motivo ═══ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
                Motivo
                <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
              </label>
              <textarea
                {...register('motivo')}
                rows="3"
                placeholder="Describe el motivo de la cita..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* ═══ Estado ═══ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
                Estado
              </label>
              <select
                {...register('estadoCitaId', { valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {estados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            {/* ═══ Botones (sticky móvil) ═══ */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                            flex gap-2 z-30
                            sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2 sm:pt-3 sm:border-t sm:border-slate-100">
              <button
                type="button"
                onClick={() =>
                  mascotaIdParam
                    ? navigate(`/mascotas/${mascotaIdParam}`)
                    : navigate('/citas')
                }
                disabled={isSubmitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                           px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                           hover:bg-slate-200 active:bg-slate-300 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                           px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                           hover:bg-blue-700 active:bg-blue-800 transition
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-sm shadow-blue-600/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    Guardar cita
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {!mascotaSeleccionada && !mascotaIdParam && (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <Calendar className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Busque un cliente y seleccione una mascota para continuar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NuevaCitaPage;