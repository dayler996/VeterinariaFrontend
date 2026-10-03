import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getOperacion, updateOperacion } from '../../services/operacionService';
import { getTiposOperacion } from '../../services/crudCatalogoService';
import { getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de operación requerido' }),
  cirujanoId: z.number({ required_error: 'Cirujano requerido' }),
  notas: z.any().optional(),
});

const EditarOperacionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cirujanos, setCirujanos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [operacionesFiltradas, setOperacionesFiltradas] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('notas', notas);
  }, [notas, setValue]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [opRes, tiposRes, catsRes, trabajadoresRes] = await Promise.all([
        getOperacion(id),
        getTiposOperacion(),
        getCategorias({ tipo: 'operacion' }), 
        getTrabajadores()
      ]);
      const operacion = opRes.data;
      setTipos(tiposRes.data);
      setCategorias(catsRes.data);
      setNotas(operacion.notas || {});

      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const cirujanosFiltrados = trabajadoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setCirujanos(cirujanosFiltrados);

      const tipo = tiposRes.data.find(t => t.id === operacion.tipoId);
      if (tipo) {
        setCategoriaSeleccionada(tipo.categoriaId);
        const filtrados = tiposRes.data.filter(t => t.categoriaId === tipo.categoriaId);
        setOperacionesFiltradas(filtrados);
      }

      reset({
        tipoId: operacion.tipoId,
        cirujanoId: operacion.cirujanoId,
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
      setOperacionesFiltradas(filtrados);
    } else {
      setOperacionesFiltradas([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await updateOperacion(id, { ...data, notas });
      toast.success('Operación actualizada');
      navigate(`/operaciones/${id}`);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Operación</h1>
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
          <label className="block text-sm font-medium">Tipo de Operación</label>
          <select
            {...register('tipoId', { valueAsNumber: true })}
            disabled={!categoriaSeleccionada}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Seleccione una operación</option>
            {operacionesFiltradas.map(op => (
              <option key={op.id} value={op.id}>{op.nombre}</option>
            ))}
          </select>
          {errors.tipoId && <p className="text-red-600 text-sm">{errors.tipoId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Cirujano</label>
          <select {...register('cirujanoId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
            <option value="">Seleccione</option>
            {cirujanos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.cargo?.nombre})</option>
            ))}
          </select>
          {errors.cirujanoId && <p className="text-red-600 text-sm">{errors.cirujanoId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notas quirúrgicas (pares clave-valor)</label>
          <JsonBuilder value={notas} onChange={setNotas} />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => navigate(`/operaciones/${id}`)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
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

export default EditarOperacionPage;