import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getCompanySettings } from '../../services/companyService';
import { getImageUrl } from '../../utils/imageUtils';
import {
  Users, Calendar, Receipt, Package, Stethoscope,
  BedDouble, Syringe, Microscope, Scissors, Activity,
  ShieldCheck, KeyRound, Settings2, UserCog, Briefcase,
  ArrowRight, PawPrint, Sparkles, Clock, TrendingUp,
  Building2, Shield, UserPlus, CalendarPlus, FilePlus,
  ChevronRight, LogIn,
} from 'lucide-react';

/* ── Config de módulos generales ── */
const modulesGenerales = [
  {
    title: 'Clientes',
    description: 'Administrar clientes y mascotas',
    to: '/clientes',
    Icon: Users,
    tone: 'cyan',
  },
  {
    title: 'Citas',
    description: 'Agendar y gestionar citas',
    to: '/citas',
    Icon: Calendar,
    tone: 'blue',
  },
  {
    title: 'Consultas',
    description: 'Registro de consultas médicas',
    to: '/consultas',
    Icon: Stethoscope,
    tone: 'sky',
  },
  {
    title: 'Vacunaciones',
    description: 'Control de vacunas',
    to: '/vacunaciones',
    Icon: Syringe,
    tone: 'emerald',
  },
  {
    title: 'Estudios',
    description: 'Análisis y laboratorio',
    to: '/estudios',
    Icon: Microscope,
    tone: 'violet',
  },
  {
    title: 'Operaciones',
    description: 'Cirugías y procedimientos',
    to: '/operaciones',
    Icon: Activity,
    tone: 'orange',
  },
  {
    title: 'Estética',
    description: 'Servicios de peluquería',
    to: '/estetica',
    Icon: Scissors,
    tone: 'pink',
  },
  {
    title: 'Hospitalización',
    description: 'Pacientes internados',
    to: '/hospitalizaciones',
    Icon: BedDouble,
    tone: 'indigo',
  },
  {
    title: 'Facturación',
    description: 'Facturas y pagos',
    to: '/facturacion',
    Icon: Receipt,
    tone: 'purple',
  },
  {
    title: 'Inventario',
    description: 'Productos y stock',
    to: '/inventario',
    Icon: Package,
    tone: 'amber',
  },
];

/* ── Config de módulos admin ── */
const modulesAdmin = [
  {
    title: 'Usuarios',
    description: 'Cuentas y accesos',
    to: '/usuarios',
    Icon: UserCog,
    tone: 'slate',
  },
  {
    title: 'Roles',
    description: 'Permisos y roles',
    to: '/roles',
    Icon: Shield,
    tone: 'slate',
  },
  {
    title: 'Personal',
    description: 'Trabajadores y horarios',
    to: '/trabajadores',
    Icon: Briefcase,
    tone: 'slate',
  },
];

/* ── Accesos rápidos ── */
const quickActions = [
  { label: 'Nuevo cliente', to: '/clientes/nuevo', Icon: UserPlus, tone: 'cyan' },
  { label: 'Nueva cita', to: '/citas/nueva', Icon: CalendarPlus, tone: 'blue' },
  { label: 'Nueva consulta', to: '/consultas/nueva', Icon: FilePlus, tone: 'sky' },
];

/* ═══════════════════════════════════════════════════ */
const DashboardPage = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const userName = user?.trabajador?.nombre || user?.email || 'Usuario';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanyName(settings.name || '');
      setCompanyLogo(settings.logo);
    } catch (error) {
      console.error('Error al cargar configuración', error);
    } finally {
      setLoading(false);
    }
  };

  const saludo = obtenerSaludo();

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando panel...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4 pb-10">
      {/* ═══ Hero / Bienvenida ═══ */}
      <section className="relative overflow-hidden rounded-2xl mb-5 sm:mb-6
                          bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800
                          shadow-lg shadow-slate-900/10">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500 blur-3xl" />
        </div>

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Logo */}
            <div className="shrink-0">
              {companyLogo ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm
                                border border-white/20 flex items-center justify-center p-2 shadow-xl">
                  <img
                    src={getImageUrl(companyLogo)}
                    alt={companyName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                                bg-gradient-to-br from-blue-500 to-cyan-500
                                flex items-center justify-center text-white text-3xl font-bold
                                shadow-xl shadow-blue-500/30">
                  {(companyName || 'V').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Texto */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">
                  {saludo}
                </p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                    bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wide
                                    border border-amber-400/30">
                    <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                    Admin
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 truncate">
                {userName}
              </h1>
              {companyName && (
                <p className="text-sm text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                  <span className="truncate">{companyName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Acciones rápidas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickActions.map((qa) => {
                const Icon = qa.Icon;
                return (
                  <Link
                    key={qa.to}
                    to={qa.to}
                    className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                               bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                               backdrop-blur-sm transition active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0
                                    group-hover:bg-blue-500 transition">
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                    </div>
                    <span className="text-sm font-medium text-white truncate flex-1">
                      {qa.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" strokeWidth={2.5} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Módulos principales ═══ */}
      <section className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">
            Módulos del sistema
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
            {modulesGenerales.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {modulesGenerales.map((mod) => (
            <ModuleCard key={mod.to} {...mod} />
          ))}
        </div>
      </section>

      {/* ═══ Módulos de Administración (solo ADMIN) ═══ */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              Administración
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                              bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide
                              border border-amber-200">
              <Shield className="w-3 h-3" strokeWidth={2.5} />
              Acceso restringido
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modulesAdmin.map((mod) => (
              <ModuleCard key={mod.to} {...mod} admin />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/* ═══════════════ Card de módulo ═══════════════ */
const ModuleCard = ({ title, description, to, Icon, tone = 'slate', admin = false }) => {
  const toneCls = {
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    hover: 'group-hover:from-cyan-500 group-hover:to-cyan-600',    border: 'hover:border-cyan-300',    ring: 'hover:ring-cyan-100' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    hover: 'group-hover:from-blue-500 group-hover:to-blue-600',    border: 'hover:border-blue-300',    ring: 'hover:ring-blue-100' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     hover: 'group-hover:from-sky-500 group-hover:to-sky-600',     border: 'hover:border-sky-300',     ring: 'hover:ring-sky-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:from-emerald-500 group-hover:to-emerald-600', border: 'hover:border-emerald-300', ring: 'hover:ring-emerald-100' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  hover: 'group-hover:from-violet-500 group-hover:to-violet-600',  border: 'hover:border-violet-300',  ring: 'hover:ring-violet-100' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  hover: 'group-hover:from-orange-500 group-hover:to-orange-600',  border: 'hover:border-orange-300',  ring: 'hover:ring-orange-100' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    hover: 'group-hover:from-pink-500 group-hover:to-pink-600',    border: 'hover:border-pink-300',    ring: 'hover:ring-pink-100' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  hover: 'group-hover:from-indigo-500 group-hover:to-indigo-600',  border: 'hover:border-indigo-300',  ring: 'hover:ring-indigo-100' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  hover: 'group-hover:from-purple-500 group-hover:to-purple-600',  border: 'hover:border-purple-300',  ring: 'hover:ring-purple-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   hover: 'group-hover:from-amber-500 group-hover:to-amber-600',   border: 'hover:border-amber-300',   ring: 'hover:ring-amber-100' },
    slate:   { bg: 'bg-slate-100',  text: 'text-slate-600',   hover: 'group-hover:from-slate-700 group-hover:to-slate-800',   border: 'hover:border-slate-400',   ring: 'hover:ring-slate-200' },
  }[tone];

  return (
    <Link
      to={to}
      className={`group block bg-white rounded-xl border ${admin ? 'border-amber-200/60' : 'border-slate-200/60'}
                 p-4 transition-all duration-200
                 hover:shadow-lg hover:-translate-y-0.5
                 hover:ring-2 ${toneCls.ring}
                 ${toneCls.border}
                 active:scale-[0.99]`}
    >
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                     ${toneCls.bg} ${toneCls.text}
                     bg-gradient-to-br group-hover:text-white transition-colors duration-200
                     ${toneCls.hover}`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-slate-800 truncate">
              {title}
            </h3>
            {admin && (
              <Shield className="w-3 h-3 text-amber-500 shrink-0" strokeWidth={2.5} />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug">
            {description}
          </p>
        </div>

        {/* Flecha */}
        <ArrowRight
          className="w-4 h-4 text-slate-300 shrink-0 mt-1
                     group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all"
          strokeWidth={2.2}
        />
      </div>
    </Link>
  );
};

/* ═══════════════ Saludo según hora ═══════════════ */
function obtenerSaludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default DashboardPage;