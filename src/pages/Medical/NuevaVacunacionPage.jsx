import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createVacunacion } from '../../services/vacunacionService';
import { getVacunas } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  vacunaId: z.number({ required_error: 'Vacuna requerida' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  proximoRefuerzo: z.string().optional(),
  detalles: z.any().optional(),
  observacion: z.string().optional(),
});

const NuevaVacunacionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [doctores, setDoctores] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('detalles', detalles);
  }, [detalles, setValue]);

  useEffect(() => {
    loadDoctores();
    if (mascotaIdParam) {
      cargarMascotaDesdeParam();
    }
  }, [mascotaIdParam]);

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

  const cargarMascotaDesdeParam = async () => {
    try {
      setLoading(true);
      const res = await getMascota(mascotaIdParam);
      const mascota = res.data;
      setMascotaSeleccionada(mascota);
      setValue('mascotaId', mascota.id);
      await cargarVacunas(mascota.especieId);
    } catch (error) {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoading(false);
    }
  };

  const cargarVacunas = async (especieId) => {
    try {
      const res = await getVacunas({ especieId });
      setVacunas(res.data);
    } catch (error) {
      toast.error('Error al cargar vacunas');
    }
  };

  const handleMascotaSelected = async (mascota) => {
    setMascotaSeleccionada(mascota);
    setValue('mascotaId', mascota.id);
    await cargarVacunas(mascota.especieId);
  };

  const onSubmit = async (data) => {
    try {
      await createVacunacion(data);
      toast.success('Vacunación registrada');
      navigate(`/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error('Error al registrar vacunación');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nueva Vacunación</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!mascotaIdParam && (
          <ClienteSearch onMascotaSelected={handleMascotaSelected} />
        )}

        {mascotaSeleccionada && (
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-sm">
              Mascota seleccionada: <span className="font-semibold">{mascotaSeleccionada.nombre}</span> (Dueño: {mascotaSeleccionada.dueno?.nombre})
            </p>
          </div>
        )}

        <input type="hidden" {...register('mascotaId')} />

        <div>
          <label className="block text-sm font-medium">Vacuna</label>
          <select
            {...register('vacunaId', { valueAsNumber: true })}
            disabled={!mascotaSeleccionada}
            className="mt-1 block w-full border rounded p-2"
          >
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

export default NuevaVacunacionPage;