import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getEstudio, updateEstudio } from '../../services/estudioService';
import { getTiposEstudio } from '../../services/crudCatalogoService';
import { getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import JsonBuilder from '../../components/common/JsonBuilder';
import MultiImageUploader from '../../components/common/MultiImageUploader';
import toast from 'react-hot-toast';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de estudio requerido' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
});

const EditarEstudioPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [estudiosFiltrados, setEstudiosFiltrados] = useState([]);
  const [resultado, setResultado] = useState({});
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setValue('resultado', resultado);
  }, [resultado, setValue]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [estudioRes, tiposRes, catsRes, trabajadoresRes] = await Promise.all([
        getEstudio(id),
        getTiposEstudio(),
        getCategorias({ tipo: 'estudio' }),
        getTrabajadores()
      ]);
      const estudio = estudioRes.data;
      setTipos(tiposRes.data);
      setCategorias(catsRes.data);
      setResultado(estudio.resultado || {});
      setImagenes(estudio.imagenes?.map(img => img.url) || []);

      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = trabajadoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(doctoresFiltrados);

      const tipo = tiposRes.data.find(t => t.id === estudio.tipoId);
      if (tipo) {
        setCategoriaSeleccionada(tipo.categoriaId);
        const filtrados = tiposRes.data.filter(t => t.categoriaId === tipo.categoriaId);
        setEstudiosFiltrados(filtrados);
      }

      reset({
        tipoId: estudio.tipoId,
        doctorId: estudio.doctorId,
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
      setEstudiosFiltrados(filtrados);
    } else {
      setEstudiosFiltrados([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await updateEstudio(id, { ...data, resultado, imagenes });
      toast.success('Estudio actualizado');
      navigate(`/estudios/${id}`);
    } catch (error) {
      toast.error('Error al actualizar estudio');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Estudio</h1>
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
          label="Imágenes adicionales"
        />

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => navigate(`/estudios/${id}`)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
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

export default EditarEstudioPage;