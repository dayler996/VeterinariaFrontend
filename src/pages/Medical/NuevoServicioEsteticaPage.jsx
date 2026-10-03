import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createServicioEstetica } from '../../services/esteticaService';
import { getTiposEstetica } from '../../services/crudCatalogoService';
import { getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de servicio requerido' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  trabajadorId: z.number({ required_error: 'Peluquero requerido' }),
  observacion: z.any().optional(),
});

const NuevoServicioEsteticaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [peluqueros, setPeluqueros] = useState([]);
  const [observacion, setObservacion] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('observacion', observacion);
  }, [observacion, setValue]);

  useEffect(() => {
    loadData();
    if (mascotaIdParam) {
      cargarMascotaDesdeParam();
    }
  }, [mascotaIdParam]);

  const loadData = async () => {
    try {
      const [servRes, catsRes, trabajadoresRes] = await Promise.all([
        getTiposEstetica(),
        getCategorias({ tipo: 'estetica' }),
        
        getTrabajadores()
      ]);
      setServicios(servRes.data);
      setCategorias(catsRes.data);
      const peluquerosFiltrados = trabajadoresRes.data.filter(t => t.cargo?.nombre === 'Peluquero Canino');
      setPeluqueros(peluquerosFiltrados);
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
      const filtrados = servicios.filter(s => s.categoriaId === parseInt(catId));
      setServiciosFiltrados(filtrados);
    } else {
      setServiciosFiltrados([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await createServicioEstetica(data);
      toast.success('Servicio de estética creado');
      navigate(`/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error('Error al crear servicio');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nuevo Servicio de Estética</h1>
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
          <label className="block text-sm font-medium">Tipo de Servicio</label>
          <select
            {...register('tipoId', { valueAsNumber: true })}
            disabled={!categoriaSeleccionada}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Seleccione un servicio</option>
            {serviciosFiltrados.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          {errors.tipoId && <p className="text-red-600 text-sm">{errors.tipoId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Peluquero</label>
          <select {...register('trabajadorId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
            <option value="">Seleccione un peluquero</option>
            {peluqueros.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          {errors.trabajadorId && <p className="text-red-600 text-sm">{errors.trabajadorId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Observaciones (pares clave-valor)</label>
          <JsonBuilder value={observacion} onChange={setObservacion} />
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

export default NuevoServicioEsteticaPage;