// frontend/src/pages/Catalogos/UsuariosPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getUsuarios, createUsuario, updateUsuario, deleteUsuario,
} from '../../services/usuarioService';
import { getRoles } from '../../services/rolService';
import { getTrabajadorByCedula } from '../../services/trabajadorService';
import { useConfirm } from '../../context/ConfirmContext';
import PageHeader from '../../components/common/PageHeader';
import SelectField from '../../components/common/SelectField';
import toast from 'react-hot-toast';
import {
  UserCog, UserPlus, Shield, ShieldCheck,
  KeyRound, Mail, AtSign, Lock, Search as SearchIcon,
  X, Pencil, Power, CheckCircle2,
  Check, Briefcase, CreditCard,
  ClipboardList, BadgeCheck, Eye, EyeOff,
  Sparkles, XCircle, Info, ArrowRight,
  Users as UsersIcon, Calendar, Lock as LockIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombreUsuario: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Mínimo 6 caracteres')
    .optional()
    .or(z.literal('')),
  rolId: z.number({ required_error: 'Rol requerido' }),
  trabajadorId: z.number().optional().nullable(),
  activo: z.boolean().default(true),
});

/* ═══════════════════════════════════════════════════ */
const UsuariosPage = () => {
  const confirm = useConfirm();

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

  /* Password visible */
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const {
    register, handleSubmit, setValue, reset, watch, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(usuarioSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { activo: true, trabajadorId: null, rolId: null },
  });

  const emailWatch = watch('email');
  const nombreUsuarioWatch = watch('nombreUsuario');
  const passwordWatch = watch('password');
  const rolIdWatch = watch('rolId');
  const activoWatch = watch('activo');

  /* ── Carga ── */
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [mostrarInactivos]);

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
    reset({
      email: '',
      nombreUsuario: '',
      password: '',
      rolId: null,
      trabajadorId: null,
      activo: true,
    });
    setTrabajadorEncontrado(null);
    setCedulaBusqueda('');
    setMostrarPassword(false);
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
    setMostrarPassword(false);
    setModalOpen(true);
  };

  const handleDelete = async (usuario) => {
    const ok = await confirm({
      title: 'Desactivar usuario',
      message: `¿Deseas desactivar a "${usuario.email}"? No podrá iniciar sesión hasta que lo reactives.`,
      confirmText: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteUsuario(usuario.id);
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
      if (
        trabajador.usuario &&
        (!selectedUsuario || trabajador.usuario.id !== selectedUsuario.id)
      ) {
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
      const payload = { ...data };
      if (!payload.nombreUsuario) delete payload.nombreUsuario;

      if (selectedUsuario) {
        await updateUsuario(selectedUsuario.id, payload);
        toast.success('Usuario actualizado');
      } else {
        await createUsuario(payload);
        toast.success('Usuario creado');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  /* ── Filtrado local ── */
  const usuariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return usuarios;
    const q = busqueda.toLowerCase().trim();
    return usuarios.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.nombreUsuario?.toLowerCase().includes(q) ||
        u.rol?.nombre?.toLowerCase().includes(q) ||
        u.trabajador?.nombre?.toLowerCase().includes(q)
    );
  }, [usuarios, busqueda]);

  const hayBusqueda = busqueda.trim().length > 0;

  /* ── Estado por campo (para FormField) ── */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (
      touched &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    )
      return 'valid';
    return 'idle';
  };

  /* ── Opciones SelectField ── */
  const rolOptions = useMemo(
    () =>
      roles.map((r) => ({
        value: r.id,
        label: r.nombre,
        description: r.nombre === 'ADMIN' ? 'Acceso total' : 'Acceso limitado',
        icon: r.nombre === 'ADMIN' ? ShieldCheck : Shield,
      })),
    [roles]
  );

  /* ── Progreso del form ── */
  const progreso = useMemo(() => {
    let filled = 0;
    if (emailWatch?.trim()) filled++;
    if (rolIdWatch) filled++;
    if (selectedUsuario) {
      // Edición: password es opcional
      return Math.round((filled / 2) * 100);
    }
    // Creación: password es obligatorio
    if (passwordWatch && passwordWatch.length >= 6) filled++;
    return Math.round((filled / 3) * 100);
  }, [emailWatch, rolIdWatch, passwordWatch, selectedUsuario]);

  /* ── Rol seleccionado (para preview) ── */
  const rolSeleccionado = useMemo(
    () => roles.find((r) => r.id === Number(rolIdWatch)),
    [roles, rolIdWatch]
  );

  /* ── Columnas ── */
  const columns = [
    {
      header: 'Usuario',
      accessorKey: 'email',
      cell: ({ getValue, row }) => {
        const activo = row.original.activo;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                activo ? 'bg-blue-100' : 'bg-slate-100'
              }`}
            >
              <UserCog
                className={`w-4 h-4 ${activo ? 'text-blue-600' : 'text-slate-400'}`}
                strokeWidth={2.2}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {getValue() || '—'}
              </p>
              {row.original.nombreUsuario && (
                <p className="text-[11px] text-slate-400 truncate">
                  @{row.original.nombreUsuario}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Rol',
      accessorKey: 'rol.nombre',
      cell: ({ getValue }) => {
        const rol = getValue();
        const isAdmin = rol === 'ADMIN';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
              isAdmin
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
            ) : (
              <Shield className="w-3 h-3" strokeWidth={2.5} />
            )}
            {rol || '—'}
          </span>
        );
      },
    },
    {
      header: 'Trabajador',
      accessorKey: 'trabajador.nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          {getValue() ? (
            <>
              <Briefcase
                className="w-4 h-4 text-slate-400 shrink-0"
                strokeWidth={2.2}
              />
              <span className="text-sm text-slate-600 truncate">{getValue()}</span>
            </>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: ({ getValue }) => {
        const activo = getValue();
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${
              activo
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {activo ? (
              <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            ) : (
              <XCircle className="w-3 h-3" strokeWidth={2.5} />
            )}
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
            title="Editar"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.2} />
          </button>
          {row.original.activo && (
            <button
              onClick={() => handleDelete(row.original)}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
              title="Desactivar"
            >
              <Power className="w-4 h-4" strokeWidth={2.2} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      <PageHeader
        icon="🔐"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Usuarios' },
        ]}
        title="Usuarios del sistema"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <UserCog className="w-3.5 h-3.5" strokeWidth={2.2} />
            {usuariosFiltrados.length} de {usuarios.length} usuario
            {usuarios.length !== 1 && 's'}
            {hayBusqueda && (
              <span className="text-blue-600 font-medium"> (filtrados)</span>
            )}
          </span>
        }
        actions={
          <>
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition border ${
                mostrarInactivos
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              {mostrarInactivos ? (
                <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
              ) : (
                <EyeOff className="w-3.5 h-3.5" strokeWidth={2.2} />
              )}
              Inactivos
            </label>
            <button
              onClick={handleNew}
              className="inline-flex items-center justify-center gap-1.5
                         bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-blue-700 active:bg-blue-800 transition
                         shadow-sm shadow-blue-600/20"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2.5} />
              Nuevo Usuario
            </button>
          </>
        }
      />

      {/* ═══ Buscador ═══ */}
      {usuarios.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar por email, usuario, rol o trabajador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      {usuariosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayBusqueda
              ? 'No hay usuarios que coincidan con tu búsqueda'
              : 'Aún no hay usuarios registrados'}
          </p>
          {!hayBusqueda && (
            <button
              onClick={handleNew}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayBusqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
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
              data={usuariosFiltrados}
              onRowClick={handleEdit}
              showGlobalFilter={false}
              rowClassName={(row) => (!row.activo ? 'opacity-60' : '')}
            />
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden space-y-2.5">
            {usuariosFiltrados.map((usuario) => {
              const isAdmin = usuario.rol?.nombre === 'ADMIN';
              return (
                <div
                  key={usuario.id}
                  className={`bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden
                             transition ${!usuario.activo ? 'opacity-60' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => handleEdit(usuario)}
                    className="w-full text-left p-3.5 hover:bg-slate-50/60 active:bg-slate-100/60 transition
                               flex items-start gap-3"
                  >
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                        usuario.activo ? 'bg-blue-100' : 'bg-slate-100'
                      }`}
                    >
                      <UserCog
                        className={`w-5 h-5 ${
                          usuario.activo ? 'text-blue-600' : 'text-slate-400'
                        }`}
                        strokeWidth={2.2}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {usuario.email}
                        </p>
                        <span
                          className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                            usuario.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {usuario.activo ? 'On' : 'Off'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {usuario.nombreUsuario && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <AtSign className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                            {usuario.nombreUsuario}
                          </span>
                        )}
                        {usuario.trabajador?.nombre && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <Briefcase className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                            <span className="truncate">{usuario.trabajador.nombre}</span>
                          </span>
                        )}
                      </div>

                      {usuario.rol?.nombre && (
                        <span
                          className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isAdmin ? (
                            <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                          ) : (
                            <Shield className="w-3 h-3" strokeWidth={2.5} />
                          )}
                          {usuario.rol.nombre}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex border-t border-slate-100">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Editar
                    </button>
                    {usuario.activo && (
                      <>
                        <div className="w-px bg-slate-100" />
                        <button
                          onClick={() => handleDelete(usuario)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                     text-red-600 hover:bg-red-50 active:bg-red-100 transition"
                        >
                          <Power className="w-3.5 h-3.5" strokeWidth={2.3} />
                          Desactivar
                        </button>
                      </>
                    )}
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
        title={selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ═══ Banner de contexto ═══ */}
          <div className="p-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
              {selectedUsuario ? (
                <Pencil className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                {selectedUsuario ? 'Editando usuario' : 'Nuevo usuario'}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                {emailWatch?.trim() || selectedUsuario?.email || 'Completa los datos'}
              </p>
              {rolSeleccionado && (
                <p className="text-[11px] text-blue-700 mt-0.5 flex items-center gap-1">
                  {rolSeleccionado.nombre === 'ADMIN' ? (
                    <ShieldCheck className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  ) : (
                    <Shield className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                  )}
                  {rolSeleccionado.nombre}
                </p>
              )}
            </div>
          </div>

          {/* ═══ Barra de progreso ═══ */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-500" strokeWidth={2.5} />
                Progreso
              </p>
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  progreso === 100 ? 'text-emerald-600' : 'text-blue-700'
                }`}
              >
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          {/* ─── Sección: Cuenta ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">Cuenta</h3>
            </div>

            {/* Email */}
            <FormField
              icon={Mail}
              label="Email"
              required
              state={fieldState('email', emailWatch)}
              error={errors.email?.message}
              hint="Se usará para iniciar sesión"
            >
              <input
                type="email"
                autoFocus
                autoComplete="off"
                placeholder="usuario@ejemplo.com"
                {...register('email')}
                className={inputCls(fieldState('email', emailWatch))}
              />
            </FormField>

            {/* Nombre usuario */}
            <FormField
              icon={AtSign}
              label="Nombre de usuario"
              optional
              state={fieldState('nombreUsuario', nombreUsuarioWatch)}
              error={errors.nombreUsuario?.message}
              hint={
                nombreUsuarioWatch
                  ? `Se mostrará como @${nombreUsuarioWatch}`
                  : 'Identificador corto (ej: jperez)'
              }
            >
              <input
                autoComplete="off"
                placeholder="Ej: jperez"
                {...register('nombreUsuario')}
                className={inputCls(fieldState('nombreUsuario', nombreUsuarioWatch))}
              />
            </FormField>

            {/* Password */}
            <FormField
              icon={Lock}
              label="Contraseña"
              required={!selectedUsuario}
              optional={!!selectedUsuario}
              state={fieldState('password', passwordWatch)}
              error={errors.password?.message}
              hint={
                selectedUsuario
                  ? passwordWatch
                    ? `${passwordWatch.length}/mín. 6 caracteres`
                    : 'Dejar vacío para no cambiar la contraseña'
                  : `${passwordWatch?.length || 0}/mín. 6 caracteres`
              }
            >
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  {...register('password')}
                  className={`${inputCls(fieldState('password', passwordWatch))} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                             text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  aria-label={mostrarPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={2.2} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </FormField>

            {/* Rol */}
            <FormField
              icon={Shield}
              label="Rol"
              required
              state={fieldState('rolId', rolIdWatch)}
              error={errors.rolId?.message}
              hint={
                rolSeleccionado
                  ? rolSeleccionado.nombre === 'ADMIN'
                    ? 'Acceso total al sistema'
                    : 'Acceso limitado según permisos'
                  : 'Selecciona el rol del usuario'
              }
            >
              <Controller
                name="rolId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v === '' ? null : v)}
                    options={rolOptions}
                    placeholder="Buscar rol..."
                    emptyMessage="No hay roles registrados"
                    state={fieldState('rolId', rolIdWatch)}
                    tone="blue"
                  />
                )}
              />
            </FormField>
          </section>

          {/* ─── Sección: Trabajador ─── */}
          <section className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              <Briefcase className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
              <h3 className="text-base font-semibold text-slate-800">
                Trabajador asociado
              </h3>
              <span className="ml-auto text-[11px] text-slate-400 font-normal">
                Opcional
              </span>
            </div>

            {!trabajadorEncontrado ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <CreditCard
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      strokeWidth={2.2}
                    />
                    <input
                      type="text"
                      placeholder="Cédula del trabajador"
                      value={cedulaBusqueda}
                      onChange={(e) => setCedulaBusqueda(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), buscarTrabajador())
                      }
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={buscarTrabajador}
                    disabled={buscando}
                    className="inline-flex items-center justify-center gap-1.5
                               bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                               hover:bg-blue-700 active:bg-blue-800 transition
                               disabled:opacity-50 disabled:cursor-not-allowed
                               shadow-sm shadow-blue-600/20"
                  >
                    {buscando ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="w-4 h-4" strokeWidth={2.5} />
                        Buscar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
                  Ingresa la cédula y pulsa Enter o Buscar
                </p>
              </>
            ) : (
              <div className="flex items-start justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-5 h-5 text-emerald-700" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">
                      {trabajadorEncontrado.nombre}
                    </p>
                    <p className="text-[11px] text-emerald-700 truncate">
                      CI: {trabajadorEncontrado.cedula}
                      {trabajadorEncontrado.cargo?.nombre &&
                        ` · ${trabajadorEncontrado.cargo.nombre}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={limpiarTrabajador}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition shrink-0"
                  title="Quitar trabajador"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </section>

          {/* ─── Sección: Estado ─── */}
          <section className="pt-3 border-t border-slate-100">
            <label
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer
                              hover:bg-slate-100 transition select-none"
            >
              <input
                type="checkbox"
                {...register('activo')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-slate-700">
                  Usuario activo
                </span>
                <span className="block text-[11px] text-slate-500">
                  Los usuarios inactivos no pueden iniciar sesión
                </span>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition ${
                  activoWatch
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
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

          {/* ─── Footer sticky ─── */}
          <div
            className="-mx-4 sm:-mx-6 px-4 sm:px-6 pt-3
                        flex flex-col sm:flex-row justify-end gap-2
                        border-t border-slate-200"
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
                         px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold
                         hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800
                         transition disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-blue-600/25
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
                  {selectedUsuario ? 'Guardar cambios' : 'Crear usuario'}
                  <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   FormField reutilizable
   ═══════════════════════════════════════════════════ */
const FormField = ({ icon: Icon, label, required, optional, state, error, hint, children }) => {
  const stateCls =
    {
      idle: { bg: 'bg-blue-100', text: 'text-blue-600', hintIcon: Info },
      valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
      error: { bg: 'bg-red-100', text: 'text-red-600', hintIcon: XCircle },
    }[state] || {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-blue-500`;
};

export default UsuariosPage;