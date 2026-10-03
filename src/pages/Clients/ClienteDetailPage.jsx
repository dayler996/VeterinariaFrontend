import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCliente, updateCliente } from '../../services/clienteService';
import { updateMascota } from '../../services/mascotaService'; // Asegúrate de que esta función existe
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

const ClienteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarMascotasInactivas, setMostrarMascotasInactivas] = useState(false);

  useEffect(() => {
    loadCliente();
  }, [id]);

  const loadCliente = async () => {
    try {
      setLoading(true);
      const res = await getCliente(id);
      setCliente(res.data);
    } catch (error) {
      toast.error('Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCliente = async () => {
    const accion = cliente.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este cliente?`)) return;
    try {
      await updateCliente(id, { ...cliente, activo: !cliente.activo });
      toast.success(`Cliente ${accion}do`);
      loadCliente();
    } catch (error) {
      toast.error(`Error al ${accion} cliente`);
    }
  };

  const handleToggleMascota = async (mascota) => {
    const accion = mascota.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} esta mascota?`)) return;
    try {
      await updateMascota(mascota.id, { ...mascota, activo: !mascota.activo });
      toast.success(`Mascota ${accion}da`);
      loadCliente(); // Recargamos el cliente para actualizar la lista
    } catch (error) {
      toast.error(`Error al ${accion} mascota`);
    }
  };

  const mascotaColumns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Especie', accessorKey: 'especie.nombre' },
    { header: 'Raza', accessorKey: 'raza.nombre' },
    { header: 'Sexo', accessorKey: 'sexo' },
    { header: 'Activo', accessorKey: 'activo', cell: ({ getValue }) => (getValue() ? 'Sí' : 'No') },
    ...(isAdmin ? [{
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggleMascota(row.original)}
            className={row.original.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
          >
            {row.original.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      ),
    }] : []),
  ];

  const mascotasFiltradas = mostrarMascotasInactivas
    ? cliente?.mascotas || []
    : (cliente?.mascotas || []).filter(m => m.activo);

  if (loading) return <div className="text-center">Cargando...</div>;
  if (!cliente) return <div>Cliente no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Detalle del Cliente</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/clientes/${id}/editar`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full sm:w-auto"
          >
            Editar
          </button>
          {isAdmin && (
            <button
              onClick={handleToggleCliente}
              className={`px-4 py-2 rounded w-full sm:w-auto ${
                cliente.activo
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {cliente.activo ? 'Desactivar' : 'Activar'}
            </button>
          )}
          <button
            onClick={() => navigate(`/clientes/${id}/facturas`)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full sm:w-auto"
          >
            Facturas
          </button>
        </div>
      </div>

      {/* Foto del cliente */}
      {cliente.foto && (
        <div className="mb-4">
          <img src={getImageUrl(cliente.foto)} alt="Cliente" className="w-32 h-32 object-cover rounded-lg shadow" />
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nombre</p>
            <p className="font-semibold">{cliente.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cédula</p>
            <p className="font-semibold">{cliente.cedula}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Teléfono</p>
            <p className="font-semibold">{cliente.telefono}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sexo</p>
            <p className="font-semibold">{cliente.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dirección</p>
            <p className="font-semibold">{cliente.direccion || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <p className={`font-semibold ${cliente.activo ? 'text-green-600' : 'text-red-600'}`}>
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <h2 className="text-xl font-semibold">Mascotas</h2>
          <div className="flex gap-2">
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={mostrarMascotasInactivas}
                  onChange={(e) => setMostrarMascotasInactivas(e.target.checked)}
                />
                Mostrar inactivas
              </label>
            )}
            <Link
              to={`/clientes/${id}/nueva-mascota`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Nueva Mascota
            </Link>
          </div>
        </div>
        <DataTable
          columns={mascotaColumns}
          data={mascotasFiltradas}
          onRowClick={(mascota) => navigate(`/mascotas/${mascota.id}`)}
          rowClassName={(row) => !row.activo ? 'opacity-50 line-through' : ''}
        />
      </div>
    </div>
  );
};

export default ClienteDetailPage;