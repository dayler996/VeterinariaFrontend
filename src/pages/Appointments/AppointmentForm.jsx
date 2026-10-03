import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  fechaHora: z.string().min(1, 'Fecha y hora requerida'),
  motivo: z.string().optional(),
  estadoCitaId: z.number().default(1),
});

const CitaForm = ({ initialData, onSave, onCancel, doctores, mascotas, estados }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      ...initialData,
      fechaHora: initialData.fechaHora ? new Date(initialData.fechaHora).toISOString().slice(0, 16) : '',
    } : { estadoCitaId: 1 }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        fechaHora: initialData.fechaHora ? new Date(initialData.fechaHora).toISOString().slice(0, 16) : '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = (data) => {
    onSave({
      ...data,
      mascotaId: Number(data.mascotaId),
      doctorId: Number(data.doctorId),
      estadoCitaId: Number(data.estadoCitaId),
    });
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
        <label className="block text-sm font-medium">Doctor</label>
        <select {...register('doctorId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione...</option>
          {doctores.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Fecha y Hora</label>
        <input type="datetime-local" {...register('fechaHora')} className="mt-1 block w-full border rounded p-2" />
        {errors.fechaHora && <p className="text-red-600 text-sm">{errors.fechaHora.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Motivo</label>
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
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default CitaForm;