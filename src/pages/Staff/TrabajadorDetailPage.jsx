import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTrabajador,
  getConsultasByTrabajador,
  getOperacionesByTrabajador,
  getVacunasByTrabajador,
  getEstudiosByTrabajador,
  getMonitoreosByTrabajador,
  getEsteticaByTrabajador,
  getFacturasByTrabajador,
  getCitasByTrabajador
} from '../../services/trabajadorService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

const TrabajadorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consultas');
  const [imageError, setImageError] = useState(false);

  // Estado para los datos paginados de cada pestaña
  const [tabData, setTabData] = useState({
    consultas: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
    operaciones: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
    vacunas: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
    estudios: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
    monitoreos: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
    estetica: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
    facturas: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
    citas: { data: [], total: 0, totalPages: 0, page: 1, loading: false },
  });

  // Columnas para cada tipo de historial
  const columns = {
    consultas: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Motivo', accessorKey: 'motivo' },
    ],
    operaciones: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Tipo', accessorKey: 'tipo.nombre' },
    ],
    vacunas: [
      { header: 'Fecha', accessorKey: 'fechaAplicacion', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Vacuna', accessorKey: 'vacuna.nombre' },
    ],
    estudios: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Tipo', accessorKey: 'tipo.nombre' },
    ],
    monitoreos: [
      { header: 'Fecha', accessorKey: 'fechaHora', cell: ({ getValue }) => new Date(getValue()).toLocaleString() },
      { header: 'Hospitalización', accessorKey: 'hospitalizacion.mascota.nombre' },
      { header: 'Dueño', accessorKey: 'hospitalizacion.mascota.dueno.nombre' },
      { header: 'Observaciones', accessorKey: 'observaciones' },
    ],
    estetica: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Servicio', accessorKey: 'tipo.nombre' },
    ],
    facturas: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
      { header: 'Cliente', accessorKey: 'cliente.nombre' },
      { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => `$${getValue()}` },
    ],
    citas: [
      { header: 'Fecha', accessorKey: 'fechaHora', cell: ({ getValue }) => new Date(getValue()).toLocaleString() },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Estado', accessorKey: 'estado.nombre' },
    ],
  };

  const tabs = [
    { id: 'consultas', label: 'Consultas' },
    { id: 'operaciones', label: 'Operaciones' },
    { id: 'vacunas', label: 'Vacunaciones' },
    { id: 'estudios', label: 'Estudios' },
    { id: 'monitoreos', label: 'Monitoreos' },
    { id: 'estetica', label: 'Estética' },
    { id: 'facturas', label: 'Facturas' },
    { id: 'citas', label: 'Citas' },
  ];

  useEffect(() => {
    loadTrabajador();
  }, [id]);

  // Cargar datos de la pestaña activa cuando cambia la pestaña o la página
  useEffect(() => {
    if (trabajador) {
      loadTabData(activeTab, tabData[activeTab].page);
    }
  }, [activeTab, tabData[activeTab].page, trabajador]);

  const loadTrabajador = async () => {
    try {
      setLoading(true);
      const res = await getTrabajador(id);
      setTrabajador(res.data);
      setImageError(false);
    } catch (error) {
      toast.error('Error al cargar trabajador');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tabId, page) => {
    setTabData(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], loading: true }
    }));

    try {
      let response;
      switch (tabId) {
        case 'consultas':
          response = await getConsultasByTrabajador(id, page);
          break;
        case 'operaciones':
          response = await getOperacionesByTrabajador(id, page);
          break;
        case 'vacunas':
          response = await getVacunasByTrabajador(id, page);
          break;
        case 'estudios':
          response = await getEstudiosByTrabajador(id, page);
          break;
        case 'monitoreos':
          response = await getMonitoreosByTrabajador(id, page);
          break;
        case 'estetica':
          response = await getEsteticaByTrabajador(id, page);
          break;
        case 'facturas':
          response = await getFacturasByTrabajador(id, page);
          break;
        case 'citas':
          response = await getCitasByTrabajador(id, page);
          break;
        default:
          return;
      }
      setTabData(prev => ({
        ...prev,
        [tabId]: {
          data: response.data.data,
          total: response.data.total,
          totalPages: response.data.totalPages,
          page: response.data.page,
          loading: false
        }
      }));
    } catch (error) {
      toast.error(`Error al cargar ${tabId}`);
      setTabData(prev => ({
        ...prev,
        [tabId]: { ...prev[tabId], loading: false }
      }));
    }
  };

  const handlePageChange = (newPage) => {
    setTabData(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], page: newPage }
    }));
  };

  const handleRowClick = (row) => {
    switch (activeTab) {
      case 'consultas':
        navigate(`/consultas/${row.id}`);
        break;
      case 'operaciones':
        navigate(`/operaciones/${row.id}`);
        break;
      case 'vacunas':
        navigate(`/vacunaciones/${row.id}`);
        break;
      case 'estudios':
        navigate(`/estudios/${row.id}`);
        break;
      case 'monitoreos':
        navigate(`/monitoreos/${row.id}`);
        break;
      case 'estetica':
        navigate(`/estetica/${row.id}`);
        break;
      case 'facturas':
        navigate(`/facturacion/${row.id}`);
        break;
      case 'citas':
        navigate(`/citas/${row.id}`);
        break;
      default:
        break;
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!trabajador) return <div className="text-center p-4">Trabajador no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 pt-16 lg:pt-4">
      {/* Cabecera */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Mi Perfil - {trabajador.nombre}</h1>
        <button
          onClick={() => navigate(`/trabajadores/${id}/editar`)}
          className="bg-yellow-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm sm:text-base hover:bg-yellow-600 w-full sm:w-auto"
        >
          Editar perfil
        </button>
      </div>

      {/* Foto y datos personales */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
        <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto sm:mx-0">
          {trabajador.foto && !imageError ? (
            <img
              src={getImageUrl(trabajador.foto)}
              alt={trabajador.nombre}
              className="w-full h-full object-cover rounded-lg shadow"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              Sin foto
            </div>
          )}
        </div>
        <div className="flex-1 bg-white shadow rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Nombre</p>
              <p className="font-semibold">{trabajador.nombre}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Cédula</p>
              <p className="font-semibold">{trabajador.cedula}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Cargo</p>
              <p className="font-semibold">{trabajador.cargo?.nombre}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Sexo</p>
              <p className="font-semibold">{trabajador.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Fecha Nacimiento</p>
              <p className="font-semibold">{new Date(trabajador.fechaNacimiento).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Usuario</p>
              <p className="font-semibold">{trabajador.usuario?.email || 'No asociado'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Horarios */}
      {trabajador.horarios && trabajador.horarios.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">Horarios</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Día</th>
                  <th className="px-3 py-2 text-left">Hora inicio</th>
                  <th className="px-3 py-2 text-left">Hora fin</th>
                </tr>
              </thead>
              <tbody>
                {trabajador.horarios.map((h, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">
                      {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.diaSemana]}
                    </td>
                    <td className="px-3 py-2">{h.horaInicio}</td>
                    <td className="px-3 py-2">{h.horaFin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pestañas de historial */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex flex-nowrap sm:flex-wrap gap-1 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} {tabData[tab.id]?.total > 0 ? `(${tabData[tab.id].total})` : ''}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-4">
          {tabData[activeTab].loading ? (
            <div className="text-center py-4">Cargando...</div>
          ) : tabData[activeTab].data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns[activeTab]}
                  data={tabData[activeTab].data}
                  onRowClick={handleRowClick}
                />
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={tabData[activeTab].page}
                  totalPages={tabData[activeTab].totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">No hay registros en esta categoría.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrabajadorDetailPage;