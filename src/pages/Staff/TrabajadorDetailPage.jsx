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
  getCitasByTrabajador,
} from '../../services/trabajadorService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

const TABS = [
  {
    id: 'consultas', label: 'Consultas', icon: '🩺',
    fetcher: getConsultasByTrabajador, basePath: '/consultas',
    columns: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleDateString()}</span> },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Motivo', accessorKey: 'motivo', cell: ({ getValue }) => <span className="text-sm text-gray-600 line-clamp-2">{getValue()}</span> },
    ],
  },
  {
    id: 'operaciones', label: 'Operaciones', icon: '⚕️',
    fetcher: getOperacionesByTrabajador, basePath: '/operaciones',
    columns: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleDateString()}</span> },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Tipo', accessorKey: 'tipo.nombre' },
    ],
  },
  {
    id: 'vacunas', label: 'Vacunaciones', icon: '💉',
    fetcher: getVacunasByTrabajador, basePath: '/vacunaciones',
    columns: [
      { header: 'Fecha', accessorKey: 'fechaAplicacion', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleDateString()}</span> },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Vacuna', accessorKey: 'vacuna.nombre' },
    ],
  },
  {
    id: 'estudios', label: 'Estudios', icon: '🔬',
    fetcher: getEstudiosByTrabajador, basePath: '/estudios',
    columns: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleDateString()}</span> },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Tipo', accessorKey: 'tipo.nombre' },
    ],
  },
  {
    id: 'monitoreos', label: 'Monitoreos', icon: '📈',
    fetcher: getMonitoreosByTrabajador, basePath: '/monitoreos',
    columns: [
      { header: 'Fecha/Hora', accessorKey: 'fechaHora', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleString()}</span> },
      { header: 'Mascota', accessorKey: 'hospitalizacion.mascota.nombre' },
      { header: 'Dueño', accessorKey: 'hospitalizacion.mascota.dueno.nombre' },
      { header: 'Observaciones', accessorKey: 'observaciones', cell: ({ getValue }) => <span className="text-sm text-gray-600 line-clamp-2">{getValue() || '—'}</span> },
    ],
  },
  {
    id: 'estetica', label: 'Estética', icon: '✂️',
    fetcher: getEsteticaByTrabajador, basePath: '/estetica',
    columns: [
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleDateString()}</span> },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Servicio', accessorKey: 'tipo.nombre' },
    ],
  },
  {
    id: 'facturas', label: 'Facturas', icon: '🧾',
    fetcher: getFacturasByTrabajador, basePath: '/facturacion',
    columns: [
      { header: 'Número', accessorKey: 'numero' },
      { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleDateString()}</span> },
      { header: 'Cliente', accessorKey: 'cliente.nombre' },
      { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => <span className="block text-right tabular-nums font-semibold text-gray-800">${Number(getValue() || 0).toFixed(2)}</span> },
    ],
  },
  {
    id: 'citas', label: 'Citas', icon: '📅',
    fetcher: getCitasByTrabajador, basePath: '/citas',
    columns: [
      { header: 'Fecha/Hora', accessorKey: 'fechaHora', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleString()}</span> },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Estado', accessorKey: 'estado.nombre' },
    ],
  },
];

const TrabajadorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trabajador, setTrabajador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState('consultas');

  const [tabsData, setTabsData] = useState(
    TABS.reduce((acc, tab) => ({
      ...acc,
      [tab.id]: { data: [], total: 0, totalPages: 0, page: 1, loading: false, loaded: false },
    }), {})
  );

  useEffect(() => { loadTrabajador(); }, [id]);

  const loadTrabajador = async () => {
    try {
      setLoading(true);
      const res = await getTrabajador(id);
      setTrabajador(res.data);
      setImageError(false);
    } catch { toast.error('Error al cargar trabajador'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!trabajador) return;
    const tab = TABS.find(t => t.id === activeTab);
    const current = tabsData[activeTab];
    if (!tab || current.loaded) return;
    loadTabData(activeTab, 1);
  }, [activeTab, trabajador]);

  const loadTabData = async (tabId, page) => {
    const tab = TABS.find(t => t.id === tabId);
    if (!tab) return;
    setTabsData(prev => ({ ...prev, [tabId]: { ...prev[tabId], loading: true } }));
    try {
      const response = await tab.fetcher(id, page);
      const payload = response.data;
      setTabsData(prev => ({
        ...prev,
        [tabId]: {
          data: payload.data || [],
          total: payload.total || 0,
          totalPages: payload.totalPages || 0,
          page: payload.page || 1,
          loading: false,
          loaded: true,
        },
      }));
    } catch {
      toast.error(`Error al cargar ${tab.label.toLowerCase()}`);
      setTabsData(prev => ({ ...prev, [tabId]: { ...prev[tabId], loading: false, loaded: true } }));
    }
  };

  const handlePageChange = (newPage) => {
    const tabId = activeTab;
    setTabsData(prev => ({ ...prev, [tabId]: { ...prev[tabId], page: newPage } }));
    loadTabData(tabId, newPage);
  };

  const handleRowClick = (row) => {
    const tab = TABS.find(t => t.id === activeTab);
    if (tab?.basePath) navigate(`${tab.basePath}/${row.id}`);
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 rounded-xl shrink-0 mx-auto sm:mx-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trabajador) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">Trabajador no encontrado</p>
          <button onClick={() => navigate('/trabajadores')} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">← Volver a personal</button>
        </div>
      </div>
    );
  }

  const activeTabCfg = TABS.find(t => t.id === activeTab);
  const activeData = tabsData[activeTab];

  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto">
      <PageHeader
        icon="👨‍⚕️"
        breadcrumbs={[
          { label: 'Personal', to: '/trabajadores' },
          { label: trabajador.nombre },
        ]}
        title={
          <span className="flex items-center gap-2 flex-wrap">
            {trabajador.nombre}
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${trabajador.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trabajador.activo ? 'Activo' : 'Inactivo'}
            </span>
          </span>
        }
        subtitle={`${trabajador.cargo?.nombre || 'Sin cargo'}${trabajador.usuario?.email ? ` · ${trabajador.usuario.email}` : ''}`}
        actions={
          <button
            onClick={() => navigate(`/trabajadores/${id}/editar`)}
            className="inline-flex items-center justify-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition col-span-2 sm:col-span-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Editar perfil
          </button>
        }
      />

      {/* Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <div className="shrink-0 mx-auto sm:mx-0">
            {trabajador.foto && !imageError ? (
              <img
                src={getImageUrl(trabajador.foto)}
                alt={trabajador.nombre}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-gray-200 shadow-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center text-4xl border border-gray-100">
                👨‍⚕️
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <InfoItem label="Cédula" value={trabajador.cedula} />
              <InfoItem label="Sexo" value={trabajador.sexo === 'M' ? 'Masculino' : 'Femenino'} />
              <InfoItem label="Nacimiento" value={trabajador.fechaNacimiento ? new Date(trabajador.fechaNacimiento).toLocaleDateString() : '—'} />
              <InfoItem label="Cargo" value={trabajador.cargo?.nombre || '—'} />
              <InfoItem label="Edad" value={calcularEdad(trabajador.fechaNacimiento)} />
              <InfoItem label="Usuario" value={trabajador.usuario?.email || 'No asociado'} />
            </div>
          </div>
        </div>
      </div>

      {/* Horarios */}
      {trabajador.horarios && trabajador.horarios.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              ⏰ Horarios
              <span className="text-xs font-normal text-gray-400">({trabajador.horarios.length})</span>
            </h2>
          </div>
          <div className="p-3 sm:p-4">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Día</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Inicio</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Fin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trabajador.horarios.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{DIAS_SEMANA[h.diaSemana] || `Día ${h.diaSemana}`}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-700 tabular-nums">{h.horaInicio}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-700 tabular-nums">{h.horaFin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2">
              {trabajador.horarios.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-800">{DIAS_SEMANA[h.diaSemana] || `Día ${h.diaSemana}`}</span>
                  <span className="text-sm text-gray-600 tabular-nums">{h.horaInicio} – {h.horaFin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 overflow-x-auto">
          <nav className="flex gap-1 px-2 sm:px-3 min-w-max">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const count = tabsData[tab.id]?.total;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span>{activeTabCfg.icon}</span>
                {activeTabCfg.label}
                {activeData.total > 0 && <span className="text-xs font-normal text-gray-400">({activeData.total})</span>}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Registros de {trabajador.nombre}</p>
            </div>
          </div>

          {activeData.loading ? (
            <div className="py-10 text-center">
              <svg className="animate-spin w-7 h-7 mx-auto text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 mt-3">Cargando {activeTabCfg.label.toLowerCase()}...</p>
            </div>
          ) : activeData.data.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-2xl">{activeTabCfg.icon}</div>
              <p className="text-sm text-gray-500">No hay {activeTabCfg.label.toLowerCase()} registradas</p>
            </div>
          ) : (
            <>
              <DataTable
                columns={activeTabCfg.columns}
                data={activeData.data}
                onRowClick={handleRowClick}
                hidePagination
                showGlobalFilter={false}
              />
              {activeData.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination currentPage={activeData.page} totalPages={activeData.totalPages} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-800 truncate" title={value}>{value || '—'}</p>
  </div>
);

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '—';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let anios = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) anios--;
  return anios > 0 ? `${anios} ${anios === 1 ? 'año' : 'años'}` : '—';
};

export default TrabajadorDetailPage;