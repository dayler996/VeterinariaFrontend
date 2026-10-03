import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getMonitoreo, updateMonitoreo } from '../../services/monitoreoService';
import { getTrabajadores } from '../../services/trabajadorService';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  detalles: z.any().optional(),
  observaciones: z.string().optional(),
});

const EditarMonitoreoPage = () => {
  const { id } = useParams(); // id del monitoreo
  const navigate = useNavigate();

  const [monitoreo, setMonitoreo] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('detalles', detalles);
  }, [detalles, setValue]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [monRes, doctoresRes] = await Promise.all([
        getMonitoreo(id),
        getTrabajadores()
      ]);
      const mon = monRes.data;
      setMonitoreo(mon);
      setDetalles(mon.detalles || {});

      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = doctoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(doctoresFiltrados);

      reset({
        doctorId: mon.doctorId,
        observaciones: mon.observaciones || '',
      });
    } catch (error) {
      toast.error('Error al cargar el monitoreo');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateMonitoreo(id, { ...data, detalles });
      toast.success('Monitoreo actualizado');
      navigate(`/monitoreos/${id}`);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!monitoreo) return <div className="text-center p-4">Monitoreo no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Monitoreo</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Doctor</label>
          <select {...register('doctorId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
            <option value="">Seleccione</option>
            {doctores.map(d => (
              <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>
            ))}
          </select>
          {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Detalles (pares clave-valor)</label>
          <JsonBuilder value={detalles} onChange={setDetalles} />
        </div>
        <div>
          <label className="block text-sm font-medium">Observaciones</label>
          <textarea {...register('observaciones')} rows="3" className="mt-1 block w-full border rounded p-2" />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => navigate(`/monitoreos/${id}`)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
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

export default EditarMonitoreoPage;