import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  hospitalizacionId: z.number({ required_error: 'Hospitalización requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  detalles: z.any().optional(),
  observaciones: z.string().optional(),
});

const MonitoreoForm = ({ initialData, onSave, onCancel, hospitalizaciones, doctores }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
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
        <label className="block text-sm font-medium">Hospitalización</label>
        <select {...register('hospitalizacionId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {hospitalizaciones.map(h => (
            <option key={h.id} value={h.id}>Hospitalización #{h.id} - {h.mascota?.nombre}</option>
          ))}
        </select>
        {errors.hospitalizacionId && <p className="text-red-600 text-sm">{errors.hospitalizacionId.message}</p>}
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
        <label className="block text-sm font-medium">Detalles (JSON, ej. signos vitales)</label>
        <textarea {...register('detalles')} rows="4" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Observaciones</label>
        <textarea {...register('observaciones')} rows="2" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default MonitoreoForm;