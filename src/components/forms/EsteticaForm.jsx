import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de servicio requerido' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  observacion: z.any().optional(),
});

const EsteticaForm = ({ initialData, onSave, onCancel, tiposEstetica, mascotas }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const onSubmit = (data) => {
    if (data.observacion && typeof data.observacion === 'string') {
      try { data.observacion = JSON.parse(data.observacion); } catch { data.observacion = { texto: data.observacion }; }
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Tipo de Servicio</label>
        <select {...register('tipoId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {tiposEstetica.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        {errors.tipoId && <p className="text-red-600 text-sm">{errors.tipoId.message}</p>}
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
        <label className="block text-sm font-medium">Observaciones (JSON)</label>
        <textarea {...register('observacion')} rows="3" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default EsteticaForm;