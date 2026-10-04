import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import {
  Heart, Stethoscope, Clock, FileText, Activity,
  AlertTriangle, Check, X, Trash2,
  Users as UsersIcon, Calendar,
} from 'lucide-react';

const schema = z.object({
  mascotaId: z.number({ required_error: 'Mascota requerida' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
  fechaHora: z.string().min(1, 'Fecha y hora requerida'),
  motivo: z.string().optional(),
  estadoCitaId: z.number().default(1),
});

const CitaForm = ({ initialData, onSave, onCancel, onDelete, doctores, mascotas, estados }) => {
  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          ...initialData,
          fechaHora: initialData.fechaHora
            ? new Date(initialData.fechaHora).toISOString().slice(0, 16)
            : '',
        }
      : { estadoCitaId: 1 },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        fechaHora: initialData.fechaHora
          ? new Date(initialData.fechaHora).toISOString().slice(0, 16)
          : '',
      });
    }
  }, [initialData, reset]);

  const fechaHoraWatch = watch('fechaHora');

  const onSubmit = (data) => {
    onSave({
      ...data,
      mascotaId: Number(data.mascotaId),
      doctorId: Number(data.doctorId),
      estadoCitaId: Number(data.estadoCitaId),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* ═══ Mascota ═══ */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
          Mascota <span className="text-red-500">*</span>
        </label>
        <select
          {...register('mascotaId', { valueAsNumber: true })}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${errors.mascotaId ? 'border-red-400' : 'border-slate-300'}`}
        >
          <option value="">Seleccione una mascota</option>
          {mascotas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} ({m.dueno?.nombre})
            </option>
          ))}
        </select>
        {errors.mascotaId && (
          <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
            {errors.mascotaId.message}
          </p>
        )}
      </div>

      {/* ═══ Doctor ═══ */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
          Doctor <span className="text-red-500">*</span>
        </label>
        <select
          {...register('doctorId', { valueAsNumber: true })}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${errors.doctorId ? 'border-red-400' : 'border-slate-300'}`}
        >
          <option value="">Seleccione un doctor</option>
          {doctores.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre} {d.cargo?.nombre ? `(${d.cargo.nombre})` : ''}
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

      {/* ═══ Fecha y hora ═══ */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
          Fecha y hora <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          {...register('fechaHora')}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${errors.fechaHora ? 'border-red-400' : 'border-slate-300'}`}
        />
        {errors.fechaHora && (
          <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
            {errors.fechaHora.message}
          </p>
        )}
        {fechaHoraWatch && !errors.fechaHora && (
          <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-blue-50 border border-blue-100">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[11px] text-blue-700">
              <span className="font-semibold">
                {new Date(fechaHoraWatch).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>{' '}
              a las{' '}
              <span className="font-semibold tabular-nums">
                {new Date(fechaHoraWatch).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ═══ Motivo ═══ */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
          Motivo
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        </label>
        <textarea
          {...register('motivo')}
          rows="3"
          placeholder="Motivo de la cita..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* ═══ Estado ═══ */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
          Estado
        </label>
        <select
          {...register('estadoCitaId', { valueAsNumber: true })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {estados.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      {/* ═══ Botones ═══ */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5
                       px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium
                       hover:bg-red-700 active:bg-red-800 transition
                       order-3 sm:order-1 sm:mr-auto disabled:opacity-50
                       shadow-sm shadow-red-600/20"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.2} />
            Eliminar
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2
                     px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                     hover:bg-slate-200 active:bg-slate-300 transition
                     order-2 sm:order-2 disabled:opacity-50"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2
                     px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                     hover:bg-blue-700 active:bg-blue-800 transition
                     order-1 sm:order-3 disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-sm shadow-blue-600/20"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={2.5} />
              Guardar
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CitaForm;