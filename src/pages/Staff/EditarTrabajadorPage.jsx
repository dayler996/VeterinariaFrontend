// frontend/src/pages/Trabajadores/EditarTrabajadorPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTrabajador, updateTrabajador } from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import ImageUploader from '../../components/common/ImageUploader';
import SelectField from '../../components/common/SelectField';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  UserCog, User as UserIcon, CreditCard, Cake, Briefcase, Camera,
  Check, X, AlertTriangle, Heart, Building2,
  Users as UsersIcon, Power, CheckCircle2, Shield,
  Sparkles, XCircle, Info, ArrowRight,
  Mars, Venus, ClipboardList, PawPrint,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  nombre: z
    .string()
    .min(1, 'Nombre requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  cedula: z
    .string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .min(6, 'Mínimo 6 dígitos')
    .max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

/* ═══════════════════════════════════════════════════ */
const EditarTrabajadorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trabajador, setTrabajador] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cedulaDisplay, setCedulaDisplay] = useState('');

  const {
    register, handleSubmit, setValue, watch, reset, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { activo: true, cargoId: null, foto: '' },
  });

  const foto = watch('foto');
  const activoWatch = watch('activo');
  const nombreWatch = watch('nombre');
  const cedulaWatch = watch('cedula');
  const sexoWatch = watch('sexo');
  const fechaNacimientoWatch = watch('fechaNacimiento');
  const cargoIdWatch = watch('cargoId');

  /* ── Carga ── */
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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
    }
  };

  /* ── Estado por campo ── */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (
      touched &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '' &&
      value !== 0
    )
      return 'valid';
    return 'idle';
  };

  /* ── Opciones SelectField ── */
  const cargoOptions = useMemo(
    () =>
      cargos.map((c) => ({
        value: c.id,
        label: c.nombre,
        icon: Briefcase,
      })),
    [cargos]
  );

  const sexoOptions = useMemo(
    () => [
      { value: 'M', label: 'Masculino', icon: Mars },
      { value: 'F', label: 'Femenino', icon: Venus },
    ],
    []
  );

  /* ── Cargo seleccionado (preview) ── */
  const cargoSeleccionado = useMemo(
    () => cargos.find((c) => c.id === Number(cargoIdWatch)),
    [cargos, cargoIdWatch]
  );

  /* ── Progreso (5 campos obligatorios) ── */
  const progreso = useMemo(() => {
    let filled = 0;
    if (nombreWatch?.trim()?.length >= 3) filled++;
    if (cedulaWatch?.length >= 6) filled++;
    if (sexoWatch) filled++;
    if (fechaNacimientoWatch) filled++;
    if (cargoIdWatch) filled++;
    return Math.round((filled / 5) * 100);
  }, [nombreWatch, cedulaWatch, sexoWatch, fechaNacimientoWatch, cargoIdWatch]);

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
          <AlertTriangle
            className="w-10 h-10 text-slate-400 mx-auto mb-3"
            strokeWidth={1.8}
          />
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
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                  bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200"
                >
                  <Briefcase className="w-3 h-3" strokeWidth={2.5} />
                  {trabajador.cargo.nombre}
                </span>
              </>
            )}
          </span>
        }
      />

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/60 via-white to-white overflow-hidden mb-4">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              {trabajador.foto ? (
                <img
                  src={trabajador.foto.startsWith('http') ? trabajador.foto : `/uploads/${trabajador.foto}`}
                  alt={trabajador.nombre}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                                bg-gradient-to-br from-slate-100 to-slate-50
                                border-2 border-white shadow-md
                                flex items-center justify-center"
                >
                  <UserCog
                    className="w-8 h-8 sm:w-9 sm:h-9 text-slate-500"
                    strokeWidth={2}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                Editando trabajador
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {nombreWatch?.trim() || trabajador.nombre}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {cargoSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Briefcase className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {cargoSeleccionado.nombre}
                  </span>
                )}
                {cedulaWatch && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <CreditCard className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    CI: {cedulaWatch}
                  </span>
                )}
                {sexoWatch && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    text-[10px] font-bold uppercase tracking-wide
                      ${sexoWatch === 'M'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-pink-100 text-pink-700'}`}
                  >
                    {sexoWatch === 'M' ? (
                      <Mars className="w-3 h-3" strokeWidth={2.5} />
                    ) : (
                      <Venus className="w-3 h-3" strokeWidth={2.5} />
                    )}
                    {sexoWatch === 'M' ? 'M' : 'F'}
                  </span>
                )}
                {!activoWatch && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wide"
                  >
                    <Power className="w-3 h-3" strokeWidth={2.5} />
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-slate-200/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-slate-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  progreso === 100 ? 'text-emerald-600' : 'text-slate-700'
                }`}
              >
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-slate-400 to-slate-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ═══ Card: Datos personales ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <ClipboardList
              className="w-4 h-4 text-slate-700 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Datos personales
            </h3>
          </div>

          <div className="space-y-4">
            {/* Nombre */}
            <FormField
              icon={UserIcon}
              label="Nombre completo"
              required
              state={fieldState('nombre', nombreWatch)}
              error={errors.nombre?.message}
              hint={`${nombreWatch?.length || 0}/100 caracteres`}
            >
              <input
                autoComplete="off"
                placeholder="Ej: Juan Pérez"
                {...register('nombre')}
                className={inputCls(fieldState('nombre', nombreWatch))}
              />
            </FormField>

            {/* Cédula */}
            <FormField
              icon={CreditCard}
              label="Cédula"
              required
              state={fieldState('cedula', cedulaWatch)}
              error={errors.cedula?.message}
              hint={
                cedulaWatch
                  ? `${cedulaWatch.length}/10 dígitos`
                  : 'Solo números, entre 6 y 10 dígitos'
              }
            >
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cedulaDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (raw.length <= 10) {
                    setCedulaDisplay(raw);
                    setValue('cedula', raw, { shouldValidate: true });
                  }
                }}
                placeholder="12345678"
                className={`${inputCls(
                  fieldState('cedula', cedulaWatch)
                )} tabular-nums`}
              />
              <input type="hidden" {...register('cedula')} />
            </FormField>

            {/* Sexo + Fecha nacimiento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                icon={Heart}
                label="Sexo"
                required
                state={fieldState('sexo', sexoWatch)}
                error={errors.sexo?.message}
                hint={
                  sexoWatch === 'M'
                    ? 'Masculino'
                    : sexoWatch === 'F'
                    ? 'Femenino'
                    : 'Selecciona el sexo'
                }
              >
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      options={sexoOptions}
                      placeholder="Seleccionar..."
                      state={fieldState('sexo', sexoWatch)}
                      tone="slate"
                    />
                  )}
                />
              </FormField>

              <FormField
                icon={Cake}
                label="Fecha de nacimiento"
                required
                state={fieldState('fechaNacimiento', fechaNacimientoWatch)}
                error={errors.fechaNacimiento?.message}
                hint={
                  fechaNacimientoWatch
                    ? new Date(fechaNacimientoWatch).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Selecciona la fecha'
                }
              >
                <input
                  type="date"
                  {...register('fechaNacimiento')}
                  className={inputCls(
                    fieldState('fechaNacimiento', fechaNacimientoWatch)
                  )}
                />
              </FormField>
            </div>
          </div>
        </section>

        {/* ═══ Card: Rol laboral ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Briefcase
              className="w-4 h-4 text-slate-700 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Rol laboral
            </h3>
          </div>

          <FormField
            icon={Building2}
            label="Cargo"
            required
            state={fieldState('cargoId', cargoIdWatch)}
            error={errors.cargoId?.message}
            hint={
              cargoSeleccionado
                ? `Asignado como: ${cargoSeleccionado.nombre}`
                : 'El cargo define los permisos disponibles'
            }
          >
            <Controller
              name="cargoId"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  options={cargoOptions}
                  placeholder="Buscar cargo..."
                  emptyMessage="No hay cargos registrados"
                  state={fieldState('cargoId', cargoIdWatch)}
                  tone="slate"
                />
              )}
            />
          </FormField>
        </section>

        {/* ═══ Card: Foto ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Camera
              className="w-4 h-4 text-slate-700 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Foto del trabajador
            </h3>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">
              Opcional
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Sube una foto de perfil para identificar al trabajador
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <ImageUploader
              value={foto}
              onChange={(url) => setValue('foto', url, { shouldDirty: true })}
              folder="trabajador"
              label="Foto del trabajador"
            />
          </div>
        </section>

        {/* ═══ Card: Estado ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Power
              className="w-4 h-4 text-slate-700 shrink-0"
              strokeWidth={2.2}
            />
            <h3 className="text-base font-semibold text-slate-800">
              Estado del trabajador
            </h3>
          </div>

          <label
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer
                              hover:bg-slate-100 transition select-none"
          >
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

        {/* ═══ Footer sticky ═══ */}
        <div
          className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                        bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                        border-t border-slate-200 sm:border-0
                        flex flex-col sm:flex-row justify-end gap-2 z-10"
        >
          <button
            type="button"
            onClick={() => navigate(`/trabajadores/${id}`)}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                       px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium
                       hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition
                       disabled:opacity-50 order-2 sm:order-1"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                       px-5 py-2.5 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-lg text-sm font-semibold
                       hover:from-slate-800 hover:to-slate-900 active:from-slate-900 active:to-black
                       transition disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md shadow-slate-800/25
                       order-1 sm:order-2"
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
                <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   FormField reutilizable
   ═══════════════════════════════════════════════════ */
const FormField = ({ icon: Icon, label, required, optional, state, error, hint, children }) => {
  const stateCls =
    {
      idle: { bg: 'bg-slate-100', text: 'text-slate-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      hintIcon: Info,
    };

  const HintIcon = stateCls.hintIcon;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors ${stateCls.bg}`}
        >
          <Icon className={`w-3 h-3 ${stateCls.text}`} strokeWidth={2.5} />
        </span>
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="ml-auto text-[11px] text-slate-400 font-normal">
            Opcional
          </span>
        )}
        {state === 'valid' && !optional && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
            Válido
          </span>
        )}
      </label>

      <div className="relative">{children}</div>

      <div className="flex items-center justify-between gap-2 mt-1 min-h-[16px]">
        {error ? (
          <p className="text-red-600 text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {error}
          </p>
        ) : hint ? (
          <p
            className={`text-[11px] flex items-center gap-1 ${
              state === 'valid' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <HintIcon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {hint}
          </p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Clases input
   ═══════════════════════════════════════════════════ */
const inputCls = (state) => {
  const base =
    'w-full rounded-lg px-3.5 py-2.5 text-sm bg-white border transition-colors ' +
    'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400';
  if (state === 'error') return `${base} border-red-400 focus:ring-red-500`;
  if (state === 'valid') return `${base} border-emerald-300 focus:ring-emerald-500`;
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-slate-500`;
};

export default EditarTrabajadorPage;