import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  motivo: z.string().min(1, 'Motivo requerido'),
  diagnostico: z.any().optional(),
  recetaDetalle: z.any().optional(),
  fotoReceta: z.string().nullable().optional(), // acepta null o undefined
  citaId: z.number().optional(),
});

const ConsultaForm = ({ initialData, onSave, onCancel, mascotas, doctores, citaId }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ? { ...initialData } : { citaId }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const onSubmit = (data) => {
    // Convertir diagnostico y recetaDetalle a objeto si son string (podrían ser JSON)
    if (typeof data.diagnostico === 'string') {
      try { data.diagnostico = JSON.parse(data.diagnostico); } catch { data.diagnostico = { texto: data.diagnostico }; }
    }
    if (typeof data.recetaDetalle === 'string') {
      try { data.recetaDetalle = JSON.parse(data.recetaDetalle); } catch { data.recetaDetalle = { texto: data.recetaDetalle }; }
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
            <option key={m.id} value={m.id}>{m.nombre} ({m.dueno?.nombre})</option>
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
        <label className="block text-sm font-medium">Motivo</label>
        <textarea {...register('motivo')} rows="2" className="mt-1 block w-full border rounded p-2" />
        {errors.motivo && <p className="text-red-600 text-sm">{errors.motivo.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Diagnóstico (puede ser JSON)</label>
        <textarea {...register('diagnostico')} rows="3" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Receta (JSON)</label>
        <textarea {...register('recetaDetalle')} rows="3" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Foto Receta (URL)</label>
        <input {...register('fotoReceta')} className="mt-1 block w-full border rounded p-2" />
      </div>
      {citaId && <input type="hidden" {...register('citaId')} value={citaId} />}
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default ConsultaForm;