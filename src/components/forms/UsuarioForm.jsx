import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  rolId: z.number({ required_error: 'Rol requerido' }),
  trabajadorId: z.number().optional().nullable(),
});

const UsuarioForm = ({ initialData, onSave, onCancel, roles, trabajadores }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ? { ...initialData, password: '' } : {}
  });

  useEffect(() => {
    if (initialData) reset({ ...initialData, password: '' });
  }, [initialData, reset]);

  const onSubmit = (data) => {
    // Si password está vacío y es edición, lo eliminamos para no cambiarlo
    if (initialData && !data.password) {
      delete data.password;
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input type="email" {...register('email')} className="mt-1 block w-full border rounded p-2" />
        {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">
          Contraseña {initialData && '(dejar vacío para no cambiar)'}
        </label>
        <input type="password" {...register('password')} className="mt-1 block w-full border rounded p-2" />
        {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Rol</label>
        <select {...register('rolId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
        {errors.rolId && <p className="text-red-600 text-sm">{errors.rolId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Trabajador asociado (opcional)</label>
        <select {...register('trabajadorId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Ninguno</option>
          {trabajadores.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
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

export default UsuarioForm;