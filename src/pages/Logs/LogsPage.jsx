// frontend/src/pages/Logs/LogsPage.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/formatters';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entidad: '',
    accion: '',
    usuarioId: '',
    trabajadorId: '',
    desde: '',
    hasta: '',
    search: '',
    page: 1,
    limit: 50
  });
  const [meta, setMeta] = useState({ total: 0, totalPages: 0, page: 1, limit: 50 });
  const [accionesDisponibles, setAccionesDisponibles] = useState([]);
  const [entidadesDisponibles, setEntidadesDisponibles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  
  // Estado para el modal de detalle
  const [modalDetalle, setModalDetalle] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  // Cargar opciones para filtros
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setAccionesDisponibles(['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'LOGIN', 'VENDER', 'PAGO', 'ANULAR', 'AJUSTAR_STOCK']);
        setEntidadesDisponibles(['Usuario', 'Cliente', 'Mascota', 'Producto', 'Factura', 'Pago', 'Cita', 'Consulta', 'Vacuna', 'Vacunacion', 'Estudio', 'Operacion', 'ServicioEstetica', 'TipoOperacion', 'TipoEstudio']);
        
        const usersRes = await api.get('/usuarios?incluirInactivos=false');
        setUsuarios(usersRes.data);
        
        const trabajadoresRes = await api.get('/trabajadores?incluirInactivos=false');
        setTrabajadores(trabajadoresRes.data);
      } catch (error) {
        toast.error('Error cargando opciones de filtro');
      }
    };
    fetchOptions();
  }, []);

  const cargarLogs = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      const res = await api.get('/logs', { params });
      setLogs(res.data.data);
      setMeta(res.data.meta);
    } catch (error) {
      toast.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLogs();
  }, [filters.page, filters.limit]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    cargarLogs();
  };

  const columns = [
    { header: 'Fecha/Hora', accessorKey: 'timestamp', cell: ({ getValue }) => formatDateTime(getValue()) },
    { header: 'Usuario', accessorKey: 'usuario', cell: ({ row }) => row.original.usuario?.email || row.original.usuario?.nombreUsuario || 'N/A' },
    { header: 'Trabajador', accessorKey: 'trabajador', cell: ({ row }) => row.original.trabajador?.nombre || 'N/A' },
    { header: 'Acción', accessorKey: 'accion' },
    { header: 'Entidad', accessorKey: 'entidad' },
    { header: 'ID Entidad', accessorKey: 'entidadId' },
    { 
      header: 'Detalle', 
      accessorKey: 'detalle',
      cell: ({ getValue, row }) => {
        const det = getValue();
        if (!det) return '-';
        return (
          <button
            onClick={() => {
              setDetalleSeleccionado(det);
              setModalDetalle(true);
            }}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Ver detalle
          </button>
        );
      }
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Registro de Actividades (Auditoría)</h1>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Entidad</label>
            <select
              name="entidad"
              value={filters.entidad}
              onChange={handleFilterChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Todas</option>
              {entidadesDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Acción</label>
            <select
              name="accion"
              value={filters.accion}
              onChange={handleFilterChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Todas</option>
              {accionesDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <select
              name="usuarioId"
              value={filters.usuarioId}
              onChange={handleFilterChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Todos</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.email || u.nombreUsuario}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Trabajador</label>
            <select
              name="trabajadorId"
              value={filters.trabajadorId}
              onChange={handleFilterChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Todos</option>
              {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Desde</label>
            <input
              type="datetime-local"
              name="desde"
              value={filters.desde}
              onChange={handleFilterChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hasta</label>
            <input
              type="datetime-local"
              name="hasta"
              value={filters.hasta}
              onChange={handleFilterChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Búsqueda (ID o texto)</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="ID de entidad, acción o entidad"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de logs */}
      {loading ? (
        <div className="text-center p-4">Cargando...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={logs}
            showGlobalFilter={false}
            pagination={{
              pageIndex: meta.page - 1,
              pageSize: meta.limit,
              pageCount: meta.totalPages,
              onPageChange: (page) => setFilters(prev => ({ ...prev, page: page + 1 })),
              onPageSizeChange: (size) => setFilters(prev => ({ ...prev, limit: size, page: 1 }))
            }}
          />
          <div className="mt-2 text-sm text-gray-600">
            Total registros: {meta.total}
          </div>
        </>
      )}

      {/* Modal para ver detalle */}
      <Modal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} title="Detalle de la actividad">
        <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(detalleSeleccionado, null, 2)}
          </pre>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setModalDetalle(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LogsPage;