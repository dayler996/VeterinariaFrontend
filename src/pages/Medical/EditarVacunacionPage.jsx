import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getVacunacion, updateVacunacion } from '../../services/vacunacionService';
import { getVacunas } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  vacunaId: z.number({ required_error: 'Vacuna requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  proximoRefuerzo: z.string().optional(),
  detalles: z.any().optional(),
  observacion: z.string().optional(),
});

const EditarVacunacionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vacunacion, setVacunacion] = useState(null);
  const [mascota, setMascota] = useState(null);
  const [vacunas, setVacunas] = useState([]);
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
      const vacRes = await getVacunacion(id);
      const vac = vacRes.data;
      setVacunacion(vac);
      setDetalles(vac.detalles || {});

      const mascRes = await getMascota(vac.mascotaId);
      const masc = mascRes.data;
      setMascota(masc);

      const vacunasRes = await getVacunas({ especieId: masc.especieId });
      setVacunas(vacunasRes.data);

      const doctoresRes = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = doctoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(doctoresFiltrados);

      reset({
        vacunaId: vac.vacunaId,
        doctorId: vac.doctorId,
        proximoRefuerzo: vac.proximoRefuerzo ? vac.proximoRefuerzo.split('T')[0] : '',
        observacion: vac.observacion || '',
      });
    } catch (error) {
      toast.error('Error al cargar la vacunación');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateVacunacion(id, { ...data, detalles });
      toast.success('Vacunación actualizada');
      navigate(`/vacunaciones/${id}`);
    } catch (error) {
      toast.error('Error al actualizar la vacunación');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!vacunacion || !mascota) return <div className="text-center p-4">Vacunación no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Vacunación</h1>

      <div className="p-3 bg-blue-50 rounded mb-4">
        <p className="text-sm">
          <span className="font-semibold">Mascota:</span> {mascota.nombre} (Dueño: {mascota.dueno?.nombre})
        </p>
        <p className="text-sm">
          <span className="font-semibold">Especie:</span> {mascota.especie?.nombre}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Vacuna</label>
          <select {...register('vacunaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
            <option value="">Seleccione una vacuna</option>
            {vacunas.map(v => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
          {errors.vacunaId && <p className="text-red-600 text-sm">{errors.vacunaId.message}</p>}
        </div>

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
          <label className="block text-sm font-medium">Próximo refuerzo (opcional)</label>
          <input type="date" {...register('proximoRefuerzo')} className="mt-1 block w-full border rounded p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Detalles adicionales (pares clave-valor)</label>
          <JsonBuilder value={detalles} onChange={setDetalles} />
        </div>

        <div>
          <label className="block text-sm font-medium">Observación</label>
          <textarea {...register('observacion')} rows="2" className="mt-1 block w-full border rounded p-2" />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => navigate(`/vacunaciones/${id}`)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
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

export default EditarVacunacionPage;