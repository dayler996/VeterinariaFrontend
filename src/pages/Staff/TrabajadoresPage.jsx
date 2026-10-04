import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrabajadores, createTrabajador, updateTrabajador } from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImageUploader from '../../components/common/ImageUploader';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

/* ── Schema ── */
const trabajadorSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().optional(),
  activo: z.boolean().default(true),
});

/* ── Iconos ── */
const EditIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const PowerIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64A9 9 0 11 5.64 6.64M12 2v10" />
  </svg>
);
const SearchIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
  </svg>
);

/* ═══════════════════════════════════════════════════ */
const TrabajadoresPage = () => {
  const navigate = useNavigate();
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [cedulaDisplay, setCedulaDisplay] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: { sexo: 'M', activo: true },
  });

  const foto = watch('foto');

  /* ── Carga ── */
  useEffect(() => { loadData(); }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trabRes, carRes] = await Promise.all([
        getTrabajadores(null, mostrarInactivos),
        getCargos(),
      ]);
      setTrabajadores(trabRes.data);
      setCargos(carRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  /* ── Handlers ── */
  const handleNew = () => {
    setSelectedTrabajador(null);
    setCedulaDisplay('');
    reset({ sexo: 'M', foto: '', activo: true });
    setModalOpen(true);
  };

  const handleEdit = (trabajador) => {
    setSelectedTrabajador(trabajador);
    setCedulaDisplay(trabajador.cedula || '');
    reset({
      nombre: trabajador.nombre,
      cedula: trabajador.cedula,
      sexo: trabajador.sexo,
      fechaNacimiento: trabajador.fechaNacimiento
        ? new Date(trabajador.fechaNacimiento).toISOString().split('T')[0]
        : '',
      cargoId: trabajador.cargoId,
      foto: trabajador.foto || '',
      activo: trabajador.activo,
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (trabajador) => {
    const accion = trabajador.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este trabajador?`)) return;
    try {
      await updateTrabajador(trabajador.id, { ...trabajador, activo: !trabajador.activo });
      toast.success(`Trabajador ${accion}do`);
      loadData();
    } catch {
      toast.error(`Error al ${accion} trabajador`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedTrabajador) {
        await updateTrabajador(selectedTrabajador.id, data);
        toast.success('Trabajador actualizado');
      } else {
        await createTrabajador(data);
        toast.success('Trabajador creado');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Filtrado ── */
  const trabajadoresFiltrados = trabajadores
    .filter(t => !filtroCargo || t.cargoId === parseInt(filtroCargo))
    .filter(t => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        t.nombre?.toLowerCase().includes(q) ||
        t.cedula?.toLowerCase().includes(q) ||
        t.cargo?.nombre?.toLowerCase().includes(q)
      );
    });

  const hayFiltros = busqueda || filtroCargo;

  /* ── Columnas ── */
  const columns = [
    {
      header: 'Trabajador',
      accessorKey: 'nombre',
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex items-center gap-3">
            {t.foto ? (
              <img
                src={getImageUrl(t.foto)}
                alt={t.nombre}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0 border border-gray-100">
                <span className="text-lg">👤</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm text-gray-800 truncate">{t.nombre}</p>
              <p className="text-[11px] text-gray-400">CI: {t.cedula}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Cargo',
      accessorKey: 'cargo.nombre',
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-xs text-gray-400">—</span>;
        return (
          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
            {v}
          </span>
        );
      },
    },
    {
      header: 'Sexo',
      accessorKey: 'sexo',
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold
            ${v === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
            {v === 'M' ? '♂ M' : '♀ F'}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: ({ getValue }) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
          getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/trabajadores/${row.original.id}/editar`)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
            title="Editar"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => handleToggleActivo(row.original)}
            className={`p-2 rounded-lg transition
              ${row.original.activo
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'}`}
            title={row.original.activo ? 'Desactivar' : 'Activar'}
          >
            <PowerIcon />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Personal</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {trabajadoresFiltrados.length} de {trabajadores.length} trabajador{trabajadores.length !== 1 && 'es'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Inactivos
          </label>
          <button
            onClick={handleNew}
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                       hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Trabajador
          </button>
        </div>
      </div>

      {/* Filtros */}
      {trabajadores.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o cargo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los cargos</option>
              {cargos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          {hayFiltros && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => { setBusqueda(''); setFiltroCargo(''); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium
                           inline-flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contenido */}
      {trabajadoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
            👨‍⚕️
          </div>
          <p className="text-gray-500 text-sm font-medium">
            {hayFiltros ? 'No hay trabajadores que coincidan' : 'No hay trabajadores registrados'}
          </p>
          {!hayFiltros && (
            <button
              onClick={handleNew}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Crear el primero
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={trabajadoresFiltrados}
          onRowClick={(row) => navigate(`/trabajadores/${row.id}`)}
          showGlobalFilter={false}
        />
      )}

      {/* ═══ Modal ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ─── Sección: Datos personales ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-1 h-4 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-semibold text-gray-700">Datos personales</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                {...register('nombre')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.cedula ? 'border-red-400' : 'border-gray-300'}`}
                />
                <input type="hidden" {...register('cedula')} />
                {errors.cedula && <p className="text-red-600 text-xs mt-1">{errors.cedula.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('sexo')}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.sexo ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {errors.sexo && <p className="text-red-600 text-xs mt-1">{errors.sexo.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('fechaNacimiento')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.fechaNacimiento ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.fechaNacimiento && (
                <p className="text-red-600 text-xs mt-1">{errors.fechaNacimiento.message}</p>
              )}
            </div>
          </div>

          {/* ─── Sección: Trabajo ─── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-1 h-4 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-semibold text-gray-700">Información laboral</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo <span className="text-red-500">*</span>
              </label>
              <select
                {...register('cargoId', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.cargoId ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Seleccione un cargo</option>
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.cargoId && <p className="text-red-600 text-xs mt-1">{errors.cargoId.message}</p>}
            </div>

            <div>
              <ImageUploader
                value={foto}
                onChange={(url) => setValue('foto', url)}
                folder="trabajador"
                label="Foto del trabajador"
              />
            </div>
          </div>

          {/* ─── Sección: Estado ─── */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                {...register('activo')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-gray-700">Trabajador activo</span>
                <span className="block text-[11px] text-gray-500">
                  Los inactivos no aparecen en listados operativos
                </span>
              </div>
            </label>
          </div>

          {/* ─── Botones ─── */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-200 transition order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition disabled:opacity-50
                         inline-flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrabajadoresPage;