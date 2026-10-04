// frontend/src/pages/Estudios/EditarEstudioPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getEstudio, updateEstudio } from '../../services/estudioService';
import { getTiposEstudio, getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import SelectField from '../../components/common/SelectField';
import JsonBuilder from '../../components/common/JsonBuilder';
import MultiImageUploader from '../../components/common/MultiImageUploader';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Microscope, FlaskConical, User, Check, X,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Info,
  ArrowRight, PawPrint, Heart, Users as UsersIcon,
  ClipboardList, Beaker, Image as ImageIcon, Palette,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  tipoId: z.number({ required_error: 'Selecciona el tipo de estudio' }),
  doctorId: z.number({ required_error: 'Selecciona un doctor' }),
  resultado: z.any().optional(),
});

/* ═══════════════════════════════════════════════════ */
const EditarEstudioPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [estudio, setEstudio] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [resultado, setResultado] = useState({});
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    register, handleSubmit, setValue, reset, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { resultado: {} },
  });

  const tipoIdWatch = watch('tipoId');
  const doctorIdWatch = watch('doctorId');

  /* Sincronizar JSON con el form */
  useEffect(() => { setValue('resultado', resultado, { shouldDirty: true }); }, [resultado, setValue]);

  /* Carga de datos */
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const [estudioRes, tiposRes, catsRes, trabajadoresRes] = await Promise.all([
        getEstudio(id),
        getTiposEstudio(),
        getCategorias({ tipo: 'estudio' }),
        getTrabajadores(),
      ]);
      const est = estudioRes.data;
      setEstudio(est);
      setTipos(tiposRes.data);
      setCategorias(catsRes.data);
      setResultado(est.resultado || {});
      setImagenes(est.imagenes?.map((img) => img.url) || []);

      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setDoctores(
        trabajadoresRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre))
      );

      const tipo = tiposRes.data.find((t) => t.id === est.tipoId);
      if (tipo) {
        setCategoriaSeleccionada(String(tipo.categoriaId));
      }
      reset({ tipoId: est.tipoId, doctorId: est.doctorId });
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaChange = (catId) => {
    setCategoriaSeleccionada(catId === '' ? '' : String(catId));
    setValue('tipoId', undefined, { shouldDirty: true });
  };

  const onSubmit = async (data) => {
    try {
      await updateEstudio(id, { ...data, resultado, imagenes });
      toast.success('Estudio actualizado');
      navigate(`/estudios/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
    }
  };

  /* Estudios filtrados por categoría */
  const estudiosFiltrados = useMemo(
    () => categoriaSeleccionada
      ? tipos.filter((t) => t.categoriaId === parseInt(categoriaSeleccionada))
      : [],
    [tipos, categoriaSeleccionada]
  );

  /* Seleccionados */
  const doctorSeleccionado = useMemo(
    () => doctores.find((d) => d.id === Number(doctorIdWatch)),
    [doctores, doctorIdWatch]
  );
  const tipoSeleccionado = useMemo(
    () => tipos.find((t) => t.id === Number(tipoIdWatch)),
    [tipos, tipoIdWatch]
  );

  /* Opciones SelectField */
  const categoriaOptions = useMemo(
    () => categorias.map((c) => ({
      value: c.id,
      label: c.nombre,
      icon: Palette,
    })),
    [categorias]
  );

  const tipoEstudioOptions = useMemo(
    () => estudiosFiltrados.map((e) => ({
      value: e.id,
      label: e.nombre,
      icon: Microscope,
    })),
    [estudiosFiltrados]
  );

  const doctorOptions = useMemo(
    () => doctores.map((d) => ({
      value: d.id,
      label: d.nombre,
      description: d.cargo?.nombre || '—',
      icon: User,
    })),
    [doctores]
  );

  /* Estado por campo */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (touched && value !== undefined && value !== null &&
        String(value).trim() !== '' && value !== 0) return 'valid';
    return 'idle';
  };

  /* Contadores */
  const resultadoCount = Object.keys(resultado || {}).length;
  const imagenesCount = imagenes?.length || 0;

  /* Progreso */
  const progreso = useMemo(() => {
    let filled = 0;
    if (categoriaSeleccionada) filled++;
    if (tipoIdWatch) filled++;
    if (doctorIdWatch) filled++;
    return Math.round((filled / 3) * 100);
  }, [categoriaSeleccionada, tipoIdWatch, doctorIdWatch]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-violet-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!estudio) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Estudio no encontrado</p>
          <button
            onClick={() => navigate('/estudios')}
            className="mt-3 text-violet-600 hover:text-violet-800 text-sm font-medium"
          >
            ← Volver a estudios
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="🔬"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: estudio.mascota?.dueno?.nombre, to: `/clientes/${estudio.mascota?.dueno?.id}` },
          { label: estudio.mascota?.nombre, to: `/mascotas/${estudio.mascotaId}` },
          { label: 'Estudio', to: `/estudios/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Estudio"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <PawPrint className="w-3.5 h-3.5" strokeWidth={2.2} />
            {estudio.mascota?.nombre}
            {estudio.tipo?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-semibold">
                  <Microscope className="w-3 h-3" strokeWidth={2.5} />
                  {estudio.tipo.nombre}
                </span>
              </>
            )}
          </span>
        }
      />

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-violet-50/60 via-white to-white overflow-hidden mb-4">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                              bg-gradient-to-br from-violet-100 to-violet-50
                              border-2 border-white shadow-md
                              flex items-center justify-center">
                <Microscope className="w-8 h-8 sm:w-9 sm:h-9 text-violet-500" strokeWidth={2} />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">
                Editando estudio
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {estudio.mascota?.nombre} — {estudio.mascota?.dueno?.nombre || 'sin dueño'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {tipoSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <FlaskConical className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {tipoSeleccionado.nombre}
                  </span>
                )}
                {doctorSeleccionado && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    Dr. {doctorSeleccionado.nombre}
                  </span>
                )}
                {resultadoCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                    <Beaker className="w-3 h-3" strokeWidth={2.5} />
                    {resultadoCount} resultado{resultadoCount === 1 ? '' : 's'}
                  </span>
                )}
                {imagenesCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
                    <ImageIcon className="w-3 h-3" strokeWidth={2.5} />
                    {imagenesCount} imagen{imagenesCount === 1 ? '' : 'es'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-violet-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-violet-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-violet-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-violet-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-violet-400 to-violet-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Datos del estudio ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
            <ClipboardList className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Datos del estudio</h3>
          </div>

          <div className="space-y-4">
            {/* Categoría */}
            <FormField
              icon={Palette}
              label="Categoría"
              required
              state={categoriaSeleccionada ? 'valid' : 'idle'}
              hint={
                categoriaSeleccionada
                  ? 'Categoría seleccionada'
                  : 'Filtra los tipos de estudio disponibles'
              }
            >
              <SelectField
                value={categoriaSeleccionada ? parseInt(categoriaSeleccionada) : ''}
                onChange={handleCategoriaChange}
                options={categoriaOptions}
                placeholder="Buscar categoría..."
                tone="violet"
                state={categoriaSeleccionada ? 'valid' : 'idle'}
              />
            </FormField>

            {/* Tipo de estudio */}
            <FormField
              icon={Microscope}
              label="Tipo de estudio"
              required
              state={fieldState('tipoId', tipoIdWatch)}
              error={errors.tipoId?.message}
              hint={
                !categoriaSeleccionada
                  ? 'Primero elige una categoría'
                  : estudiosFiltrados.length === 0
                  ? 'No hay estudios en esta categoría'
                  : tipoSeleccionado
                  ? 'Tipo seleccionado'
                  : 'Elige el tipo de estudio'
              }
            >
              <Controller
                name="tipoId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    options={tipoEstudioOptions}
                    placeholder={
                      !categoriaSeleccionada
                        ? 'Primero elige una categoría'
                        : estudiosFiltrados.length === 0
                        ? 'Sin estudios disponibles'
                        : 'Buscar tipo de estudio...'
                    }
                    disabled={!categoriaSeleccionada || estudiosFiltrados.length === 0}
                    state={fieldState('tipoId', tipoIdWatch)}
                    tone="violet"
                  />
                )}
              />
            </FormField>

            {/* Aviso sin estudios */}
            {categoriaSeleccionada && estudiosFiltrados.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-900">
                    No hay estudios en esta categoría
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Registra tipos de estudio para esta categoría en el catálogo.
                  </p>
                </div>
              </div>
            )}

            {/* Doctor */}
            <FormField
              icon={User}
              label="Doctor"
              required
              state={fieldState('doctorId', doctorIdWatch)}
              error={errors.doctorId?.message}
              hint={
                doctorSeleccionado
                  ? `Cargo: ${doctorSeleccionado.cargo?.nombre || '—'}`
                  : 'Selecciona el doctor que realizó el estudio'
              }
            >
              <Controller
                name="doctorId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    options={doctorOptions}
                    placeholder="Buscar doctor..."
                    state={fieldState('doctorId', doctorIdWatch)}
                    tone="violet"
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        {/* ═══ Card: Resultado ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <Beaker className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Resultado</h3>
            {resultadoCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-emerald-100 text-emerald-700 text-[11px] font-semibold tabular-nums">
                {resultadoCount} {resultadoCount === 1 ? 'valor' : 'valores'}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Pares clave-valor: hallazgos, valores medidos, conclusiones...
          </p>
          <div className="rounded-lg border border-slate-200 bg-emerald-50/30 p-3">
            <JsonBuilder value={resultado} onChange={setResultado} />
          </div>
        </section>

        {/* ═══ Card: Imágenes ═══ */}
        <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <h3 className="text-base font-semibold text-slate-800">Imágenes del estudio</h3>
            {imagenesCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-blue-100 text-blue-700 text-[11px] font-semibold tabular-nums">
                {imagenesCount} {imagenesCount === 1 ? 'imagen' : 'imágenes'}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
            Radiografías, ecografías, fotos clínicas, etc.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <MultiImageUploader
              value={imagenes}
              onChange={setImagenes}
              folder="estudio"
              label="Imágenes adicionales"
            />
          </div>
        </section>

        {/* ═══ Footer sticky ═══ */}
        <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                        bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                        border-t border-slate-200 sm:border-0
                        flex flex-col sm:flex-row justify-end gap-2 z-10">
          <button
            type="button"
            onClick={() => navigate(`/estudios/${id}`)}
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
                       px-5 py-2.5 bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-lg text-sm font-semibold
                       hover:from-violet-600 hover:to-violet-700 active:from-violet-700 active:to-violet-800
                       transition disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md shadow-violet-600/25
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
  const stateCls = {
    idle:  { bg: 'bg-violet-100',  text: 'text-violet-600',  hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-violet-100', text: 'text-violet-600', hintIcon: Info };

  const HintIcon = stateCls.hintIcon;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors ${stateCls.bg}`}>
          <Icon className={`w-3 h-3 ${stateCls.text}`} strokeWidth={2.5} />
        </span>
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        )}
        {state === 'valid' && !optional && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
            Válido
          </span>
        )}
      </label>

      <div className="relative">
        {children}
      </div>

      <div className="flex items-center justify-between gap-2 mt-1 min-h-[16px]">
        {error ? (
          <p className="text-red-600 text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {error}
          </p>
        ) : hint ? (
          <p className={`text-[11px] flex items-center gap-1 ${
            state === 'valid' ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            <HintIcon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {hint}
          </p>
        ) : <span />}
      </div>
    </div>
  );
};

export default EditarEstudioPage;