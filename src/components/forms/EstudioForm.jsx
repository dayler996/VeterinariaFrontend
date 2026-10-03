import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de estudio requerido' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  resultado: z.any().optional(),
});

const EstudioForm = ({ initialData, onSave, onCancel, tiposEstudio, mascotas, doctores }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const onSubmit = (data) => {
    if (data.resultado && typeof data.resultado === 'string') {
      try { data.resultado = JSON.parse(data.resultado); } catch { data.resultado = { texto: data.resultado }; }
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Tipo de Estudio</label>
        <select {...register('tipoId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {tiposEstudio.map(t => (
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
        <label className="block text-sm font-medium">Resultado (JSON)</label>
        <textarea {...register('resultado')} rows="4" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default EstudioForm;