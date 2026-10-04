import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTrabajador, updateTrabajador } from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import ImageUploader from '../../components/common/ImageUploader';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string().min(1, 'Cédula requerida').regex(/^\d+$/, 'Solo números').max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

const EditarTrabajadorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cedulaDisplay, setCedulaDisplay] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const foto = watch('foto');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [trabajadorRes, cargosRes] = await Promise.all([getTrabajador(id), getCargos()]);
      const t = trabajadorRes.data;
      setTrabajador(t);
      reset({
        nombre: t.nombre,
        cedula: t.cedula,
        sexo: t.sexo,
        fechaNacimiento: t.fechaNacimiento ? new Date(t.fechaNacimiento).toISOString().split('T')[0] : '',
        cargoId: t.cargoId,
        foto: t.foto || '',
        activo: t.activo,
      });
      setCedulaDisplay(t.cedula || '');
      setCargos(cargosRes.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    try {
      await updateTrabajador(id, data);
      toast.success('Trabajador actualizado');
      navigate(`/trabajadores/${id}`);
    } catch { toast.error('Error al actualizar'); }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;
  if (!trabajador) return <div className="text-center p-4 text-gray-500">Trabajador no encontrado</div>;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="👨‍⚕️"
        breadcrumbs={[
          { label: 'Personal', to: '/trabajadores' },
          { label: trabajador.nombre, to: `/trabajadores/${id}` },
          { label: 'Editar' },
        ]}
        title={`Editar: ${trabajador.nombre}`}
        subtitle={trabajador.cargo?.nombre || 'Sin cargo'}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input {...register('nombre')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`} />
          {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
          <input
            type="text"
            inputMode="numeric"
            value={cedulaDisplay}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              if (raw.length <= 10) {
                setCedulaDisplay(raw);
                setValue('cedula', raw, { shouldValidate: true });
              }
            }}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cedula ? 'border-red-400' : 'border-gray-300'}`}
          />
          <input type="hidden" {...register('cedula')} />
          {errors.cedula && <p className="text-red-600 text-xs mt-1">{errors.cedula.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
          <select {...register('sexo')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
          <input type="date" {...register('fechaNacimiento')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.fechaNacimiento && <p className="text-red-600 text-xs mt-1">{errors.fechaNacimiento.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
          <select {...register('cargoId', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccione</option>
            {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {errors.cargoId && <p className="text-red-600 text-xs mt-1">{errors.cargoId.message}</p>}
        </div>

        <div>
          <ImageUploader value={foto} onChange={(url) => setValue('foto', url)} folder="trabajador" label="Foto del trabajador" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('activo')} id="activo" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <label htmlFor="activo" className="text-sm font-medium text-gray-700">Activo</label>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
          <button type="button" onClick={() => navigate(`/trabajadores/${id}`)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 order-1 sm:order-2">
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarTrabajadorPage;