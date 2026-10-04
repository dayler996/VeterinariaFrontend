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
import {
  UserCog, Pencil, CreditCard, Cake, Heart, Briefcase,
  Mail, Clock, Calendar as CalendarIcon, AlertTriangle,
  User, Power, CheckCircle2, ClipboardList,
  Stethoscope, Activity, Syringe, Microscope,
  Scissors, FileText, TrendingUp, Award,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════════════ */
const TABS = [
  {
    id: 'consultas', label: 'Consultas', Icon: Stethoscope, tone: 'blue',
    fetcher: getConsultasByTrabajador, basePath: '/consultas',
    columns: [
      {
        header: 'Fecha',
        accessorKey: 'fecha',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
        ),
      },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      {
        header: 'Motivo',
        accessorKey: 'motivo',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-500 line-clamp-2">{getValue()}</span>
        ),
      },
    ],
  },
  {
    id: 'operaciones', label: 'Operaciones', Icon: Activity, tone: 'orange',
    fetcher: getOperacionesByTrabajador, basePath: '/operaciones',
    columns: [
      {
        header: 'Fecha',
        accessorKey: 'fecha',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
        ),
      },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Tipo', accessorKey: 'tipo.nombre' },
    ],
  },
  {
    id: 'vacunas', label: 'Vacunaciones', Icon: Syringe, tone: 'emerald',
    fetcher: getVacunasByTrabajador, basePath: '/vacunaciones',
    columns: [
      {
        header: 'Fecha',
        accessorKey: 'fechaAplicacion',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
        ),
      },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Vacuna', accessorKey: 'vacuna.nombre' },
    ],
  },
  {
    id: 'estudios', label: 'Estudios', Icon: Microscope, tone: 'violet',
    fetcher: getEstudiosByTrabajador, basePath: '/estudios',
    columns: [
      {
        header: 'Fecha',
        accessorKey: 'fecha',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
        ),
      },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Tipo', accessorKey: 'tipo.nombre' },
    ],
  },
  {
    id: 'monitoreos', label: 'Monitoreos', Icon: TrendingUp, tone: 'indigo',
    fetcher: getMonitoreosByTrabajador, basePath: '/monitoreos',
    columns: [
      {
        header: 'Fecha/Hora',
        accessorKey: 'fechaHora',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleString()}
          </span>
        ),
      },
      { header: 'Mascota', accessorKey: 'hospitalizacion.mascota.nombre' },
      { header: 'Dueño', accessorKey: 'hospitalizacion.mascota.dueno.nombre' },
      {
        header: 'Observaciones',
        accessorKey: 'observaciones',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-500 line-clamp-2">{getValue() || '—'}</span>
        ),
      },
    ],
  },
  {
    id: 'estetica', label: 'Estética', Icon: Scissors, tone: 'pink',
    fetcher: getEsteticaByTrabajador, basePath: '/estetica',
    columns: [
      {
        header: 'Fecha',
        accessorKey: 'fecha',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
        ),
      },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Servicio', accessorKey: 'tipo.nombre' },
    ],
  },
  {
    id: 'facturas', label: 'Facturas', Icon: FileText, tone: 'purple',
    fetcher: getFacturasByTrabajador, basePath: '/facturacion',
    columns: [
      {
        header: 'Número',
        accessorKey: 'numero',
        cell: ({ getValue }) => (
          <span className="font-medium text-sm text-slate-800 tabular-nums">{getValue()}</span>
        ),
      },
      {
        header: 'Fecha',
        accessorKey: 'fecha',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleDateString()}
          </span>
        ),
      },
      { header: 'Cliente', accessorKey: 'cliente.nombre' },
      {
        header: 'Total',
        accessorKey: 'total',
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums font-semibold text-emerald-700">
            ${Number(getValue() || 0).toFixed(2)}
          </span>
        ),
      },
    ],
  },
  {
    id: 'citas', label: 'Citas', Icon: CalendarIcon, tone: 'cyan',
    fetcher: getCitasByTrabajador, basePath: '/citas',
    columns: [
      {
        header: 'Fecha/Hora',
        accessorKey: 'fechaHora',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
            {new Date(getValue()).toLocaleString()}
          </span>
        ),
      },
      { header: 'Mascota', accessorKey: 'mascota.nombre' },
      { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
      { header: 'Estado', accessorKey: 'estado.nombre' },
    ],
  },
];

const TONE_CLS = {
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-700',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600' },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-700',  iconBg: 'bg-orange-100',  iconText: 'text-orange-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-700',  iconBg: 'bg-violet-100',  iconText: 'text-violet-600' },
  indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-700',  iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600' },
  pink:    { bg: 'bg-pink-100',    text: 'text-pink-700',    iconBg: 'bg-pink-100',    iconText: 'text-pink-600' },
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-700',  iconBg: 'bg-purple-100',  iconText: 'text-purple-600' },
  cyan:    { bg: 'bg-cyan-100',    text: 'text-cyan-700',    iconBg: 'bg-cyan-100',    iconText: 'text-cyan-600' },
};

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/* ═══════════════════════════════════════════════════ */
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

  useEffect(() => { loadTrabajador(); /* eslint-disable-next-line */ }, [id]);

  const loadTrabajador = async () => {
    try {
      setLoading(true);
      const res = await getTrabajador(id);
      setTrabajador(res.data);
      setImageError(false);
    } catch {
      toast.error('Error al cargar trabajador');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!trabajador) return;
    const tab = TABS.find((t) => t.id === activeTab);
    const current = tabsData[activeTab];
    if (!tab || current.loaded) return;
    loadTabData(activeTab, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, trabajador]);

  const loadTabData = async (tabId, page) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (!tab) return;
    setTabsData((prev) => ({ ...prev, [tabId]: { ...prev[tabId], loading: true } }));
    try {
      const response = await tab.fetcher(id, page);
      const payload = response.data;
      setTabsData((prev) => ({
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
      setTabsData((prev) => ({ ...prev, [tabId]: { ...prev[tabId], loading: false, loaded: true } }));
    }
  };

  const handlePageChange = (newPage) => {
    const tabId = activeTab;
    setTabsData((prev) => ({ ...prev, [tabId]: { ...prev[tabId], page: newPage } }));
    loadTabData(tabId, newPage);
  };

  const handleRowClick = (row) => {
    const tab = TABS.find((t) => t.id === activeTab);
    if (tab?.basePath) navigate(`${tab.basePath}/${row.id}`);
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-slate-700 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!trabajador) {
    return (
      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Trabajador no encontrado</p>
          <button
            onClick={() => navigate('/trabajadores')}
            className="mt-3 text-slate-700 hover:text-slate-900 text-sm font-medium"
          >
            ← Volver al personal
          </button>
        </div>
      </div>
    );
  }

  const activeTabCfg = TABS.find((t) => t.id === activeTab);
  const activeData = tabsData[activeTab];
  const activeTone = TONE_CLS[activeTabCfg.tone];
  const ActiveIcon = activeTabCfg.Icon;

  /* ═══════════════ RENDER ═══════════════ */
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
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border
                ${trabajador.activo
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-slate-200 text-slate-600 border-slate-300'}`}
            >
              {trabajador.activo ? (
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
          </span>
        }
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Briefcase className="w-3.5 h-3.5" strokeWidth={2.2} />
            {trabajador.cargo?.nombre || 'Sin cargo'}
            {trabajador.usuario?.email && (
              <>
                <span className="text-slate-300">·</span>
                <Mail className="w-3.5 h-3.5" strokeWidth={2.2} />
                {trabajador.usuario.email}
              </>
            )}
          </span>
        }
        actions={
          <button
            onClick={() => navigate(`/trabajadores/${id}/editar`)}
            className="inline-flex items-center justify-center gap-1.5
                       bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium
                       hover:bg-slate-900 active:bg-black transition
                       shadow-sm shadow-slate-800/20"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.2} />
            Editar perfil
          </button>
        }
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-700/25 shrink-0">
          <UserCog className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Ficha del trabajador
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {trabajador.nombre}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <CreditCard className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            CI: {trabajador.cedula}
            {trabajador.cargo?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <Briefcase className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                {trabajador.cargo.nombre}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ═══ Card: Info trabajador ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Foto / avatar */}
          <div className="shrink-0 mx-auto sm:mx-0">
            {trabajador.foto && !imageError ? (
              <img
                src={getImageUrl(trabajador.foto)}
                alt={trabajador.nombre}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-200 shadow-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                <UserCog className="w-12 h-12 text-slate-400" strokeWidth={1.8} />
              </div>
            )}
          </div>

          {/* Datos */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoBlock icon={CreditCard} label="Cédula" value={trabajador.cedula} />
              <InfoBlock
                icon={Heart}
                label="Sexo"
                value={trabajador.sexo === 'M' ? 'Masculino' : trabajador.sexo === 'F' ? 'Femenino' : '—'}
              />
              <InfoBlock
                icon={Cake}
                label="Nacimiento"
                value={trabajador.fechaNacimiento ? new Date(trabajador.fechaNacimiento).toLocaleDateString() : '—'}
              />
              <InfoBlock
                icon={Briefcase}
                label="Cargo"
                value={trabajador.cargo?.nombre || '—'}
              />
              <InfoBlock
                icon={Award}
                label="Edad"
                value={calcularEdad(trabajador.fechaNacimiento)}
              />
              <InfoBlock
                icon={Mail}
                label="Usuario"
                value={trabajador.usuario?.email || 'No asociado'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Card: Horarios ═══ */}
      {trabajador.horarios && trabajador.horarios.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Clock className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Horarios
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {trabajador.horarios.length}
            </span>
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-slate-100/80">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Día
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Inicio
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Fin
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trabajador.horarios.map((h, idx) => (
                  <tr key={idx} className="hover:bg-white transition">
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                      {DIAS_SEMANA[h.diaSemana] || `Día ${h.diaSemana}`}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 tabular-nums">
                      {h.horaInicio}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 tabular-nums">
                      {h.horaFin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: cards */}
          <div className="md:hidden space-y-2">
            {trabajador.horarios.map((h, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {DIAS_SEMANA[h.diaSemana] || `Día ${h.diaSemana}`}
                  </span>
                </div>
                <span className="text-xs text-slate-600 tabular-nums whitespace-nowrap font-medium">
                  {h.horaInicio} – {h.horaFin}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Tabs ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="border-b border-slate-100 overflow-x-auto">
          <nav className="flex gap-1 px-2 sm:px-3 min-w-max">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tabsData[tab.id]?.total;
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition
                    ${isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums
                      ${isActive ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-slate-800 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-5">
          {/* Header del tab activo */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTone.iconBg}`}>
              <ActiveIcon className={`w-4 h-4 ${activeTone.iconText}`} strokeWidth={2.2} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">
              {activeTabCfg.label}
            </h2>
            {activeData.total > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
                {activeData.total}
              </span>
            )}
          </div>

          {activeData.loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-slate-700 rounded-full" />
              <p className="text-sm text-slate-500 mt-3">
                Cargando {activeTabCfg.label.toLowerCase()}...
              </p>
            </div>
          ) : activeData.data.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${activeTone.iconBg}`}>
                <ActiveIcon className={`w-7 h-7 ${activeTone.iconText}`} strokeWidth={1.8} />
              </div>
              <p className="text-sm text-slate-500 font-medium px-4">
                No hay {activeTabCfg.label.toLowerCase()} registradas
              </p>
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
                  <Pagination
                    currentPage={activeData.page}
                    totalPages={activeData.totalPages}
                    onPageChange={handlePageChange}
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

/* ═══════════════ Bloque de info reutilizable ═══════════════ */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  }[tone];

  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneCls.bg}`}>
        <Icon className={`w-4 h-4 ${toneCls.text}`} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 mt-0.5 break-words truncate" title={value}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
};

/* ═══════════════ Cálculo de edad ═══════════════ */
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