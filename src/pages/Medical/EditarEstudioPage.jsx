import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getEstudio, updateEstudio } from '../../services/estudioService';
import { getTiposEstudio, getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import JsonBuilder from '../../components/common/JsonBuilder';
import MultiImageUploader from '../../components/common/MultiImageUploader';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Microscope, FlaskConical, User, FileText, ListChecks,
  Check, X, AlertTriangle, Heart, Users as UsersIcon,
  Palette, Layers, Image as ImageIcon,
} from 'lucide-react';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de estudio requerido' }),
  doctorId: z.number({ required_error: 'Doctor requerido' }),
});

const EditarEstudioPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estudio, setEstudio] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [estudiosFiltrados, setEstudiosFiltrados] = useState([]);
  const [resultado, setResultado] = useState({});
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    register, handleSubmit, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { setValue('resultado', resultado); }, [resultado, setValue]);
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
        setEstudiosFiltrados(
          tiposRes.data.filter((t) => t.categoriaId === tipo.categoriaId)
        );
      }
      reset({ tipoId: est.tipoId, doctorId: est.doctorId });
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaChange = (e) => {
    const catId = e.target.value;
    setCategoriaSeleccionada(catId);
    if (catId) {
      setEstudiosFiltrados(tipos.filter((t) => t.categoriaId === parseInt(catId)));
    } else {
      setEstudiosFiltrados([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await updateEstudio(id, { ...data, resultado, imagenes });
      toast.success('Estudio actualizado');
      navigate(`/estudios/${id}`);
    } catch {
      toast.error('Error al actualizar');
    }
  };

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
        </div>
      </div>
    );
  }

  const resultadoCount = Object.keys(resultado || {}).length;
  const imagenesCount = imagenes?.length || 0;

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
            <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
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

      {/* ═══ Banner info estudio ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/25 shrink-0">
          <Microscope className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
            Editando estudio
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {estudio.tipo?.nombre || 'Sin tipo asignado'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-violet-700 mt-0.5">
            <UsersIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            <span className="truncate">
              Dueño: {estudio.mascota?.dueno?.nombre || '—'}
            </span>
          </div>
        </div>
        {imagenesCount > 0 && (
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-violet-200">
            <ImageIcon className="w-3.5 h-3.5 text-violet-600" strokeWidth={2.2} />
            <span className="text-xs font-semibold text-violet-700 tabular-nums">
              {imagenesCount}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Estudio (categoría + tipo + doctor) ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
            <FlaskConical className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Datos del estudio
            </h2>
          </div>

          <div className="space-y-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-violet-500" strokeWidth={2.2} />
                Categoría
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={handleCategoriaChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-500" strokeWidth={2.2} />
                Tipo de estudio <span className="text-red-500">*</span>
              </label>
              <select
                {...register('tipoId', { valueAsNumber: true })}
                disabled={!categoriaSeleccionada}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50
                  ${errors.tipoId ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">
                  {!categoriaSeleccionada
                    ? 'Primero selecciona una categoría'
                    : estudiosFiltrados.length === 0
                    ? 'No hay estudios en esta categoría'
                    : 'Seleccione un estudio'}
                </option>
                {estudiosFiltrados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              {errors.tipoId && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.tipoId.message}
                </p>
              )}
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-violet-500" strokeWidth={2.2} />
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                {...register('doctorId', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500
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

        {/* ═══ Card: Resultado ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
              <ListChecks className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Resultado
              </h2>
            </div>
            {resultadoCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-violet-100 text-violet-700 text-[11px] font-semibold tabular-nums">
                {resultadoCount} {resultadoCount === 1 ? 'valor' : 'valores'}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            Pares clave-valor: hallazgos, valores medidos, conclusiones, etc.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <JsonBuilder value={resultado} onChange={setResultado} />
          </div>
        </section>

        {/* ═══ Card: Imágenes ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
              <ImageIcon className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Imágenes
              </h2>
            </div>
            {imagenesCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-violet-100 text-violet-700 text-[11px] font-semibold tabular-nums">
                {imagenesCount} {imagenesCount === 1 ? 'imagen' : 'imágenes'}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3">
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

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate(`/estudios/${id}`)}
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
                       px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium
                       hover:bg-violet-700 active:bg-violet-800 transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-violet-600/20"
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

export default EditarEstudioPage;