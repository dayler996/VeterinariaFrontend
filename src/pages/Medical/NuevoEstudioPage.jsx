import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEstudio } from '../../services/estudioService';
import { getTiposEstudio } from '../../services/crudCatalogoService';
import { getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import JsonBuilder from '../../components/common/JsonBuilder';
import MultiImageUploader from '../../components/common/MultiImageUploader';
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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('resultado', resultado);
  }, [resultado, setValue]);

  useEffect(() => {
    loadData();
    if (mascotaIdParam) {
      cargarMascotaDesdeParam();
    }
  }, [mascotaIdParam]);

  const loadData = async () => {
    try {
      const [estudiosRes, categoriasRes, doctoresRes] = await Promise.all([
        getTiposEstudio(),
        getCategorias({ tipo: 'estudio' }),
        getTrabajadores()
      ]);
      setEstudios(estudiosRes.data);
      setCategorias(categoriasRes.data);
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = doctoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(doctoresFiltrados);
    } catch (error) {
      toast.error('Error al cargar datos');
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

  const handleCategoriaChange = (e) => {
    const catId = e.target.value;
    setCategoriaSeleccionada(catId);
    if (catId) {
      const filtrados = estudios.filter(e => e.categoriaId === parseInt(catId));
      setEstudiosFiltrados(filtrados);
    } else {
      setEstudiosFiltrados([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await createEstudio({ ...data, resultado, imagenes });
      toast.success('Estudio creado');
      navigate(`/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error('Error al crear estudio');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nuevo Estudio</h1>
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
          <label className="block text-sm font-medium">Categoría</label>
          <select
            value={categoriaSeleccionada}
            onChange={handleCategoriaChange}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Tipo de Estudio</label>
          <select
            {...register('tipoId', { valueAsNumber: true })}
            disabled={!categoriaSeleccionada}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Seleccione un estudio</option>
            {estudiosFiltrados.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          {errors.tipoId && <p className="text-red-600 text-sm">{errors.tipoId.message}</p>}
        </div>

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

        <div>
          <label className="block text-sm font-medium mb-1">Resultado (pares clave-valor)</label>
          <JsonBuilder value={resultado} onChange={setResultado} />
        </div>

        <MultiImageUploader
          value={imagenes}
          onChange={setImagenes}
          folder="estudio"
          label="Imágenes adicionales (opcional)"
        />

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

export default NuevoEstudioPage;