import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createMonitoreo } from '../../services/monitoreoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { useAuth } from '../../context/AuthContext';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  hospitalizacionId: z.number({ required_error: 'Hospitalización requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  detalles: z.any().optional(),
  observaciones: z.string().optional(),
});

const NuevoMonitoreoPage = () => {
  const { id } = useParams(); // id de la hospitalización
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctores, setDoctores] = useState([]);
  const [detalles, setDetalles] = useState({});
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { 
      hospitalizacionId: parseInt(id),
      doctorId: user?.trabajador?.id || ''
    }
  });

  useEffect(() => {
    setValue('detalles', detalles);
  }, [detalles, setValue]);

  useEffect(() => {
    loadDoctores();
    setValue('hospitalizacionId', parseInt(id));
  }, [id]);

  const loadDoctores = async () => {
    try {
      const res = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = res.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(doctoresFiltrados);
    } catch (error) {
      toast.error('Error al cargar doctores');
    }
  };

  const onSubmit = async (data) => {
    try {
      await createMonitoreo({ ...data, detalles });
      toast.success('Monitoreo registrado');
      navigate(`/hospitalizaciones/${id}`);
    } catch (error) {
      toast.error('Error al registrar monitoreo');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nuevo Monitoreo</h1>
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
        <input type="hidden" {...register('hospitalizacionId')} />
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
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

export default NuevoMonitoreoPage;