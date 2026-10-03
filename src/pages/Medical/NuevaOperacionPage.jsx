import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createOperacion } from '../../services/operacionService';
import { getTiposOperacion } from '../../services/crudCatalogoService';
import { getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import ClienteSearch from '../../components/common/ClienteSearch';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de operación requerido' }),
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  cirujanoId: z.number({ required_error: 'Cirujano requerido' }),
  notas: z.any().optional(),
});

const NuevaOperacionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mascotaIdParam = searchParams.get('mascotaId');

  const [categorias, setCategorias] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [operacionesFiltradas, setOperacionesFiltradas] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [cirujanos, setCirujanos] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('notas', notas);
  }, [notas, setValue]);

  useEffect(() => {
    loadData();
    if (mascotaIdParam) {
      cargarMascotaDesdeParam();
    }
  }, [mascotaIdParam]);

  const loadData = async () => {
    try {
      const [opsRes, catsRes, cirujanosRes] = await Promise.all([
        getTiposOperacion(),
        getCategorias({ tipo: 'operacion' }),
        getTrabajadores() // solo activos
      ]);
      setOperaciones(opsRes.data);
      setCategorias(catsRes.data);
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const cirujanosFiltrados = cirujanosRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setCirujanos(cirujanosFiltrados);
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
      const filtrados = operaciones.filter(op => op.categoriaId === parseInt(catId));
      setOperacionesFiltradas(filtrados);
    } else {
      setOperacionesFiltradas([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await createOperacion(data);
      toast.success('Operación creada');
      navigate(`/mascotas/${data.mascotaId}`);
    } catch (error) {
      toast.error('Error al crear operación');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nueva Operación</h1>
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

export default NuevaOperacionPage;