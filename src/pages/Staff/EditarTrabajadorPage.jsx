import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTrabajador, updateTrabajador } from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import ImageUploader from '../../components/common/ImageUploader';
import toast from 'react-hot-toast';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

const EditarTrabajadorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cedulaDisplay, setCedulaDisplay] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const foto = watch('foto');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [trabajadorRes, cargosRes] = await Promise.all([
        getTrabajador(id),
        getCargos(),
      ]);
      const trabajador = trabajadorRes.data;
      reset({
        nombre: trabajador.nombre,
        cedula: trabajador.cedula,
        sexo: trabajador.sexo,
        fechaNacimiento: trabajador.fechaNacimiento ? new Date(trabajador.fechaNacimiento).toISOString().split('T')[0] : '',
        cargoId: trabajador.cargoId,
        foto: trabajador.foto || '',
        activo: trabajador.activo,
      });
      setCedulaDisplay(trabajador.cedula || '');
      setCargos(cargosRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateTrabajador(id, data);
      toast.success('Trabajador actualizado');
      navigate(`/trabajadores/${id}`);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Trabajador</h1>
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
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('activo')} id="activo" />
          <label htmlFor="activo" className="text-sm font-medium">Activo</label>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => navigate(`/trabajadores/${id}`)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarTrabajadorPage;