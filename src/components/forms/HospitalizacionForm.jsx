import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  consultaId: z.number({ required_error: 'Consulta requerida' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  motivo: z.string().min(1, 'Motivo requerido'),
  detallesIngreso: z.any().optional(),
});

const HospitalizacionForm = ({ initialData, onSave, onCancel, consultas, mascotas }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const onSubmit = (data) => {
    if (data.detallesIngreso && typeof data.detallesIngreso === 'string') {
      try { data.detallesIngreso = JSON.parse(data.detallesIngreso); } catch { data.detallesIngreso = { texto: data.detallesIngreso }; }
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Consulta asociada</label>
        <select {...register('consultaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {consultas.map(c => (
            <option key={c.id} value={c.id}>Consulta #{c.id} - {c.mascota?.nombre}</option>
          ))}
        </select>
        {errors.consultaId && <p className="text-red-600 text-sm">{errors.consultaId.message}</p>}
      </div>
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
        <label className="block text-sm font-medium">Motivo de hospitalización</label>
        <textarea {...register('motivo')} rows="2" className="mt-1 block w-full border rounded p-2" />
        {errors.motivo && <p className="text-red-600 text-sm">{errors.motivo.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Detalles de ingreso (JSON)</label>
        <textarea {...register('detallesIngreso')} rows="3" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default HospitalizacionForm;