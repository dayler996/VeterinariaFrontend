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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('diagnostico', diagnostico);
  }, [diagnostico, setValue]);

  useEffect(() => {
    setValue('recetaDetalle', recetaDetalle);
  }, [recetaDetalle, setValue]);

  useEffect(() => {
    setValue('fotoReceta', fotoReceta);
  }, [fotoReceta, setValue]);

  useEffect(() => {
    loadDoctores();
    if (mascotaIdParam) {
      cargarMascotaDesdeParam();
    }
  }, [mascotaIdParam]);

  const loadDoctores = async () => {
    try {
      const res = await getTrabajadores(); // solo activos por defecto
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
    } catch (error) {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoading(false);
    }
  };

  const handleMascotaSelected = (mascota) => {
    setMascotaSeleccionada(mascota);
    setValue('mascotaId', mascota.id);
  };

  const onSubmit = async (data) => {
    try {
      await createConsulta(data);
      toast.success('Consulta creada');
      navigate(`/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error('Error al crear consulta');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nueva Consulta</h1>
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
            <option value="">Seleccione</option>
            {doctores.map(d => (
              <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>
            ))}
          </select>
          {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Motivo</label>
          <textarea {...register('motivo')} rows="3" className="mt-1 block w-full border rounded p-2" />
          {errors.motivo && <p className="text-red-600 text-sm">{errors.motivo.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Diagnóstico (pares clave-valor)</label>
          <JsonBuilder value={diagnostico} onChange={setDiagnostico} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Receta (pares clave-valor)</label>
          <JsonBuilder value={recetaDetalle} onChange={setRecetaDetalle} />
        </div>

        <div>
          <ImageUploader
            value={fotoReceta}
            onChange={setFotoReceta}
            folder="receta"
            label="Foto de la receta"
          />
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

export default NuevaConsultaPage;