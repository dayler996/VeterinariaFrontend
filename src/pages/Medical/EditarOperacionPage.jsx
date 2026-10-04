import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getOperacion, updateOperacion } from '../../services/operacionService';
import { getTiposOperacion, getCategorias } from '../../services/crudCatalogoService';
import { getTrabajadores } from '../../services/trabajadorService';
import JsonBuilder from '../../components/common/JsonBuilder';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Stethoscope, Activity, Scissors, FileText, ListChecks,
  Check, X, AlertTriangle, Heart, Users as UsersIcon,
  Palette, Layers,
} from 'lucide-react';

const schema = z.object({
  tipoId: z.number({ required_error: 'Tipo de operación requerido' }),
  cirujanoId: z.number({ required_error: 'Cirujano requerido' }),
  notas: z.any().optional(),
});

const EditarOperacionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [operacion, setOperacion] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cirujanos, setCirujanos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [operacionesFiltradas, setOperacionesFiltradas] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(true);

  const {
    register, handleSubmit, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { setValue('notas', notas); }, [notas, setValue]);
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [id]);

  const loadData = async () => {
    try {
      const [opRes, tiposRes, catsRes, trabajadoresRes] = await Promise.all([
        getOperacion(id),
        getTiposOperacion(),
        getCategorias({ tipo: 'operacion' }),
        getTrabajadores(),
      ]);
      const op = opRes.data;
      setOperacion(op);
      setTipos(tiposRes.data);
      setCategorias(catsRes.data);
      setNotas(op.notas || {});

      const cargosPermitidos = ['Médico Veterinario', 'Cirujano Especialista'];
      setCirujanos(
        trabajadoresRes.data.filter((t) => cargosPermitidos.includes(t.cargo?.nombre))
      );

      const tipo = tiposRes.data.find((t) => t.id === op.tipoId);
      if (tipo) {
        setCategoriaSeleccionada(String(tipo.categoriaId));
        setOperacionesFiltradas(
          tiposRes.data.filter((t) => t.categoriaId === tipo.categoriaId)
        );
      }
      reset({ tipoId: op.tipoId, cirujanoId: op.cirujanoId });
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
      setOperacionesFiltradas(tipos.filter((t) => t.categoriaId === parseInt(catId)));
    } else {
      setOperacionesFiltradas([]);
    }
    setValue('tipoId', undefined);
  };

  const onSubmit = async (data) => {
    try {
      await updateOperacion(id, { ...data, notas });
      toast.success('Operación actualizada');
      navigate(`/operaciones/${id}`);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-orange-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!operacion) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Operación no encontrada</p>
        </div>
      </div>
    );
  }

  const notasCount = Object.keys(notas || {}).length;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="⚕️"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: operacion.mascota?.dueno?.nombre, to: `/clientes/${operacion.mascota?.dueno?.id}` },
          { label: operacion.mascota?.nombre, to: `/mascotas/${operacion.mascotaId}` },
          { label: 'Operación', to: `/operaciones/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Operación"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
            {operacion.mascota?.nombre}
            {operacion.tipo?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-semibold">
                  <Stethoscope className="w-3 h-3" strokeWidth={2.5} />
                  {operacion.tipo.nombre}
                </span>
              </>
            )}
          </span>
        }
      />

      {/* ═══ Banner info operación ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/25 shrink-0">
          <Stethoscope className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">
            Editando operación
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {operacion.tipo?.nombre || 'Sin tipo asignado'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-orange-700 mt-0.5">
            <UsersIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            <span className="truncate">
              Dueño: {operacion.mascota?.dueno?.nombre || '—'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ Card: Operación (categoría + tipo) ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-orange-600 rounded-full"></span>
            <Activity className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Procedimiento
            </h2>
          </div>

          <div className="space-y-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.2} />
                Categoría
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={handleCategoriaChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                <Layers className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.2} />
                Tipo de operación <span className="text-red-500">*</span>
              </label>
              <select
                {...register('tipoId', { valueAsNumber: true })}
                disabled={!categoriaSeleccionada}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50
                  ${errors.tipoId ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">
                  {!categoriaSeleccionada
                    ? 'Primero selecciona una categoría'
                    : operacionesFiltradas.length === 0
                    ? 'No hay operaciones en esta categoría'
                    : 'Seleccione una operación'}
                </option>
                {operacionesFiltradas.map((op) => (
                  <option key={op.id} value={op.id}>{op.nombre}</option>
                ))}
              </select>
              {errors.tipoId && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                  {errors.tipoId.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ═══ Card: Cirujano ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-orange-600 rounded-full"></span>
            <Scissors className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Cirujano
            </h2>
          </div>

          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Profesional que realizó la operación
          </label>
          <select
            {...register('cirujanoId', { valueAsNumber: true })}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
              ${errors.cirujanoId ? 'border-red-400' : 'border-slate-300'}`}
          >
            <option value="">Seleccione un cirujano</option>
            {cirujanos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.cargo?.nombre})
              </option>
            ))}
          </select>
          {errors.cirujanoId && (
            <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
              {errors.cirujanoId.message}
            </p>
          )}
        </section>

        {/* ═══ Card: Notas quirúrgicas ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-orange-600 rounded-full"></span>
              <ListChecks className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                Notas quirúrgicas
              </h2>
            </div>
            {notasCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                                bg-orange-100 text-orange-700 text-[11px] font-semibold tabular-nums">
                {notasCount} {notasCount === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            Pares clave-valor: hallazgos, técnica utilizada, complicaciones, etc.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <JsonBuilder value={notas} onChange={setNotas} />
          </div>
        </section>

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate(`/operaciones/${id}`)}
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
                       px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium
                       hover:bg-orange-700 active:bg-orange-800 transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-orange-600/20"
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

export default EditarOperacionPage;