import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getVacunacion, updateVacunacion } from '../../services/vacunacionService';
import { getVacunas } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascota } from '../../services/mascotaService';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Syringe, ShieldCheck, Stethoscope, FileText, ListChecks,
  Check, X, AlertTriangle, Heart, Users as UsersIcon,
  CalendarClock, User, Dog, Calendar,
} from 'lucide-react';

const schema = z.object({
  vacunaId: z.number({ required_error: 'Vacuna requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  proximoRefuerzo: z.string().optional(),
  detalles: z.any().optional(),
  observacion: z.string().optional(),
});

const EditarVacunacionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacunacion, setVacunacion] = useState(null);
  const [mascota, setMascota] = useState(null);
  const [vacunas, setVacunas] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loading, setLoading] = useState(true);

  const {
    register, handleSubmit, setValue, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const proximoRefuerzo = watch('proximoRefuerzo');

  useEffect(() => { setValue('detalles', detalles); }, [detalles, setValue]);
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const vacRes = await getVacunacion(id);
      const vac = vacRes.data;
      setVacunacion(vac);
      setDetalles(vac.detalles || {});

      const mascRes = await getMascota(vac.mascotaId);
      const masc = mascRes.data;
      setMascota(masc);

      const [vacunasRes, doctoresRes] = await Promise.all([
        getVacunas({ especieId: masc.especieId }),
        getTrabajadores(),
      ]);
      setVacunas(vacunasRes.data);
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(
        doctoresRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre))
      );

      reset({
        vacunaId: vac.vacunaId,
        doctorId: vac.doctorId,
        proximoRefuerzo: vac.proximoRefuerzo ? vac.proximoRefuerzo.split('T')[0] : '',
        observacion: vac.observacion || '',
      });
    } catch {
      toast.error('Error al cargar la vacunación');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateVacunacion(id, { ...data, detalles });
      toast.success('Vacunación actualizada');
      navigate(`/vacunaciones/${id}`);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-emerald-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!vacunacion || !mascota) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Vacunación no encontrada</p>
        </div>
      </div>
    );
  }

  const detallesCount = Object.keys(detalles || {}).length;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="💉"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: mascota.dueno?.nombre, to: `/clientes/${mascota.dueno?.id}` },
          { label: mascota.nombre, to: `/mascotas/${mascota.id}` },
          { label: 'Vacunación', to: `/vacunaciones/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Vacunación"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
            {mascota.nombre}
            {vacunacion.vacuna?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  <Syringe className="w-3 h-3" strokeWidth={2.5} />
                  {vacunacion.vacuna.nombre}
                </span>
              </>
            )}
          </span>
        }
      />

      {/* ═══ Banner info mascota ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Editando vacunación
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {mascota.nombre}
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-700 mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
              <span className="truncate">Dueño: {mascota.dueno?.nombre || '—'}</span>
            </span>
            {mascota.especie?.nombre && (
              <>
                <span className="text-emerald-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <Dog className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  <span>{mascota.especie.nombre}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Vacuna y doctor ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <Syringe className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Datos de la vacunación
            </h2>
          </div>

          <div className="space-y-4">
            {/* Vacuna */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.2} />
                Vacuna <span className="text-red-500">*</span>
              </label>
              <select
                {...register('vacunaId', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                  ${errors.vacunaId ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">Seleccione una vacuna</option>
                {vacunas.map((v) => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
              {errors.vacunaId && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.vacunaId.message}
                </p>
              )}
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.2} />
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                {...register('doctorId', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
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
          </div>
        </section>

        {/* ═══ Card: Próximo refuerzo ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <CalendarClock className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Próximo refuerzo
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Fecha en la que el paciente debe volver para el refuerzo
          </label>
          <input
            type="date"
            {...register('proximoRefuerzo')}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {proximoRefuerzo && (
            <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-emerald-50 border border-emerald-100">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-[11px] text-emerald-700">
                El refuerzo está programado para{' '}
                <span className="font-semibold">
                  {new Date(proximoRefuerzo + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          )}
        </section>

        {/* ═══ Card: Detalles adicionales ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
              <ListChecks className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Detalles adicionales
              </h2>
            </div>
            {detallesCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-emerald-100 text-emerald-700 text-[11px] font-semibold tabular-nums">
                {detallesCount} {detallesCount === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            Pares clave-valor: lote, dosis, vía de administración, reacciones, etc.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <JsonBuilder value={detalles} onChange={setDetalles} />
          </div>
        </section>

        {/* ═══ Card: Observación ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Observación
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <textarea
            {...register('observacion')}
            rows="3"
            placeholder="Notas sobre la aplicación, reacciones observadas, indicaciones para el dueño..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                       resize-none"
          />
        </section>

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate(`/vacunaciones/${id}`)}
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
                       px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium
                       hover:bg-emerald-700 active:bg-emerald-800 transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-emerald-600/20"
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

export default EditarVacunacionPage;