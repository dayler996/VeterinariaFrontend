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

const tiposServicio = [
  { value: 'consulta', label: 'Consulta médica' },
  { value: 'operacion', label: 'Operación / Cirugía' },
  { value: 'estetica', label: 'Servicio de estética' },
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

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fechaHora: fechaHoraInicial, estadoCitaId: 1, tipoServicio: '' },
  });

  const tipoServicioSeleccionado = watch('tipoServicio');

  useEffect(() => {
    if (tipoServicioSeleccionado && todosTrabajadores.length > 0) {
      const cargosPermitidos = cargosPorTipo[tipoServicioSeleccionado] || [];
      setDoctores(todosTrabajadores.filter(t => cargosPermitidos.includes(t.cargo?.nombre)));
    } else {
      setDoctores([]);
    }
    setValue('doctorId', undefined);
  }, [tipoServicioSeleccionado, todosTrabajadores, setValue]);

  useEffect(() => {
    loadDoctoresYEstados();
    if (mascotaIdParam) cargarMascotaDesdeParam();
  }, [mascotaIdParam]);

  const loadDoctoresYEstados = async () => {
    try {
      const [trabajadoresRes, estadosRes] = await Promise.all([getTrabajadores(), getEstadosCita()]);
      setTodosTrabajadores(trabajadoresRes.data);
      setEstados(estadosRes.data);
    } catch { toast.error('Error al cargar datos'); }
  };

  const cargarMascotaDesdeParam = async () => {
    try {
      setLoading(true);
      const res = await getMascota(mascotaIdParam);
      setMascotaSeleccionada(res.data);
      setValue('mascotaId', res.data.id);
    } catch { toast.error('Error al cargar la mascota'); }
    finally { setLoading(false); }
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
    } catch { toast.error('Error al crear cita'); }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
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
        subtitle={mascotaSeleccionada ? `Para ${mascotaSeleccionada.nombre} (${mascotaSeleccionada.dueno?.nombre})` : 'Selecciona un cliente y una mascota'}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
        {!mascotaIdParam && <ClienteSearch onMascotaSelected={handleMascotaSelected} />}

        {mascotaSeleccionada && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold text-gray-800">{mascotaSeleccionada.nombre}</span>
              <span className="text-gray-500"> · Dueño: {mascotaSeleccionada.dueno?.nombre}</span>
            </p>
          </div>
        )}

        {(mascotaSeleccionada || fechaHoraParam) && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('mascotaId')} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de servicio *</label>
              <select {...register('tipoServicio')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccione un tipo</option>
                {tiposServicio.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.tipoServicio && <p className="text-red-600 text-xs mt-1">{errors.tipoServicio.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesional *</label>
              <select {...register('doctorId', { valueAsNumber: true })} disabled={!tipoServicioSeleccionado || doctores.length === 0} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value="">Seleccione un profesional</option>
                {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>)}
              </select>
              {errors.doctorId && <p className="text-red-600 text-xs mt-1">{errors.doctorId.message}</p>}
              {tipoServicioSeleccionado && doctores.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No hay profesionales disponibles para este tipo.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
              <input type="datetime-local" {...register('fechaHora')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.fechaHora && <p className="text-red-600 text-xs mt-1">{errors.fechaHora.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
              <textarea {...register('motivo')} rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select {...register('estadoCitaId', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
              <button type="button" onClick={() => mascotaIdParam ? navigate(`/mascotas/${mascotaIdParam}`) : navigate('/citas')} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 order-1 sm:order-2">
                {isSubmitting ? 'Guardando...' : 'Guardar Cita'}
              </button>
            </div>
          </form>
        )}

        {!mascotaSeleccionada && !mascotaIdParam && (
          <p className="text-gray-500 text-center py-8 text-sm">
            Busque un cliente y seleccione una mascota para continuar.
          </p>
        )}
      </div>
    </div>
  );
};

export default NuevaCitaPage;