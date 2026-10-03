import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getServicioEstetica, updateServicioEstetica } from '../../services/esteticaService';
import { getTiposEstetica } from '../../services/crudCatalogoService';
import { getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de servicio requerido' }),
  trabajadorId: z.number({ required_error: 'Peluquero requerido' }),
  observacion: z.any().optional(),
});

const EditarServicioEsteticaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [peluqueros, setPeluqueros] = useState([]);
  const [observacion, setObservacion] = useState({});
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('observacion', observacion);
  }, [observacion, setValue]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [servRes, tiposRes, catsRes, trabajadoresRes] = await Promise.all([
        getServicioEstetica(id),
        getTiposEstetica(),
        getCategorias({ tipo: 'estetica' }),
        getTrabajadores(),
      ]);

      const servicio = servRes.data;
      setTipos(tiposRes.data);
      setCategorias(catsRes.data);
      setObservacion(servicio.observacion || {});

      const peluquerosFiltrados = trabajadoresRes.data.filter(t => t.cargo?.nombre === 'Peluquero Canino');
      setPeluqueros(peluquerosFiltrados);

      const tipo = tiposRes.data.find(t => t.id === servicio.tipoId);
      if (tipo) {
        setCategoriaSeleccionada(tipo.categoriaId);
        const filtrados = tiposRes.data.filter(t => t.categoriaId === tipo.categoriaId);
        setServiciosFiltrados(filtrados);
      }

      reset({
        tipoId: servicio.tipoId,
        trabajadorId: servicio.trabajadorId || '',
      });
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaChange = (e) => {
    const catId = e.target.value;
    setCategoriaSeleccionada(catId);
    if (catId) {
      const filtrados = tipos.filter(t => t.categoriaId === parseInt(catId));
      setServiciosFiltrados(filtrados);
    } else {
      setServiciosFiltrados([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await updateServicioEstetica(id, { ...data, observacion });
      toast.success('Servicio de estética actualizado');
      navigate(`/estetica/${id}`);
    } catch (error) {
      toast.error('Error al actualizar servicio');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Servicio de Estética</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <button type="button" onClick={() => navigate(`/estetica/${id}`)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
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

export default EditarServicioEsteticaPage;