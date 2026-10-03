import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';

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

const CitaForm = ({ initialData, onSave, onCancel, onDelete, doctores: todosDoctores, mascotas, estados }) => {
  const [doctoresFiltrados, setDoctoresFiltrados] = useState([]);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      ...initialData,
      fechaHora: initialData.fechaHora ? new Date(initialData.fechaHora).toISOString().slice(0, 16) : '',
      tipoServicio: initialData.tipoServicio || '',
    } : { estadoCitaId: 1, tipoServicio: '' }
  });

  const tipoServicioSeleccionado = watch('tipoServicio');

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        fechaHora: initialData.fechaHora ? new Date(initialData.fechaHora).toISOString().slice(0, 16) : '',
        tipoServicio: initialData.tipoServicio || '',
      });
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (tipoServicioSeleccionado && todosDoctores) {
      const cargosPermitidos = cargosPorTipo[tipoServicioSeleccionado] || [];
      const filtrados = todosDoctores.filter(d => cargosPermitidos.includes(d.cargo?.nombre));
      setDoctoresFiltrados(filtrados);
    } else {
      setDoctoresFiltrados([]);
    }
  }, [tipoServicioSeleccionado, todosDoctores]);

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
    if (window.confirm('¿Está seguro de eliminar esta cita?')) {
      onDelete();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Mascota</label>
        <select {...register('mascotaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione...</option>
          {mascotas.map(m => (
            <option key={m.id} value={m.id}>{m.nombre} ({m.dueno?.nombre})</option>
          ))}
        </select>
        {errors.mascotaId && <p className="text-red-600 text-sm">{errors.mascotaId.message}</p>}
      </div>

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

      <div>
        <label className="block text-sm font-medium">Profesional</label>
        <select
          {...register('doctorId', { valueAsNumber: true })}
          disabled={!tipoServicioSeleccionado || doctoresFiltrados.length === 0}
          className="mt-1 block w-full border rounded p-2"
        >
          <option value="">Seleccione un profesional</option>
          {doctoresFiltrados.map(d => (
            <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>
          ))}
        </select>
        {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
        {tipoServicioSeleccionado && doctoresFiltrados.length === 0 && (
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
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
          Cancelar
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded order-3 sm:order-2"
          >
            Eliminar
          </button>
        )}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-3">
          Guardar
        </button>
      </div>
    </form>
  );
};

export default CitaForm;