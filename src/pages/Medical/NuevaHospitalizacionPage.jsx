import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createHospitalizacion } from '../../services/hospitalizacionService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import { getConsultas } from '../../services/consultaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  motivo: z.string().min(1, 'Motivo requerido'),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  consultaId: z.number().optional().nullable(),
  detallesIngreso: z.any().optional(),
});

const NuevaHospitalizacionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [doctores, setDoctores] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [detallesIngreso, setDetallesIngreso] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const mascotaId = watch('mascotaId');

  useEffect(() => {
    setValue('detallesIngreso', detallesIngreso);
  }, [detallesIngreso, setValue]);

  useEffect(() => {
    loadDoctores();
    if (mascotaIdParam) {
      cargarMascotaDesdeParam();
    }
  }, [mascotaIdParam]);

  // Cargar consultas cuando se selecciona una mascota
  useEffect(() => {
    if (mascotaId) {
      cargarConsultas(mascotaId);
    } else {
      setConsultas([]);
    }
  }, [mascotaId]);

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
      await cargarConsultas(mascota.id);
    } catch (error) {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoading(false);
    }
  };

  const cargarConsultas = async (mascotaId) => {
    try {
      // Obtener consultas de la mascota sin hospitalización, ordenadas por fecha descendente
      const res = await getConsultas({ mascotaId, sinHospitalizacion: true });
      setConsultas(res.data);
    } catch (error) {
      toast.error('Error al cargar consultas');
    }
  };

  const handleMascotaSelected = async (mascota) => {
    setMascotaSeleccionada(mascota);
    setValue('mascotaId', mascota.id);
    await cargarConsultas(mascota.id);
  };

  const onSubmit = async (data) => {
    try {
      await createHospitalizacion(data);
      toast.success('Hospitalización creada');
      navigate(`/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error('Error al crear hospitalización');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nueva Hospitalización</h1>
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
          <label className="block text-sm font-medium">Doctor</label>
          <select {...register('doctorId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
            <option value="">Seleccione un doctor</option>
            {doctores.map(d => (
              <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>
            ))}
          </select>
          {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
        </div>

        {/* Selector de consulta opcional */}
        <div>
          <label className="block text-sm font-medium">Consulta asociada (opcional)</label>
          <select 
  {...register('consultaId', { 
    setValueAs: (v) => v === "" ? null : parseInt(v, 10) 
  })} 
  className="mt-1 block w-full border rounded p-2"
>
  <option value="">Ninguna</option>
  {consultas.map(c => (
    <option key={c.id} value={c.id}>
      {new Date(c.fecha).toLocaleDateString()} - {c.motivo.substring(0, 50)}...
    </option>
  ))}
</select>
          {consultas.length === 0 && mascotaSeleccionada && (
            <p className="text-sm text-gray-500 mt-1">No hay consultas previas sin hospitalización.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Motivo</label>
          <textarea {...register('motivo')} rows="3" className="mt-1 block w-full border rounded p-2" />
          {errors.motivo && <p className="text-red-600 text-sm">{errors.motivo.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Detalles de ingreso (pares clave-valor)</label>
          <JsonBuilder value={detallesIngreso} onChange={setDetallesIngreso} />
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

export default NuevaHospitalizacionPage;