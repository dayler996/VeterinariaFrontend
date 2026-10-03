import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  vacunaId: z.number({ required_error: 'Vacuna requerida' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  proximoRefuerzo: z.string().optional(),
  detalles: z.any().optional(),
  observacion: z.string().optional(),
});

const VacunacionForm = ({ initialData, onSave, onCancel, vacunas, mascotas, doctores }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      ...initialData,
      proximoRefuerzo: initialData.proximoRefuerzo ? new Date(initialData.proximoRefuerzo).toISOString().split('T')[0] : ''
    } : {}
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        proximoRefuerzo: initialData.proximoRefuerzo ? new Date(initialData.proximoRefuerzo).toISOString().split('T')[0] : ''
      });
    }
  }, [initialData, reset]);

  const onSubmit = (data) => {
    if (data.detalles && typeof data.detalles === 'string') {
      try { data.detalles = JSON.parse(data.detalles); } catch { data.detalles = { texto: data.detalles }; }
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Mascota</label>
        <select {...register('mascotaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {mascotas.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
        {errors.mascotaId && <p className="text-red-600 text-sm">{errors.mascotaId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Vacuna</label>
        <select {...register('vacunaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {vacunas.map(v => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </select>
        {errors.vacunaId && <p className="text-red-600 text-sm">{errors.vacunaId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Doctor</label>
        <select {...register('doctorId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {doctores.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Fecha próximo refuerzo</label>
        <input type="date" {...register('proximoRefuerzo')} className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Detalles (JSON)</label>
        <textarea {...register('detalles')} rows="3" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Observación</label>
        <textarea {...register('observacion')} rows="2" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default VacunacionForm;