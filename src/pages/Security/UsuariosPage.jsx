import { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getUsuarios, createUsuario, updateUsuario, deleteUsuario,
} from '../../services/usuarioService';
import { getRoles } from '../../services/rolService';
import { getTrabajadorByCedula } from '../../services/trabajadorService';
import toast from 'react-hot-toast';

/* ── Schema ── */
const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombreUsuario: z.string().min(3, 'Mínimo 3 caracteres').optional().or(z.literal('')),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  rolId: z.number({ required_error: 'Rol requerido' }),
  trabajadorId: z.number().optional().nullable(),
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
const UserIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

/* ═══════════════════════════════════════════════════ */
const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  /* Búsqueda de trabajador */
  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [trabajadorEncontrado, setTrabajadorEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const {
    register, handleSubmit, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { activo: true },
  });

  /* ── Carga ── */
  useEffect(() => { loadData(); }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes] = await Promise.all([
        getUsuarios(mostrarInactivos),
        getRoles(),
      ]);
      setUsuarios(usuariosRes.data);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  /* ── Handlers ── */
  const handleNew = () => {
    setSelectedUsuario(null);
    reset({ email: '', nombreUsuario: '', password: '', rolId: '', trabajadorId: null, activo: true });
    setTrabajadorEncontrado(null);
    setCedulaBusqueda('');
    setModalOpen(true);
  };

  const handleEdit = (usuario) => {
    setSelectedUsuario(usuario);
    reset({
      email: usuario.email,
      nombreUsuario: usuario.nombreUsuario || '',
      password: '',
      rolId: usuario.rolId,
      trabajadorId: usuario.trabajadorId || null,
      activo: usuario.activo,
    });
    if (usuario.trabajador) {
      setTrabajadorEncontrado(usuario.trabajador);
      setCedulaBusqueda(usuario.trabajador.cedula);
    } else {
      setTrabajadorEncontrado(null);
      setCedulaBusqueda('');
    }
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      await deleteUsuario(id);
      toast.success('Usuario desactivado');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al desactivar');
    }
  };

  const buscarTrabajador = async () => {
    if (!cedulaBusqueda.trim()) {
      toast.error('Ingrese una cédula');
      return;
    }
    setBuscando(true);
    try {
      const res = await getTrabajadorByCedula(cedulaBusqueda);
      const trabajador = res.data;
      if (!trabajador.activo) {
        toast.error('El trabajador está inactivo');
        setTrabajadorEncontrado(null);
        setValue('trabajadorId', null);
        return;
      }
      if (trabajador.usuario && (!selectedUsuario || trabajador.usuario.id !== selectedUsuario.id)) {
        toast.error('Este trabajador ya está asociado a otro usuario');
        setTrabajadorEncontrado(null);
        setValue('trabajadorId', null);
      } else {
        setTrabajadorEncontrado(trabajador);
        setValue('trabajadorId', trabajador.id);
        toast.success(`Encontrado: ${trabajador.nombre}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Trabajador no encontrado');
      } else {
        toast.error('Error al buscar');
      }
      setTrabajadorEncontrado(null);
      setValue('trabajadorId', null);
    } finally {
      setBuscando(false);
    }
  };

  const limpiarTrabajador = () => {
    setTrabajadorEncontrado(null);
    setCedulaBusqueda('');
    setValue('trabajadorId', null);
  };

  const onSubmit = async (data) => {
    try {
      if (!data.nombreUsuario) delete data.nombreUsuario;

      if (selectedUsuario) {
        await updateUsuario(selectedUsuario.id, data);
        toast.success('Usuario actualizado');
      } else {
        await createUsuario(data);
        toast.success('Usuario creado');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Filtrado local ── */
  const usuariosFiltrados = usuarios.filter(u => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.nombreUsuario?.toLowerCase().includes(q) ||
      u.rol?.nombre?.toLowerCase().includes(q) ||
      u.trabajador?.nombre?.toLowerCase().includes(q)
    );
  });

  /* ── Columnas ── */
  const columns = [
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ getValue }) => (
        <span className="font-medium text-sm text-gray-800 truncate">
          {getValue()}
        </span>
      ),
    },
    {
      header: 'Usuario',
      accessorKey: 'nombreUsuario',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() || '—'}</span>
      ),
    },
    {
      header: 'Rol',
      accessorKey: 'rol.nombre',
      cell: ({ getValue }) => {
        const rol = getValue();
        const color = rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
        return (
          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${color}`}>
            {rol || '—'}
          </span>
        );
      },
    },
    {
      header: 'Trabajador',
      accessorKey: 'trabajador.nombre',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() || '—'}</span>
      ),
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
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
            title="Editar"
          >
            <EditIcon />
          </button>
          {row.original.activo && (
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
              title="Desactivar"
            >
              <PowerIcon />
            </button>
          )}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {usuariosFiltrados.length} de {usuarios.length} usuario{usuarios.length !== 1 && 's'}
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
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Buscador */}
      {usuarios.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Buscar por email, usuario, rol o trabajador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Contenido */}
      {usuariosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
            🔐
          </div>
          <p className="text-gray-500 text-sm font-medium">
            {busqueda ? 'No hay usuarios que coincidan' : 'No hay usuarios registrados'}
          </p>
          {!busqueda && (
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
          data={usuariosFiltrados}
          onRowClick={handleEdit}
          showGlobalFilter={false}
        />
      )}

      {/* ═══ Modal ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ─── Sección: Cuenta ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-1 h-4 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-semibold text-gray-700">Cuenta</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                autoFocus
                autoComplete="off"
                {...register('email')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                {...register('nombreUsuario')}
                placeholder="Ej: jperez"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.nombreUsuario ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.nombreUsuario && (
                <p className="text-red-600 text-xs mt-1">{errors.nombreUsuario.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña{' '}
                {selectedUsuario && (
                  <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
                )}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                {...register('rolId', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.rolId ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Seleccione un rol</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              {errors.rolId && <p className="text-red-600 text-xs mt-1">{errors.rolId.message}</p>}
            </div>
          </div>

          {/* ─── Sección: Trabajador ─── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-1 h-4 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-semibold text-gray-700">
                Trabajador asociado <span className="text-gray-400 font-normal">(opcional)</span>
              </h3>
            </div>

            {!trabajadorEncontrado ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Cédula del trabajador"
                    value={cedulaBusqueda}
                    onChange={(e) => setCedulaBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarTrabajador())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={buscarTrabajador}
                    disabled={buscando}
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                               hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
                  >
                    {buscando ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <SearchIcon />
                        Buscar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Ingresa la cédula y pulsa Enter o Buscar
                </p>
              </>
            ) : (
              <div className="flex items-start justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-green-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {trabajadorEncontrado.nombre}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      CI: {trabajadorEncontrado.cedula}
                      {trabajadorEncontrado.cargo?.nombre && ` · ${trabajadorEncontrado.cargo.nombre}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={limpiarTrabajador}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition shrink-0"
                  title="Quitar trabajador"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
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
                <span className="block text-sm font-medium text-gray-700">Usuario activo</span>
                <span className="block text-[11px] text-gray-500">
                  Los usuarios inactivos no pueden iniciar sesión
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
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsuariosPage;