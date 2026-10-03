import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { getEspecies } from '../../services/especieService';
import { getRazas } from '../../services/razaService';
import ImageUploader from '../common/ImageUploader';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  especieId: z.number({ required_error: 'Especie requerida' }),
  razaId: z.number({ required_error: 'Raza requerida' }),
  clienteId: z.number({ required_error: 'Cliente requerido' }),
  foto: z.string().nullable().optional(), // acepta null o undefined,
});

const MascotaForm = ({ initialData, onSave, onCancel, clienteId }) => {
  const [especies, setEspecies] = useState([]);
  const [razas, setRazas] = useState([]);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ? { ...initialData, clienteId: initialData.dueno?.id || clienteId } : { clienteId }
  });

  const especieId = watch('especieId');
  const foto = watch('foto');

  useEffect(() => {
    loadEspecies();
  }, []);

  useEffect(() => {
    if (especieId) loadRazas(especieId);
  }, [especieId]);

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        clienteId: initialData.dueno?.id,
        fechaNacimiento: initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : ''
      });
    }
  }, [initialData, reset]);

  const loadEspecies = async () => {
    try {
      const res = await getEspecies();
      setEspecies(res.data);
    } catch (error) {
      console.error(error);
    }
  };

const loadRazas = async (especieId) => {
  try {
    const res = await getRazas({ especieId }); // ← pasar como objeto
    setRazas(res.data);
  } catch (error) {
    console.error(error);
  }
};

  const onSubmit = (data) => {
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
        <label className="block text-sm font-medium">Sexo</label>
        <select {...register('sexo')} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
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
        <label className="block text-sm font-medium">Especie</label>
        <select {...register('especieId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {especies.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        {errors.especieId && <p className="text-red-600 text-sm">{errors.especieId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Raza</label>
        <select {...register('razaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {razas.map(r => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
        {errors.razaId && <p className="text-red-600 text-sm">{errors.razaId.message}</p>}
      </div>
      <div>
        <ImageUploader
          value={foto}
          onChange={(url) => setValue('foto', url)}
          folder="mascota"
          label="Foto de la mascota"
        />
      </div>
      <input type="hidden" {...register('clienteId')} />
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

export default MascotaForm;