import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEstudio } from '../../services/estudioService';
import { getTiposEstudio, getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import JsonBuilder from '../../components/common/JsonBuilder';
import MultiImageUploader from '../../components/common/MultiImageUploader';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de estudio requerido' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  resultado: z.any().optional(),
});

const NuevoEstudioPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [categorias, setCategorias] = useState([]);
  const [estudios, setEstudios] = useState([]);
  const [estudiosFiltrados, setEstudiosFiltrados] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [doctores, setDoctores] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState({});
  const [imagenes, setImagenes] = useState([]);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { setValue('resultado', resultado); }, [resultado, setValue]);

  useEffect(() => {
    loadData();
    if (mascotaIdParam) cargarMascotaDesdeParam();
  }, [mascotaIdParam]);

  const loadData = async () => {
    try {
      const [estudiosRes, categoriasRes, doctoresRes] = await Promise.all([
        getTiposEstudio(),
        getCategorias({ tipo: 'estudio' }),
        getTrabajadores(),
      ]);
      setEstudios(estudiosRes.data);
      setCategorias(categoriasRes.data);
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(doctoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre)));
    } catch { toast.error('Error al cargar datos'); }
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

  const handleCategoriaChange = (e) => {
    const catId = e.target.value;
    setCategoriaSeleccionada(catId);
    if (catId) setEstudiosFiltrados(estudios.filter(e => e.categoriaId === parseInt(catId)));
    else setEstudiosFiltrados([]);
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await createEstudio({ ...data, resultado, imagenes });
      toast.success('Estudio creado');
      navigate(mascotaIdParam ? `/mascotas/${mascotaIdParam}` : `/mascotas/${data.mascotaId}`);
    } catch { toast.error('Error al crear estudio'); }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="🔬"
        breadcrumbs={
          mascotaSeleccionada
            ? [
                { label: 'Clientes', to: '/clientes' },
                { label: mascotaSeleccionada.dueno?.nombre, to: `/clientes/${mascotaSeleccionada.dueno?.id}` },
                { label: mascotaSeleccionada.nombre, to: `/mascotas/${mascotaSeleccionada.id}` },
                { label: 'Nuevo Estudio' },
              ]
            : [
                { label: 'Estudios', to: '/estudios' },
                { label: 'Nuevo Estudio' },
              ]
        }
        title="Nuevo Estudio"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select value={categoriaSeleccionada} onChange={handleCategoriaChange} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccione una categoría</option>
            {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Estudio *</label>
          <select {...register('tipoId', { valueAsNumber: true })} disabled={!categoriaSeleccionada} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
            <option value="">Seleccione un estudio</option>
            {estudiosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          {errors.tipoId && <p className="text-red-600 text-xs mt-1">{errors.tipoId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
          <select {...register('doctorId', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccione un doctor</option>
            {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>)}
          </select>
          {errors.doctorId && <p className="text-red-600 text-xs mt-1">{errors.doctorId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resultado (pares clave-valor)</label>
          <JsonBuilder value={resultado} onChange={setResultado} />
        </div>

        <MultiImageUploader value={imagenes} onChange={setImagenes} folder="estudio" label="Imágenes adicionales (opcional)" />

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
          <button type="button" onClick={() => mascotaIdParam ? navigate(`/mascotas/${mascotaIdParam}`) : navigate('/estudios')} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 order-1 sm:order-2">
            {isSubmitting ? 'Guardando...' : 'Guardar Estudio'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoEstudioPage;