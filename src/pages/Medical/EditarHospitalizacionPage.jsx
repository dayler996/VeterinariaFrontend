import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getHospitalizacion, updateHospitalizacion } from '../../services/hospitalizacionService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getConsultas, getConsulta } from '../../services/consultaService';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  BedDouble, Stethoscope, FileText, ClipboardList,
  Activity, Link2, CalendarCheck, AlertTriangle,
  Check, X, Heart, Users as UsersIcon, LogOut,
  Pencil,
} from 'lucide-react';

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

  const {
    register, handleSubmit, setValue, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const fechaAlta = watch('fechaAlta');

  useEffect(() => { setValue('detallesIngreso', detallesIngreso); }, [detallesIngreso, setValue]);
  useEffect(() => { setValue('notasAlta', notasAlta); }, [notasAlta, setValue]);
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const hospRes = await getHospitalizacion(id);
      const hosp = hospRes.data;
      setHospitalizacion(hosp);
      setDetallesIngreso(hosp.detallesIngreso || {});
      setNotasAlta(hosp.notasAlta || {});

      const doctoresRes = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(doctoresRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre)));

      await cargarConsultas(hosp.mascotaId, hosp.consultaId);

      reset({
        doctorId: hosp.doctorId,
        motivo: hosp.motivo,
        consultaId: hosp.consultaId ?? null,
        fechaAlta: hosp.fechaAlta ? new Date(hosp.fechaAlta).toISOString().split('T')[0] : '',
      });
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarConsultas = async (mascotaId, consultaActualId) => {
    setConsultasLoading(true);
    try {
      const res = await getConsultas({ mascotaId, sinHospitalizacion: true });
      let disponibles = res.data;
      if (consultaActualId) {
        const existe = disponibles.some((c) => c.id === consultaActualId);
        if (!existe) {
          const consultaActualRes = await getConsulta(consultaActualId);
          disponibles = [consultaActualRes.data, ...disponibles];
        }
      }
      setConsultas(disponibles);
    } catch (error) {
      console.error('Error cargando consultas:', error);
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
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-indigo-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!hospitalizacion) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Hospitalización no encontrada</p>
        </div>
      </div>
    );
  }

  const yaTieneAlta = !!hospitalizacion.fechaAlta;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="🏥"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: hospitalizacion.mascota?.dueno?.nombre, to: `/clientes/${hospitalizacion.mascota?.dueno?.id}` },
          { label: hospitalizacion.mascota?.nombre, to: `/mascotas/${hospitalizacion.mascotaId}` },
          { label: 'Hospitalización', to: `/hospitalizaciones/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Hospitalización"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <BedDouble className="w-3.5 h-3.5" strokeWidth={2.2} />
            {hospitalizacion.mascota?.nombre} · Ingreso: {new Date(hospitalizacion.fechaIngreso).toLocaleString()}
          </span>
        }
      />

      {/* ═══ Banner info mascota ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
          <Heart className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
            Editando hospitalización
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {hospitalizacion.mascota?.nombre}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 mt-0.5">
            <UsersIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            <span className="truncate">Dueño: {hospitalizacion.mascota?.dueno?.nombre || '—'}</span>
          </div>
        </div>
        {yaTieneAlta && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                            bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
            <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
            Ya tiene alta
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Doctor y motivo ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Datos principales
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Doctor responsable <span className="text-red-500">*</span>
              </label>
              <select
                {...register('doctorId', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  ${errors.doctorId ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">Seleccione un doctor</option>
                {doctores.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.cargo?.nombre})
                  </option>
                ))}
              </select>
              {errors.doctorId && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.doctorId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('motivo')}
                rows="3"
                placeholder="Describe el motivo de la hospitalización..."
                className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  ${errors.motivo ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.motivo && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.motivo.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ═══ Card: Detalles de ingreso ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Activity className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Detalles de ingreso
            </h2>
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            Pares clave-valor: peso, temperatura, condición, etc.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <JsonBuilder value={detallesIngreso} onChange={setDetallesIngreso} />
          </div>
        </section>

        {/* ═══ Card: Consulta asociada ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Link2 className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Consulta asociada
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <select
            {...register('consultaId', {
              setValueAs: (v) => (v === '' ? null : parseInt(v, 10)),
            })}
            disabled={consultasLoading || yaTieneAlta}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50
              ${yaTieneAlta ? 'border-slate-200' : 'border-slate-300'}`}
          >
            <option value="">
              {consultasLoading ? 'Cargando consultas...' : 'Ninguna'}
            </option>
            {consultas.map((c) => (
              <option key={c.id} value={c.id}>
                {new Date(c.fecha).toLocaleDateString()} - {c.motivo}
              </option>
            ))}
          </select>

          {yaTieneAlta && (
            <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-[11px] text-amber-700">
                No se puede cambiar la consulta porque ya fue dada de alta.
              </p>
            </div>
          )}
        </section>

        {/* ═══ Card: Alta ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <CalendarCheck className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Alta
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Fecha de alta
              </label>
              <input
                type="date"
                {...register('fechaAlta')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {fechaAlta && (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  La hospitalización quedará marcada como finalizada
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notas de alta
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <JsonBuilder value={notasAlta} onChange={setNotasAlta} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate(`/hospitalizaciones/${id}`)}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                       hover:bg-slate-200 active:bg-slate-300 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium
                       hover:bg-indigo-700 active:bg-indigo-800 transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-indigo-600/20"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={2.5} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarHospitalizacionPage;