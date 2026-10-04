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
import {
  PawPrint, Pencil, Calendar, FileText, Trash2,
  Dog, Cat, Heart, User, Users as UsersIcon,
  AlertTriangle, Plus, ClipboardList, Stethoscope,
  Syringe, Microscope, Scissors, BedDouble, Activity,
} from 'lucide-react';

/* ── Hook secciones paginadas ── */
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
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mascotaId) cargarPagina(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaId, page]);

  return { data, page, totalPages, total, loading, loaded, setPage };
};

/* ═══════════════════════════════════════════════════ */
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

  useEffect(() => { loadMascota(); /* eslint-disable-next-line */ }, [id]);

  const loadMascota = async () => {
    try {
      setLoadingMascota(true);
      const res = await getMascota(id);
      setMascota(res.data);
      setImageError(false);
    } catch {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoadingMascota(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error('No tienes permiso para eliminar');
      return;
    }
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
    } catch {
      toast.error('Error al eliminar');
    }
  };

  /* ── Columnas DataTable ── */
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
    { id: 'consultas', label: 'Consultas', Icon: Stethoscope, sec: consultas, columns: columnsConsultas, basePath: '/consultas', newPath: '/consultas/nueva' },
    { id: 'vacunaciones', label: 'Vacunas', Icon: Syringe, sec: vacunaciones, columns: columnsVacunas, basePath: '/vacunaciones', newPath: '/vacunaciones/nueva' },
    { id: 'estudios', label: 'Estudios', Icon: Microscope, sec: estudios, columns: columnsEstudios, basePath: '/estudios', newPath: '/estudios/nueva' },
    { id: 'operaciones', label: 'Operaciones', Icon: Activity, sec: operaciones, columns: columnsOperaciones, basePath: '/operaciones', newPath: '/operaciones/nueva' },
    { id: 'estetica', label: 'Estética', Icon: Scissors, sec: estetica, columns: columnsEstetica, basePath: '/estetica', newPath: '/estetica/nueva' },
    { id: 'hospitalizaciones', label: 'Hospitalización', Icon: BedDouble, sec: hospitalizaciones, columns: columnsHospitalizaciones, basePath: '/hospitalizaciones', newPath: '/hospitalizaciones/nueva' },
  ];

  const activeTabCfg = tabs.find((t) => t.id === activeTab);

  if (loadingMascota) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-cyan-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!mascota) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Mascota no encontrada</p>
          <button
            onClick={() => navigate('/clientes')}
            className="mt-3 text-cyan-600 hover:text-cyan-800 text-sm font-medium"
          >
            ← Volver a clientes
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
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
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Dog className="w-3.5 h-3.5" strokeWidth={2.2} />
            {mascota.especie?.nombre || 'Sin especie'}
            {mascota.raza?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span>{mascota.raza.nombre}</span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/mascotas/${id}/editar`)}
              className="inline-flex items-center justify-center gap-1.5
                         bg-white text-slate-700 border border-slate-200
                         px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <Pencil className="w-4 h-4" strokeWidth={2.2} />
              Editar
            </button>
            <button
              onClick={() => navigate(`/citas/nueva?mascotaId=${id}`)}
              className="inline-flex items-center justify-center gap-1.5
                         bg-cyan-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-cyan-700 active:bg-cyan-800 transition
                         shadow-sm shadow-cyan-600/20"
            >
              <Calendar className="w-4 h-4" strokeWidth={2.2} />
              Cita
            </button>
            <button
              onClick={() => navigate(`/mascotas/${id}/historial`)}
              className="inline-flex items-center justify-center gap-1.5
                         bg-violet-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-violet-700 active:bg-violet-800 transition
                         shadow-sm shadow-violet-600/20"
            >
              <FileText className="w-4 h-4" strokeWidth={2.2} />
              Historial
            </button>
            {isAdmin && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-1.5
                           bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                           hover:bg-red-700 active:bg-red-800 transition
                           shadow-sm shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.2} />
                Eliminar
              </button>
            )}
          </>
        }
      />

      {/* ═══ Card: Info mascota ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Foto / avatar */}
          <div className="shrink-0 mx-auto sm:mx-0">
            {mascota.foto && !imageError ? (
              <img
                src={getImageUrl(mascota.foto)}
                alt={mascota.nombre}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-200 shadow-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-2xl flex items-center justify-center border border-cyan-100">
                <PawPrint className="w-12 h-12 text-cyan-500" strokeWidth={1.8} />
              </div>
            )}
          </div>

          {/* Datos */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoBlock
                icon={Dog}
                label="Especie"
                value={mascota.especie?.nombre}
                tone="cyan"
              />
              <InfoBlock
                icon={Cat}
                label="Raza"
                value={mascota.raza?.nombre}
                tone="cyan"
              />
              <InfoBlock
                icon={Heart}
                label="Sexo"
                value={mascota.sexo === 'M' ? 'Masculino' : mascota.sexo === 'F' ? 'Femenino' : '—'}
                tone="cyan"
              />
              <InfoBlock
                icon={Calendar}
                label="Nacimiento"
                value={mascota.fechaNacimiento ? new Date(mascota.fechaNacimiento).toLocaleDateString() : '—'}
                tone="cyan"
              />
              <InfoBlock
                icon={Activity}
                label="Edad aprox."
                value={calcularEdad(mascota.fechaNacimiento)}
                tone="cyan"
              />
              <div className="min-w-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-cyan-50 text-cyan-600">
                    <UsersIcon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Dueño
                    </p>
                    <Link
                      to={`/clientes/${mascota.dueno?.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-900 hover:underline mt-0.5"
                    >
                      {mascota.dueno?.nombre || '—'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Nav tabs */}
        <div className="border-b border-slate-100 overflow-x-auto">
          <nav className="flex gap-1 px-2 sm:px-3 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition ${
                    isActive ? 'text-cyan-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>{tab.label}</span>
                  {tab.sec.total > 0 && (
                    <span
                      className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                        isActive ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tab.sec.total}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido tab activo */}
        <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1 h-5 bg-cyan-600 rounded-full"></span>
              <activeTabCfg.Icon className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
              <h2 className="text-base font-semibold text-slate-800">
                {activeTabCfg.label}
              </h2>
              {activeTabCfg.sec.total > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
                  {activeTabCfg.sec.total}
                </span>
              )}
            </div>

            <button
              onClick={() => navigate(`${activeTabCfg.newPath}?mascotaId=${id}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5
                         bg-cyan-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium
                         hover:bg-cyan-700 active:bg-cyan-800 transition
                         shadow-sm shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Nuevo
            </button>
          </div>

          {activeTabCfg.sec.loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-cyan-600 rounded-full" />
              <p className="text-sm text-slate-500 mt-3">Cargando...</p>
            </div>
          ) : activeTabCfg.sec.data.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                <activeTabCfg.Icon className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
              </div>
              <p className="text-sm text-slate-500 font-medium px-4">
                No hay {activeTabCfg.label.toLowerCase()} registradas
              </p>
              <button
                onClick={() => navigate(`${activeTabCfg.newPath}?mascotaId=${id}`)}
                className="mt-3 text-cyan-600 hover:text-cyan-800 text-sm font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Registrar el primero
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
                  <Pagination
                    currentPage={activeTabCfg.sec.page}
                    totalPages={activeTabCfg.sec.totalPages}
                    onPageChange={activeTabCfg.sec.setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Bloque de info reutilizable ── */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    cyan: 'bg-cyan-50 text-cyan-600',
    slate: 'bg-slate-100 text-slate-500',
  }[tone];

  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneCls}`}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">
          {value || '—'}
        </p>
      </div>
    </div>
  );
};

/* ── Cálculo de edad ── */
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