import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getMascota,
  getConsultasByMascota,
  getVacunacionesByMascota,
  getEstudiosByMascota,
  getOperacionesByMascota,
  getEsteticaByMascota,
  getHospitalizacionesByMascota,
  deleteMascota,
} from '../../services/mascotaService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

const useSeccionPaginada = (fetchFunction, mascotaId, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const cargarPagina = async (pagina) => {
    setLoading(true);
    try {
      const res = await fetchFunction(mascotaId, pagina, pageSize);
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
      setPage(res.data.page);
      setLoaded(true);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (mascotaId) cargarPagina(page); }, [mascotaId, page]);

  return { data, page, totalPages, total, loading, loaded, setPage };
};

const MascotaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const confirm = useConfirm();

  const [mascota, setMascota] = useState(null);
  const [loadingMascota, setLoadingMascota] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState('consultas');

  const consultas = useSeccionPaginada(getConsultasByMascota, id);
  const vacunaciones = useSeccionPaginada(getVacunacionesByMascota, id);
  const estudios = useSeccionPaginada(getEstudiosByMascota, id);
  const operaciones = useSeccionPaginada(getOperacionesByMascota, id);
  const estetica = useSeccionPaginada(getEsteticaByMascota, id);
  const hospitalizaciones = useSeccionPaginada(getHospitalizacionesByMascota, id);

  useEffect(() => { loadMascota(); }, [id]);

  const loadMascota = async () => {
    try {
      setLoadingMascota(true);
      const res = await getMascota(id);
      setMascota(res.data);
      setImageError(false);
    } catch { toast.error('Error al cargar la mascota'); }
    finally { setLoadingMascota(false); }
  };

  const handleDelete = async () => {
    if (!isAdmin) { toast.error('No tienes permiso para eliminar'); return; }
    const ok = await confirm({
      title: 'Eliminar mascota',
      message: `¿Eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMascota(id);
      toast.success('Mascota eliminada');
      navigate(`/clientes/${mascota.dueno?.id}`);
    } catch { toast.error('Error al eliminar'); }
  };

  const columnsConsultas = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Motivo', accessorKey: 'motivo' },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
  ];

  const columnsVacunas = [
    { header: 'Fecha', accessorKey: 'fechaAplicacion', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Vacuna', accessorKey: 'vacuna.nombre' },
    { header: 'Próximo refuerzo', accessorKey: 'proximoRefuerzo', cell: ({ getValue }) => (getValue() ? new Date(getValue()).toLocaleDateString() : '—') },
    {
      header: 'Notif.',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <span className={`w-2 h-2 rounded-full ${row.original.notificado_primero ? 'bg-green-500' : 'bg-gray-300'}`} title={`1ª notificación: ${row.original.notificado_primero ? 'Sí' : 'No'}`} />
          <span className={`w-2 h-2 rounded-full ${row.original.notificado_segundo ? 'bg-green-500' : 'bg-gray-300'}`} title={`2ª notificación: ${row.original.notificado_segundo ? 'Sí' : 'No'}`} />
        </div>
      ),
    },
  ];

  const columnsEstudios = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
  ];

  const columnsOperaciones = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Cirujano', accessorKey: 'cirujano.nombre' },
  ];

  const columnsEstetica = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Peluquero', accessorKey: 'trabajador.nombre' },
  ];

  const columnsHospitalizaciones = [
    { header: 'Ingreso', accessorKey: 'fechaIngreso', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Motivo', accessorKey: 'motivo' },
    { header: 'Alta', accessorKey: 'fechaAlta', cell: ({ getValue }) => (getValue() ? new Date(getValue()).toLocaleDateString() : '—') },
  ];

  const tabs = [
    { id: 'consultas', label: 'Consultas', icon: '🩺', sec: consultas, columns: columnsConsultas, basePath: '/consultas', newPath: '/consultas/nueva' },
    { id: 'vacunaciones', label: 'Vacunas', icon: '💉', sec: vacunaciones, columns: columnsVacunas, basePath: '/vacunaciones', newPath: '/vacunaciones/nueva' },
    { id: 'estudios', label: 'Estudios', icon: '🔬', sec: estudios, columns: columnsEstudios, basePath: '/estudios', newPath: '/estudios/nueva' },
    { id: 'operaciones', label: 'Operaciones', icon: '⚕️', sec: operaciones, columns: columnsOperaciones, basePath: '/operaciones', newPath: '/operaciones/nueva' },
    { id: 'estetica', label: 'Estética', icon: '✂️', sec: estetica, columns: columnsEstetica, basePath: '/estetica', newPath: '/estetica/nueva' },
    { id: 'hospitalizaciones', label: 'Hospitalización', icon: '🏥', sec: hospitalizaciones, columns: columnsHospitalizaciones, basePath: '/hospitalizaciones', newPath: '/hospitalizaciones/nueva' },
  ];

  const activeTabCfg = tabs.find(t => t.id === activeTab);

  if (loadingMascota) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0" />
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

  if (!mascota) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Mascota no encontrada</p>
          <button onClick={() => navigate('/clientes')} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">← Volver a clientes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto">
      <PageHeader
        icon="🐾"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: mascota.dueno?.nombre, to: `/clientes/${mascota.dueno?.id}` },
          { label: mascota.nombre },
        ]}
        title={mascota.nombre}
        subtitle={`${mascota.especie?.nombre || ''}${mascota.raza?.nombre ? ` · ${mascota.raza.nombre}` : ''}`}
        actions={
          <>
            <button onClick={() => navigate(`/mascotas/${id}/editar`)} className="inline-flex items-center justify-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Editar
            </button>
            <button onClick={() => navigate(`/citas/nueva?mascotaId=${id}`)} className="inline-flex items-center justify-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Cita
            </button>
            <button onClick={() => navigate(`/mascotas/${id}/historial`)} className="inline-flex items-center justify-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Historial
            </button>
            {isAdmin && (
              <button onClick={handleDelete} className="inline-flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                Eliminar
              </button>
            )}
          </>
        }
      />

      {/* Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="shrink-0 mx-auto sm:mx-0">
            {mascota.foto && !imageError ? (
              <img
                src={getImageUrl(mascota.foto)}
                alt={mascota.nombre}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-gray-200 shadow-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center text-4xl border border-gray-100">🐾</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <InfoItem label="Especie" value={mascota.especie?.nombre} />
              <InfoItem label="Raza" value={mascota.raza?.nombre} />
              <InfoItem label="Sexo" value={mascota.sexo === 'M' ? 'Masculino' : 'Femenino'} />
              <InfoItem label="Nacimiento" value={new Date(mascota.fechaNacimiento).toLocaleDateString()} />
              <InfoItem label="Edad aprox." value={calcularEdad(mascota.fechaNacimiento)} />

              <div className="col-span-2 lg:col-span-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Dueño</p>
                <Link to={`/clientes/${mascota.dueno?.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {mascota.dueno?.nombre}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 overflow-x-auto">
          <nav className="flex gap-1 px-2 sm:px-3 min-w-max">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.sec.total > 0 && (
                    <span className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {tab.sec.total}
                    </span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span>{activeTabCfg.icon}</span>
                {activeTabCfg.label}
                {activeTabCfg.sec.total > 0 && (
                  <span className="text-xs font-normal text-gray-400">({activeTabCfg.sec.total})</span>
                )}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Registros asociados a {mascota.nombre}</p>
            </div>

            <button
              onClick={() => navigate(`${activeTabCfg.newPath}?mascotaId=${id}`)}
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nuevo
            </button>
          </div>

          {activeTabCfg.sec.loading ? (
            <div className="py-8 text-center">
              <svg className="animate-spin w-6 h-6 mx-auto text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 mt-2">Cargando...</p>
            </div>
          ) : activeTabCfg.sec.data.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center text-2xl">{activeTabCfg.icon}</div>
              <p className="text-sm text-gray-500">No hay {activeTabCfg.label.toLowerCase()} registradas</p>
              <button
                onClick={() => navigate(`${activeTabCfg.newPath}?mascotaId=${id}`)}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Registrar el primero
              </button>
            </div>
          ) : (
            <>
              <DataTable
                columns={activeTabCfg.columns}
                data={activeTabCfg.sec.data}
                onRowClick={(row) => navigate(`${activeTabCfg.basePath}/${row.id}`)}
                hidePagination
                showGlobalFilter={false}
              />
              {activeTabCfg.sec.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination currentPage={activeTabCfg.sec.page} totalPages={activeTabCfg.sec.totalPages} onPageChange={activeTabCfg.sec.setPage} />
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

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '—';
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) anios--;
  const meses = (m + 12) % 12;
  if (anios === 0) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'}`;
};

export default MascotaDetailPage;