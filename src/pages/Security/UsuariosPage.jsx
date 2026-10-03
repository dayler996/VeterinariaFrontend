import { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../services/usuarioService';
import { getRoles } from '../../services/rolService';
import { getTrabajadorByCedula } from '../../services/trabajadorService';
import toast from 'react-hot-toast';

const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombreUsuario: z.string().min(3, 'Mínimo 3 caracteres').optional().or(z.literal('')),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  rolId: z.number({ required_error: 'Rol requerido' }),
  trabajadorId: z.number().optional().nullable(),
  activo: z.boolean().default(true),
});

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Estado para búsqueda de trabajador
  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [trabajadorEncontrado, setTrabajadorEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { activo: true }
  });

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Nombre Usuario', accessorKey: 'nombreUsuario' },
    { header: 'Rol', accessorKey: 'rol.nombre' },
    { header: 'Trabajador', accessorKey: 'trabajador.nombre' },
    { header: 'Activo', accessorKey: 'activo', cell: ({ getValue }) => getValue() ? 'Sí' : 'No' },
  ];

  useEffect(() => {
    loadData();
  }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes] = await Promise.all([
        getUsuarios(mostrarInactivos),
        getRoles(),
      ]);
      setUsuarios(usuariosRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

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
      const mensaje = error.response?.data?.error || 'Error al desactivar';
      toast.error(mensaje);
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
        toast.success(`Trabajador encontrado: ${trabajador.nombre}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Trabajador no encontrado con esa cédula');
      } else {
        toast.error('Error al buscar trabajador');
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
      // No es necesario eliminar trabajadorId porque ya es null o número

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

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Usuarios</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar inactivos
          </label>
          <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto">
            Nuevo Usuario
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={usuarios}
        onRowClick={handleEdit}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" {...register('email')} className="mt-1 block w-full border rounded p-2" />
            {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Nombre de usuario (opcional)</label>
            <input {...register('nombreUsuario')} className="mt-1 block w-full border rounded p-2" />
            {errors.nombreUsuario && <p className="text-red-600 text-sm">{errors.nombreUsuario.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">
              Contraseña {selectedUsuario && '(dejar vacío para no cambiar)'}
            </label>
            <input type="password" {...register('password')} className="mt-1 block w-full border rounded p-2" />
            {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Rol</label>
            <select {...register('rolId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
              <option value="">Seleccione</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            {errors.rolId && <p className="text-red-600 text-sm">{errors.rolId.message}</p>}
          </div>

          {/* Sección de asociación de trabajador (buscador por cédula) */}
          <div className="border-t pt-4">
            <h3 className="text-md font-medium mb-2">Asociar trabajador (opcional)</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input
                type="text"
                placeholder="Cédula del trabajador"
                value={cedulaBusqueda}
                onChange={(e) => setCedulaBusqueda(e.target.value)}
                className="flex-1 px-3 py-2 border rounded w-full sm:w-auto"
              />
              <button
                type="button"
                onClick={buscarTrabajador}
                disabled={buscando}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
              >
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {trabajadorEncontrado && (
              <div className="mt-2 p-3 bg-green-50 rounded flex justify-between items-center">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{trabajadorEncontrado.nombre}</span> - {trabajadorEncontrado.cedula}
                  </p>
                  <p className="text-xs text-gray-600">Cargo: {trabajadorEncontrado.cargo?.nombre}</p>
                </div>
                <button
                  type="button"
                  onClick={limpiarTrabajador}
                  className="text-red-600 hover:text-red-800"
                  title="Desasociar"
                >
                  ✕
                </button>
              </div>
            )}
            {/* Ya no hay input hidden para trabajadorId, se maneja con setValue */}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('activo')} id="activoUsuario" />
            <label htmlFor="activoUsuario" className="text-sm font-medium">Activo</label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsuariosPage;