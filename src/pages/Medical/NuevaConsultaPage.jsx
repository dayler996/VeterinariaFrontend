import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createConsulta } from '../../services/consultaService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import ImageUploader from '../../components/common/ImageUploader';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const schema = z.object({
  mascotaId: z.number({ required_error: 'Debe seleccionar una mascota' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  motivo: z.string().min(1, 'Motivo requerido'),
  diagnostico: z.any().optional(),
  recetaDetalle: z.any().optional(),
  fotoReceta: z.string().optional(),
});

const NuevaConsultaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [doctores, setDoctores] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [diagnostico, setDiagnostico] = useState({});
  const [recetaDetalle, setRecetaDetalle] = useState({});
  const [fotoReceta, setFotoReceta] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => { setValue('diagnostico', diagnostico); }, [diagnostico, setValue]);
  useEffect(() => { setValue('recetaDetalle', recetaDetalle); }, [recetaDetalle, setValue]);
  useEffect(() => { setValue('fotoReceta', fotoReceta); }, [fotoReceta, setValue]);

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
    } catch { toast.error('Error al cargar la mascota'); }
    finally { setLoading(false); }
  };

  const handleMascotaSelected = (mascota) => {
    setMascotaSeleccionada(mascota);
    setValue('mascotaId', mascota.id);
  };

  const onSubmit = async (data) => {
    try {
      await createConsulta(data);
      toast.success('Consulta creada');
      navigate(mascotaIdParam ? `/mascotas/${mascotaIdParam}` : `/mascotas/${data.mascotaId}`);
    } catch { toast.error('Error al crear consulta'); }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      {/* ═══ PageHeader con breadcrumb dinámico ═══ */}
      <PageHeader
        icon="🩺"
        breadcrumbs={
          mascotaSeleccionada
            ? [
                { label: 'Clientes', to: '/clientes' },
                { label: mascotaSeleccionada.dueno?.nombre, to: `/clientes/${mascotaSeleccionada.dueno?.id}` },
                { label: mascotaSeleccionada.nombre, to: `/mascotas/${mascotaSeleccionada.id}` },
                { label: 'Nueva Consulta' },
              ]
            : [
                { label: 'Consultas', to: '/consultas' },
                { label: 'Nueva Consulta' },
              ]
        }
        title="Nueva Consulta"
        subtitle={
          mascotaSeleccionada
            ? `Para ${mascotaSeleccionada.nombre} (${mascotaSeleccionada.dueno?.nombre})`
            : 'Selecciona un cliente y una mascota'
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        {!mascotaIdParam && (
          <ClienteSearch onMascotaSelected={handleMascotaSelected} />
        )}

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
          <select {...register('doctorId', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccione</option>
            {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>)}
          </select>
          {errors.doctorId && <p className="text-red-600 text-xs mt-1">{errors.doctorId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
          <textarea {...register('motivo')} rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.motivo && <p className="text-red-600 text-xs mt-1">{errors.motivo.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico (pares clave-valor)</label>
          <JsonBuilder value={diagnostico} onChange={setDiagnostico} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receta (pares clave-valor)</label>
          <JsonBuilder value={recetaDetalle} onChange={setRecetaDetalle} />
        </div>

        <div>
          <ImageUploader value={fotoReceta} onChange={setFotoReceta} folder="receta" label="Foto de la receta" />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => mascotaIdParam ? navigate(`/mascotas/${mascotaIdParam}`) : navigate('/consultas')}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 order-1 sm:order-2"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Consulta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaConsultaPage;