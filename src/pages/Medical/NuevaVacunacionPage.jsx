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
import PageHeader from '../../components/common/PageHeader';
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

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { setValue('detalles', detalles); }, [detalles, setValue]);

  useEffect(() => {
    loadDoctores();
    if (mascotaIdParam) cargarMascotaDesdeParam();
  }, [mascotaIdParam]);

  const loadDoctores = async () => {
    try {
      const res = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(res.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre)));
    } catch { toast.error('Error al cargar doctores'); }
  };

  const cargarMascotaDesdeParam = async () => {
    try {
      setLoading(true);
      const res = await getMascota(mascotaIdParam);
      setMascotaSeleccionada(res.data);
      setValue('mascotaId', res.data.id);
      await cargarVacunas(res.data.especieId);
    } catch { toast.error('Error al cargar la mascota'); }
    finally { setLoading(false); }
  };

  const cargarVacunas = async (especieId) => {
    try {
      const res = await getVacunas({ especieId });
      setVacunas(res.data);
    } catch { toast.error('Error al cargar vacunas'); }
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
      navigate(mascotaIdParam ? `/mascotas/${mascotaIdParam}` : `/mascotas/${data.mascotaId}`);
    } catch { toast.error('Error al registrar vacunación'); }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="💉"
        breadcrumbs={
          mascotaSeleccionada
            ? [
                { label: 'Clientes', to: '/clientes' },
                { label: mascotaSeleccionada.dueno?.nombre, to: `/clientes/${mascotaSeleccionada.dueno?.id}` },
                { label: mascotaSeleccionada.nombre, to: `/mascotas/${mascotaSeleccionada.id}` },
                { label: 'Nueva Vacunación' },
              ]
            : [
                { label: 'Vacunaciones', to: '/vacunaciones' },
                { label: 'Nueva Vacunación' },
              ]
        }
        title="Nueva Vacunación"
        subtitle={mascotaSeleccionada ? `Para ${mascotaSeleccionada.nombre} (${mascotaSeleccionada.dueno?.nombre})` : 'Selecciona un cliente y una mascota'}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        {!mascotaIdParam && <ClienteSearch onMascotaSelected={handleMascotaSelected} />}

        {mascotaSeleccionada && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold text-gray-800">{mascotaSeleccionada.nombre}</span>
              <span className="text-gray-500"> · Dueño: {mascotaSeleccionada.dueno?.nombre}</span>
            </p>
          </div>
        )}

        <input type="hidden" {...register('mascotaId')} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vacuna *</label>
          <select {...register('vacunaId', { valueAsNumber: true })} disabled={!mascotaSeleccionada} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
            <option value="">Seleccione una vacuna</option>
            {vacunas.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
          {errors.vacunaId && <p className="text-red-600 text-xs mt-1">{errors.vacunaId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
          <select {...register('doctorId', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccione</option>
            {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>)}
          </select>
          {errors.doctorId && <p className="text-red-600 text-xs mt-1">{errors.doctorId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Próximo refuerzo (opcional)</label>
          <input type="date" {...register('proximoRefuerzo')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detalles adicionales (pares clave-valor)</label>
          <JsonBuilder value={detalles} onChange={setDetalles} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
          <textarea {...register('observacion')} rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
          <button type="button" onClick={() => mascotaIdParam ? navigate(`/mascotas/${mascotaIdParam}`) : navigate('/vacunaciones')} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 order-1 sm:order-2">
            {isSubmitting ? 'Guardando...' : 'Guardar Vacunación'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaVacunacionPage;