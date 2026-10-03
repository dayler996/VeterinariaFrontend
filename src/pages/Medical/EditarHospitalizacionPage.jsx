import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getHospitalizacion, updateHospitalizacion } from '../../services/hospitalizacionService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getConsultas, getConsulta } from '../../services/consultaService';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';

const schema = z.object({
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  motivo: z.string().min(1, 'Motivo requerido'),
  detallesIngreso: z.any().optional(),
  consultaId: z.number().optional().nullable(),
  fechaAlta: z.string().optional(),
  notasAlta: z.any().optional(),
});

const EditarHospitalizacionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hospitalizacion, setHospitalizacion] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [detallesIngreso, setDetallesIngreso] = useState({});
  const [notasAlta, setNotasAlta] = useState({});
  const [loading, setLoading] = useState(true);
  const [consultasLoading, setConsultasLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const fechaAlta = watch('fechaAlta');

  useEffect(() => {
    setValue('detallesIngreso', detallesIngreso);
  }, [detallesIngreso, setValue]);

  useEffect(() => {
    setValue('notasAlta', notasAlta);
  }, [notasAlta, setValue]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const hospRes = await getHospitalizacion(id);
      const hosp = hospRes.data;
      setHospitalizacion(hosp);
      setDetallesIngreso(hosp.detallesIngreso || {});
      setNotasAlta(hosp.notasAlta || {});

      // Cargar doctores
      const doctoresRes = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = doctoresRes.data.filter(t => cargosPermitidos.includes(t.cargo?.nombre));
      setDoctores(doctoresFiltrados);

      // Cargar consultas de la mascota sin hospitalización (o la actual)
      await cargarConsultas(hosp.mascotaId, hosp.consultaId);

      reset({
        doctorId: hosp.doctorId,
        motivo: hosp.motivo,
        consultaId: hosp.consultaId ?? null, // 👈 asegura null en lugar de ''
        fechaAlta: hosp.fechaAlta ? new Date(hosp.fechaAlta).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      toast.error('Error al cargar la hospitalización');
    } finally {
      setLoading(false);
    }
  };

  const cargarConsultas = async (mascotaId, consultaActualId) => {
    setConsultasLoading(true);
    try {
      const res = await getConsultas({ mascotaId, sinHospitalizacion: true });
      let disponibles = res.data;
      // Si hay una consulta actual y no está en la lista, la agregamos
      if (consultaActualId) {
        const existe = disponibles.some(c => c.id === consultaActualId);
        if (!existe) {
          const consultaActualRes = await getConsulta(consultaActualId);
          disponibles = [consultaActualRes.data, ...disponibles];
        }
      }
      setConsultas(disponibles);
    } catch (error) {
      console.error('Error cargando consultas:', error);
      toast.error('Error al cargar consultas');
    } finally {
      setConsultasLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateHospitalizacion(id, {
        ...data,
        detallesIngreso,
        notasAlta,
        fechaAlta: data.fechaAlta || null,
      });
      toast.success('Hospitalización actualizada');
      navigate(`/hospitalizaciones/${id}`);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!hospitalizacion) return <div className="text-center p-4">Hospitalización no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Hospitalización</h1>

      <div className="p-3 bg-blue-50 rounded mb-4">
        <p className="text-sm">
          <span className="font-semibold">Mascota:</span> {hospitalizacion.mascota?.nombre} (Dueño: {hospitalizacion.mascota?.dueno?.nombre})
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Doctor */}
        <div>
          <label className="block text-sm font-medium">Doctor responsable</label>
          <select {...register('doctorId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
            <option value="">Seleccione un doctor</option>
            {doctores.map(d => (
              <option key={d.id} value={d.id}>{d.nombre} ({d.cargo?.nombre})</option>
            ))}
          </select>
          {errors.doctorId && <p className="text-red-600 text-sm">{errors.doctorId.message}</p>}
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium">Motivo</label>
          <textarea {...register('motivo')} rows="3" className="mt-1 block w-full border rounded p-2" />
          {errors.motivo && <p className="text-red-600 text-sm">{errors.motivo.message}</p>}
        </div>

        {/* Detalles de ingreso */}
        <div>
          <label className="block text-sm font-medium mb-1">Detalles de ingreso (pares clave-valor)</label>
          <JsonBuilder value={detallesIngreso} onChange={setDetallesIngreso} />
        </div>

        {/* Consulta asociada (opcional) */}
        <div>
          <label className="block text-sm font-medium">Consulta asociada (opcional)</label>
          <select
            {...register('consultaId', { 
              setValueAs: (v) => v === "" ? null : parseInt(v, 10) // 👈 convierte "" a null
            })}
            disabled={consultasLoading || !!hospitalizacion.fechaAlta}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Ninguna</option>
            {consultas.map(c => (
              <option key={c.id} value={c.id}>
                {new Date(c.fecha).toLocaleDateString()} - {c.motivo}
              </option>
            ))}
          </select>
          {hospitalizacion.fechaAlta && (
            <p className="text-sm text-gray-500 mt-1">No se puede cambiar la consulta porque la hospitalización ya fue dada de alta.</p>
          )}
        </div>

        {/* Fecha de alta */}
        <div>
          <label className="block text-sm font-medium">Fecha de alta</label>
          <input
            type="date"
            {...register('fechaAlta')}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Notas de alta */}
        <div>
          <label className="block text-sm font-medium mb-1">Notas de alta (pares clave-valor)</label>
          <JsonBuilder value={notasAlta} onChange={setNotasAlta} />
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/hospitalizaciones/${id}`)}
            className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarHospitalizacionPage;