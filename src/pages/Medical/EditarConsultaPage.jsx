import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getConsulta, updateConsulta } from '../../services/consultaService';
import { getTrabajadores } from '../../services/trabajadorService';
import ImageUploader from '../../components/common/ImageUploader';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Stethoscope, FileText, Pill, ListChecks, User,
  Check, X, AlertTriangle, Heart, Users as UsersIcon,
  Calendar, Image as ImageIcon, ClipboardList,
} from 'lucide-react';

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

  const {
    register, handleSubmit, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { setValue('diagnostico', diagnostico); }, [diagnostico, setValue]);
  useEffect(() => { setValue('recetaDetalle', recetaDetalle); }, [recetaDetalle, setValue]);
  useEffect(() => { setValue('fotoReceta', fotoReceta); }, [fotoReceta, setValue]);
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const [consultaRes, doctoresRes] = await Promise.all([
        getConsulta(id),
        getTrabajadores(),
      ]);
      const c = consultaRes.data;
      setConsulta(c);
      setDiagnostico(c.diagnostico || {});
      setRecetaDetalle(c.recetaDetalle || {});
      setFotoReceta(c.fotoReceta || '');

      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(
        doctoresRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre))
      );

      reset({ doctorId: c.doctorId, motivo: c.motivo });
    } catch {
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
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Consulta no encontrada</p>
        </div>
      </div>
    );
  }

  const diagnosticoCount = Object.keys(diagnostico || {}).length;
  const recetaCount = Object.keys(recetaDetalle || {}).length;
  const fechaConsulta = new Date(consulta.fecha);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="🩺"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: consulta.mascota?.dueno?.nombre, to: `/clientes/${consulta.mascota?.dueno?.id}` },
          { label: consulta.mascota?.nombre, to: `/mascotas/${consulta.mascotaId}` },
          { label: 'Consulta', to: `/consultas/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Consulta"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
            {consulta.mascota?.nombre}
            <span className="text-slate-300">·</span>
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {fechaConsulta.toLocaleString()}
          </span>
        }
      />

      {/* ═══ Banner info consulta ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
          <Stethoscope className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Editando consulta
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {consulta.mascota?.nombre || 'Mascota sin nombre'}
          </p>
          <div className="flex items-center gap-2 text-xs text-blue-700 mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
              <span className="truncate">
                Dueño: {consulta.mascota?.dueno?.nombre || '—'}
              </span>
            </span>
            <span className="text-blue-300">·</span>
            <span className="tabular-nums">
              {fechaConsulta.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Datos principales ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Datos principales
            </h2>
          </div>

          <div className="space-y-4">
            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
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

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.2} />
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('motivo')}
                rows="3"
                placeholder="Describe el motivo de la consulta..."
                className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
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

        {/* ═══ Card: Diagnóstico ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              <FileText className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Diagnóstico
              </h2>
            </div>
            {diagnosticoCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-blue-100 text-blue-700 text-[11px] font-semibold tabular-nums">
                {diagnosticoCount} {diagnosticoCount === 1 ? 'valor' : 'valores'}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            Pares clave-valor: hallazgos, síntomas, conclusión diagnóstica, etc.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <JsonBuilder value={diagnostico} onChange={setDiagnostico} />
          </div>
        </section>

        {/* ═══ Card: Receta ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              <Pill className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Receta
              </h2>
            </div>
            {recetaCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-blue-100 text-blue-700 text-[11px] font-semibold tabular-nums">
                {recetaCount} {recetaCount === 1 ? 'medicamento' : 'medicamentos'}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            Pares clave-valor: medicamento, dosis, frecuencia, duración, etc.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <JsonBuilder value={recetaDetalle} onChange={setRecetaDetalle} />
          </div>
        </section>

        {/* ═══ Card: Foto de la receta ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Foto de la receta
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            Adjunta una imagen de la receta física si aplica.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <ImageUploader
              value={fotoReceta}
              onChange={setFotoReceta}
              folder="receta"
              label="Foto de la receta"
            />
          </div>
        </section>

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate(`/consultas/${id}`)}
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
                       px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                       hover:bg-blue-700 active:bg-blue-800 transition
                       disabled:opacity-50 disabled:cursor-not-allowed
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
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarConsultaPage;