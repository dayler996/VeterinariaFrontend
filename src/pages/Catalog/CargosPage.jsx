import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCargos, createCargo, updateCargo, deleteCargo } from '../../services/cargoService';
import toast from 'react-hot-toast';
import {
  Briefcase, BriefcaseBusiness, BriefcaseMedical, Plus,
  Pencil, Trash2, Search as SearchIcon, X, Check,
  AlertTriangle, ClipboardList, BadgeCheck,
  UserCog, Users as UsersIcon, Award, Stethoscope,
} from 'lucide-react';

const schema = z.object({ nombre: z.string().min(1, 'Nombre requerido') });

/* ── Config visual por cargo ── */
const getCargoTone = (nombre) => {
  const n = (nombre || '').toLowerCase();
  if (n.includes('veterinario') || n.includes('médico') || n.includes('cirujano'))
    return { tone: 'blue', Icon: Stethoscope, category: 'Médico' };
  if (n.includes('peluquero') || n.includes('estética') || n.includes('baño'))
    return { tone: 'pink', Icon: Award, category: 'Estética' };
  if (n.includes('recepcion') || n.includes('admin') || n.includes('secretari'))
    return { tone: 'cyan', Icon: UsersIcon, category: 'Administrativo' };
  if (n.includes('asistente') || n.includes('auxiliar'))
    return { tone: 'violet', Icon: UserCog, category: 'Asistencia' };
  return { tone: 'slate', Icon: Briefcase, category: 'General' };
};

const TONE_CLS = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   iconBg: 'bg-blue-100',   iconText: 'text-blue-600' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-200',   iconBg: 'bg-pink-100',   iconText: 'text-pink-600' },
  cyan:   { bg: 'bg-cyan-100',   text: 'text-cyan-700',   border: 'border-cyan-200',   iconBg: 'bg-cyan-100',   iconText: 'text-cyan-600' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
  slate:  { bg: 'bg-slate-100',  text: 'text-slate-700',  border: 'border-slate-200',  iconBg: 'bg-slate-100',  iconText: 'text-slate-600' },
};

/* ═══════════════════════════════════════════════════ */
const CargosPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  /* ── Carga ── */
  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await getCargos();
      setItems(res.data);
    } catch {
      toast.error('Error al cargar cargos');
    } finally {
      setLoading(false);
    }
  };

  /* ── Handlers ── */
  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '' });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset(item);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cargo? Se eliminarán también los trabajadores asociados.')) return;
    try {
      await deleteCargo(id);
      toast.success('Cargo eliminado');
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateCargo(selectedItem.id, data);
      else await createCargo(data);
      toast.success(selectedItem ? 'Cargo actualizado' : 'Cargo creado');
      setModalOpen(false);
      loadItems();
    } catch {
      toast.error('Error al guardar');
    }
  };

  /* ── Filtro ── */
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return items;
    const q = busqueda.toLowerCase().trim();
    return items.filter((i) => i.nombre?.toLowerCase().includes(q));
  }, [items, busqueda]);

  const hayBusqueda = busqueda.trim().length > 0;

  /* ── Columnas ── */
  const columns = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          #{getValue()}
        </span>
      ),
    },
    {
      header: 'Cargo',
      accessorKey: 'nombre',
      cell: ({ getValue }) => {
        const cfg = getCargoTone(getValue());
        const tone = TONE_CLS[cfg.tone];
        const Icon = cfg.Icon;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.iconBg}`}>
              <Icon className={`w-4 h-4 ${tone.iconText}`} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{getValue()}</p>
              <p className="text-[11px] text-slate-400 truncate">{cfg.category}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Categoría',
      accessorKey: 'nombre',
      cell: ({ getValue }) => {
        const cfg = getCargoTone(getValue());
        const tone = TONE_CLS[cfg.tone];
        const Icon = cfg.Icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border
                            ${tone.bg} ${tone.text} ${tone.border}
                            text-[11px] font-semibold whitespace-nowrap`}>
            <Icon className="w-3 h-3" strokeWidth={2.5} />
            {cfg.category}
          </span>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
            title="Editar"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-slate-700 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      <PageHeader
        icon="💼"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Cargos' },
        ]}
        title="Cargos"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Briefcase className="w-3.5 h-3.5" strokeWidth={2.2} />
            {itemsFiltrados.length} de {items.length} cargo{items.length !== 1 && 's'}
            {hayBusqueda && <span className="text-slate-600 font-medium"> (filtrados)</span>}
          </span>
        }
        actions={
          <button
            onClick={handleNew}
            className="inline-flex items-center justify-center gap-1.5
                       bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium
                       hover:bg-slate-900 active:bg-black transition
                       shadow-sm shadow-slate-800/20"
          >
            <BriefcaseBusiness className="w-4 h-4" strokeWidth={2.5} />
            Nuevo Cargo
          </button>
        }
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-700/25 shrink-0">
          <BriefcaseMedical className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Estructura organizacional
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            Cargos del personal
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <BadgeCheck className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            Los cargos se asignan a los trabajadores del sistema
          </p>
        </div>
      </div>

      {/* ═══ Buscador ═══ */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar cargo por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                           text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ Contenido ═══ */}
      {itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay cargos que coincidan con tu búsqueda'
              : 'Aún no hay cargos registrados'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={handleNew}
              className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ═══ DESKTOP: Tabla ═══ */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <DataTable
              columns={columns}
              data={itemsFiltrados}
              onRowClick={handleEdit}
              showGlobalFilter={false}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {itemsFiltrados.map((item) => {
              const cfg = getCargoTone(item.nombre);
              const tone = TONE_CLS[cfg.tone];
              const Icon = cfg.Icon;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="w-full text-left p-3.5 hover:bg-slate-50/60 active:bg-slate-100/60 transition
                               flex items-start gap-3"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${tone.iconBg}`}>
                      <Icon className={`w-5 h-5 ${tone.iconText}`} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {item.nombre}
                        </p>
                        <span className="shrink-0 text-[10px] font-mono text-slate-400 tabular-nums">
                          #{item.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cfg.category}
                      </p>
                      <span className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border
                                        ${tone.bg} ${tone.text} ${tone.border}`}>
                        <Icon className="w-2.5 h-2.5" strokeWidth={2.5} />
                        {cfg.category}
                      </span>
                    </div>
                  </button>

                  <div className="flex border-t border-slate-100">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Editar
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-red-600 hover:bg-red-50 active:bg-red-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ Modal ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !isSubmitting && setModalOpen(false)}
        title={selectedItem ? 'Editar Cargo' : 'Nuevo Cargo'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Sección: Datos del cargo ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
              <Briefcase className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">
                Datos del cargo
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BriefcaseBusiness className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.2} />
                Nombre del cargo <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                {...register('nombre')}
                placeholder="Ej: Médico Veterinario, Peluquero Canino, Recepcionista"
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
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
                Usa nombres descriptivos que identifiquen claramente el puesto
              </p>
            </div>
          </section>

          {/* ── Botones ── */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2
                         px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                         hover:bg-slate-200 active:bg-slate-300 transition
                         order-2 sm:order-1 disabled:opacity-50"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2
                         px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium
                         hover:bg-slate-900 active:bg-black transition
                         order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed
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
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CargosPage;