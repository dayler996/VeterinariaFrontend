import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTrabajador, updateTrabajador } from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import ImageUploader from '../../components/common/ImageUploader';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  UserCog, User, CreditCard, Cake, Briefcase, Camera,
  Check, X, AlertTriangle, Heart, Building2,
  Users as UsersIcon, Power, CheckCircle2, Shield,
} from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string().min(1, 'Cédula requerida').regex(/^\d+$/, 'Solo números').max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

const EditarTrabajadorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cedulaDisplay, setCedulaDisplay] = useState('');

  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const foto = watch('foto');
  const activoWatch = watch('activo');

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const [trabajadorRes, cargosRes] = await Promise.all([
        getTrabajador(id),
        getCargos(),
      ]);
      const t = trabajadorRes.data;
      setTrabajador(t);
      reset({
        nombre: t.nombre,
        cedula: t.cedula,
        sexo: t.sexo,
        fechaNacimiento: t.fechaNacimiento
          ? new Date(t.fechaNacimiento).toISOString().split('T')[0]
          : '',
        cargoId: t.cargoId,
        foto: t.foto || '',
        activo: t.activo,
      });
      setCedulaDisplay(t.cedula || '');
      setCargos(cargosRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await updateTrabajador(id, data);
      toast.success('Trabajador actualizado');
      navigate(`/trabajadores/${id}`);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-slate-700 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!trabajador) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Trabajador no encontrado</p>
          <button
            onClick={() => navigate('/trabajadores')}
            className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium"
          >
            ← Volver al personal
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="👨‍⚕️"
        breadcrumbs={[
          { label: 'Personal', to: '/trabajadores' },
          { label: trabajador.nombre, to: `/trabajadores/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Trabajador"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <UserCog className="w-3.5 h-3.5" strokeWidth={2.2} />
            {trabajador.nombre}
            {trabajador.cargo?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                  bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                  <Briefcase className="w-3 h-3" strokeWidth={2.5} />
                  {trabajador.cargo.nombre}
                </span>
              </>
            )}
            {!trabajador.activo && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                  bg-slate-200 text-slate-600 text-[11px] font-semibold">
                  <Power className="w-3 h-3" strokeWidth={2.5} />
                  Inactivo
                </span>
              </>
            )}
          </span>
        }
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-700/25 shrink-0">
          <UserCog className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Editando trabajador
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {trabajador.nombre}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <CreditCard className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            CI: {trabajador.cedula}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Datos personales ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <User className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Datos personales
            </h2>
          </div>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nombre')}
                placeholder="Ej: Juan Pérez"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                  ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.nombre && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.nombre.message}
                </p>
              )}
            </div>

            {/* Cédula */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                Cédula <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cedulaDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (raw.length <= 10) {
                    setCedulaDisplay(raw);
                    setValue('cedula', raw, { shouldValidate: true });
                  }
                }}
                placeholder="12345678"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                  ${errors.cedula ? 'border-red-400' : 'border-slate-300'}`}
              />
              <input type="hidden" {...register('cedula')} />
              {errors.cedula && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.cedula.message}
                </p>
              )}
              {!errors.cedula && cedulaDisplay && (
                <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                  {cedulaDisplay.length}/10 dígitos
                </p>
              )}
            </div>

            {/* Sexo + Fecha nacimiento (grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sexo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                  Sexo <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('sexo')}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                    ${errors.sexo ? 'border-red-400' : 'border-slate-300'}`}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {errors.sexo && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                    {errors.sexo.message}
                  </p>
                )}
              </div>

              {/* Fecha nacimiento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Cake className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                  Fecha de nacimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('fechaNacimiento')}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                    ${errors.fechaNacimiento ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errors.fechaNacimiento && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                    {errors.fechaNacimiento.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Card: Rol laboral ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Briefcase className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Rol laboral
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
              Cargo <span className="text-red-500">*</span>
            </label>
            <select
              {...register('cargoId', { valueAsNumber: true })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                ${errors.cargoId ? 'border-red-400' : 'border-slate-300'}`}
            >
              <option value="">Seleccione un cargo</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.cargoId && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errors.cargoId.message}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
              El cargo define los permisos y roles disponibles para este trabajador
            </p>
          </div>
        </section>

        {/* ═══ Card: Foto ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Camera className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Foto del trabajador
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            Sube una foto de perfil para identificar al trabajador en el sistema
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <ImageUploader
              value={foto}
              onChange={(url) => setValue('foto', url)}
              folder="trabajador"
              label="Foto del trabajador"
            />
          </div>
        </section>

        {/* ═══ Card: Estado ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Power className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Estado del trabajador
            </h2>
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer
                            hover:bg-slate-100 transition select-none">
            <input
              type="checkbox"
              {...register('activo')}
              id="activo"
              className="w-4 h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-500"
            />
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-slate-700">
                Trabajador activo
              </span>
              <span className="block text-[11px] text-slate-500">
                Los trabajadores inactivos no aparecen en listados operativos
              </span>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                          text-[10px] font-bold uppercase tracking-wide transition
                ${activoWatch
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-600'}`}
            >
              {activoWatch ? (
                <>
                  <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                  Activo
                </>
              ) : (
                <>
                  <Power className="w-3 h-3" strokeWidth={2.5} />
                  Inactivo
                </>
              )}
            </span>
          </label>
        </section>

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate(`/trabajadores/${id}`)}
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
                       px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium
                       hover:bg-slate-900 active:bg-black transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-slate-800/20"
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

export default EditarTrabajadorPage;