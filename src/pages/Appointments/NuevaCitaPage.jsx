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
import toast from 'react-hot-toast';

// Tipos de servicio posibles
const tiposServicio = [
  { value: 'consulta', label: 'Consulta médica' },
  { value: 'operacion', label: 'Operación / Cirugía' },
  { value: 'estetica', label: 'Servicio de estética' },
];

// Mapa de cargos permitidos por tipo de servicio
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
  const [todosTrabajadores, setTodosTrabajadores] = useState([]); // Todos los trabajadores para filtrar

  const fechaHoraInicial = fechaHoraParam 
    ? new Date(fechaHoraParam).toISOString().slice(0, 16)
    : '';

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fechaHora: fechaHoraInicial,
      estadoCitaId: 1,
      tipoServicio: '',
    }
  });

  const tipoServicioSeleccionado = watch('tipoServicio');

  // Filtrar profesionales según el tipo de servicio seleccionado
  useEffect(() => {
    if (tipoServicioSeleccionado && todosTrabajadores.length > 0) {
      const cargosPermitidos = cargosPorTipo[tipoServicioSeleccionado] || [];
      const filtrados = todosTrabajadores.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(filtrados);
    } else {
      setDoctores([]);
    }
    // Limpiar el profesional seleccionado si cambia el tipo
    setValue('doctorId', undefined);
  }, [tipoServicioSeleccionado, todosTrabajadores, setValue]);

  useEffect(() => {
    loadDoctoresYEstados();
    if (mascotaIdParam) {
      cargarMascotaDesdeParam();
    }
  }, [mascotaIdParam]);

  const loadDoctoresYEstados = async () => {
    try {
      const [trabajadoresRes, estadosRes] = await Promise.all([
        getTrabajadores(), // Obtenemos todos los trabajadores
        getEstadosCita(),
      ]);
      setTodosTrabajadores(trabajadoresRes.data);
      setEstados(estadosRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  const cargarMascotaDesdeParam = async () => {
    try {
      setLoading(true);
      const res = await getMascota(mascotaIdParam);
      const mascota = res.data;
      setMascotaSeleccionada(mascota);
      setValue('mascotaId', mascota.id);
    } catch (error) {
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
      console.log('onSubmit llamado con data:', data);
    try {
      await createCita(data);
      toast.success('Cita creada');
      navigate('/citas');
    } catch (error) {
      console.error('Error al crear cita:', error);
    console.error('Respuesta del servidor:', error.response?.data);
      toast.error('Error al crear cita');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nueva Cita</h1>
      
      {!mascotaIdParam && (
        <div className="mb-6">
          <ClienteSearch onMascotaSelected={handleMascotaSelected} />
        </div>
      )}

      {mascotaSeleccionada && (
        <div className="p-3 bg-blue-50 rounded mb-4">
          <p className="text-sm">
            Mascota seleccionada: <span className="font-semibold">{mascotaSeleccionada.nombre}</span> (Dueño: {mascotaSeleccionada.dueno?.nombre})
          </p>
        </div>
      )}

      {(mascotaSeleccionada || fechaHoraParam) && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('mascotaId')} />

          {/* Tipo de servicio */}
          <div>
            <label className="block text-sm font-medium">Tipo de servicio</label>
            <select {...register('tipoServicio')} className="mt-1 block w-full border rounded p-2">
              <option value="">Seleccione un tipo</option>
              {tiposServicio.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.tipoServicio && <p className="text-red-600 text-sm">{errors.tipoServicio.message}</p>}
          </div>

          {/* Profesional (depende del tipo de servicio) */}
          <div>
            <label className="block text-sm font-medium">Profesional</label>
            <select
              {...register('doctorId', { valueAsNumber: true })}
              disabled={!tipoServicioSeleccionado || doctores.length === 0}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Seleccione un profesional</option>
              {doctores.map(d => (
                <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>
              ))}
            </select>
            {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
            {tipoServicioSeleccionado && doctores.length === 0 && (
              <p className="text-sm text-red-500 mt-1">No hay profesionales disponibles para este tipo de servicio.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Fecha y Hora</label>
            <input
              type="datetime-local"
              {...register('fechaHora')}
              className="mt-1 block w-full border rounded p-2"
            />
            {errors.fechaHora && <p className="text-red-600 text-sm">{errors.fechaHora.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Motivo (opcional)</label>
            <textarea {...register('motivo')} rows="3" className="mt-1 block w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Estado</label>
            <select {...register('estadoCitaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
              {estados.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => navigate('/citas')} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
              Guardar
            </button>
          </div>
        </form>
      )}

      {!mascotaSeleccionada && !mascotaIdParam && (
        <p className="text-gray-500 text-center py-8">
          Busque un cliente y seleccione una mascota para continuar.
        </p>
      )}
    </div>
  );
};

export default NuevaCitaPage;