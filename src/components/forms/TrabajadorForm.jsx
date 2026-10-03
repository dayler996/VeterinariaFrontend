import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { getCargos } from '../../services/cargoService';
import ImageUploader from '../common/ImageUploader';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().nullable().optional(),
  usuarioId: z.number().optional().nullable(),
});

const TrabajadorForm = ({ initialData, onSave, onCancel }) => {
  const [cargos, setCargos] = useState([]);
  const [cedulaDisplay, setCedulaDisplay] = useState('');
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  const foto = watch('foto');

  useEffect(() => {
    loadCargos();
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        fechaNacimiento: initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : ''
      });
      setCedulaDisplay(initialData.cedula || '');
    }
  }, [initialData, reset]);

  const loadCargos = async () => {
    try {
      const res = await getCargos();
      setCargos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = (data) => {
    if (!data.usuarioId) delete data.usuarioId;
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
        {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Cédula</label>
        <input
          type="text"
          value={cedulaDisplay}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (raw.length <= 10) {
              setCedulaDisplay(raw);
              setValue('cedula', raw, { shouldValidate: true });
            }
          }}
          className="mt-1 block w-full border rounded p-2"
          placeholder=""
        />
        <input type="hidden" {...register('cedula')} />
        {errors.cedula && <p className="text-red-600 text-sm">{errors.cedula.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Sexo</label>
        <select {...register('sexo')} className="mt-1 block w-full border rounded p-2">
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
        {errors.sexo && <p className="text-red-600 text-sm">{errors.sexo.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Fecha de Nacimiento</label>
        <input type="date" {...register('fechaNacimiento')} className="mt-1 block w-full border rounded p-2" />
        {errors.fechaNacimiento && <p className="text-red-600 text-sm">{errors.fechaNacimiento.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Cargo</label>
        <select {...register('cargoId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {cargos.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        {errors.cargoId && <p className="text-red-600 text-sm">{errors.cargoId.message}</p>}
      </div>
      <div>
        <ImageUploader
          value={foto}
          onChange={(url) => setValue('foto', url)}
          folder="trabajador"
          label="Foto del trabajador"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
          Guardar
        </button>
      </div>
    </form>
  );
};

export default TrabajadorForm;