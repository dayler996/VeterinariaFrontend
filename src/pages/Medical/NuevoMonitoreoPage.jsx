import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createMonitoreo } from '../../services/monitoreoService';
import { getTrabajadores } from '../../services/trabajadorService';
import { useAuth } from '../../context/AuthContext';
import JsonBuilder from '../../components/common/JsonBuilder';
import toast from 'react-hot-toast';
import {
  Activity, Stethoscope, FileText, ListChecks,
  Check, X, AlertTriangle, ArrowLeft, Heart,
} from 'lucide-react';

const schema = z.object({
  hospitalizacionId: z.number({ required_error: 'Hospitalización requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  detalles: z.any().optional(),
  observaciones: z.string().optional(),
});

const NuevoMonitoreoPage = () => {
  const { id } = useParams(); // id de la hospitalización
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctores, setDoctores] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loadingDoctores, setLoadingDoctores] = useState(true);

  const {
    register, handleSubmit, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      hospitalizacionId: parseInt(id),
      doctorId: user?.trabajador?.id || '',
    },
  });

  useEffect(() => {
    setValue('detalles', detalles);
  }, [detalles, setValue]);

  useEffect(() => {
    loadDoctores();
    setValue('hospitalizacionId', parseInt(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDoctores = async () => {
    try {
      setLoadingDoctores(true);
      const res = await getTrabajadores();
      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      const doctoresFiltrados = res.data.filter((t) =>
        cargosPermitidos.includes(t.cargo?.nombre)
      );
      setDoctores(doctoresFiltrados);
    } catch (error) {
      toast.error('Error al cargar doctores');
    } finally {
      setLoadingDoctores(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await createMonitoreo({ ...data, detalles });
      toast.success('Monitoreo registrado');
      navigate(`/hospitalizaciones/${id}`);
    } catch (error) {
      toast.error('Error al registrar monitoreo');
    }
  };

  /* Cuenta de detalles (para el hint) */
  const detallesCount = Object.keys(detalles || {}).length;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      {/* ═══ Header ═══ */}
      <div className="flex items-start gap-3 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-0.5 p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
            <Activity className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Nuevo Monitoreo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Registra los signos y observaciones del paciente
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ═══ Card: Doctor ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Doctor responsable
            </h2>
          </div>

          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Selecciona el doctor que atiende al paciente
          </label>
          <select
            {...register('doctorId', { valueAsNumber: true })}
            disabled={loadingDoctores}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.doctorId ? 'border-red-400' : 'border-slate-300'}`}
          >
            <option value="">
              {loadingDoctores ? 'Cargando doctores...' : 'Seleccione un doctor'}
            </option>
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
        </section>

        {/* ═══ Card: Detalles ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
              <ListChecks className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Signos y detalles
              </h2>
            </div>
            {detallesCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                {detallesCount} {detallesCount === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
            <Heart className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            Agrega los pares clave-valor: temperatura, frecuencia cardíaca, saturación, etc.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <JsonBuilder value={detalles} onChange={setDetalles} />
          </div>
        </section>

        {/* ═══ Card: Observaciones ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Observaciones
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <textarea
            {...register('observaciones')}
            rows="4"
            placeholder="Notas adicionales, evolución del paciente, indicaciones..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                       resize-none"
          />
        </section>

        <input type="hidden" {...register('hospitalizacionId')} />

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                       hover:bg-slate-200 active:bg-slate-300 transition"
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
                Guardar monitoreo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoMonitoreoPage;