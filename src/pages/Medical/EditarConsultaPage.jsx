import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getConsulta, updateConsulta } from '../../services/consultaService';
import { getTrabajadores } from '../../services/trabajadorService';
import ImageUploader from '../../components/common/ImageUploader';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  motivo: z.string().min(1, 'Motivo requerido'),
  diagnostico: z.any().optional(),
  recetaDetalle: z.any().optional(),
  fotoReceta: z.string().optional(),
});

const EditarConsultaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [consulta, setConsulta] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [diagnostico, setDiagnostico] = useState({});
  const [recetaDetalle, setRecetaDetalle] = useState({});
  const [fotoReceta, setFotoReceta] = useState('');
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
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
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [consultaRes, doctoresRes] = await Promise.all([
        getConsulta(id),
        getTrabajadores()
      ]);
      const c = consultaRes.data;
      setConsulta(c);
      setDiagnostico(c.diagnostico || {});
      setRecetaDetalle(c.recetaDetalle || {});
      setFotoReceta(c.fotoReceta || '');

      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = doctoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(doctoresFiltrados);

      reset({
        doctorId: c.doctorId,
        motivo: c.motivo,
      });
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateConsulta(id, { ...data, diagnostico, recetaDetalle, fotoReceta });
      toast.success('Consulta actualizada');
      navigate(`/consultas/${id}`);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!consulta) return <div className="text-center p-4">Consulta no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Consulta</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <button type="button" onClick={() => navigate(`/consultas/${id}`)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
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

export default EditarConsultaPage;