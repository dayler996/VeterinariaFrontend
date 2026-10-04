import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Users,
  Calendar,
  Receipt,
  Package,
  Stethoscope,
  Syringe,
  Microscope,
  Activity,
  Scissors,
  BedDouble,
  FolderOpen,
  Dog,
  PawPrint,
  Tag,
  FolderTree,
  ClipboardList,
  Settings,
  Building2,
  Shield,
  KeyRound,
  TrendingUp,
  ScrollText,
  UserCog,
  Briefcase,
  ChevronRight,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, collapsed }) => {
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const miPerfil = user?.trabajador ? `/trabajadores/${user.trabajador.id}` : null;

  // ─── Detectar desktop (>=1024px) para el modo mini ───
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const miniMode = isDesktop && collapsed;

  // ─── Bloquear scroll body cuando el drawer móvil está abierto ───
  useEffect(() => {
    document.body.style.overflow = isOpen && !isDesktop ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isDesktop]);

  // ─── Estado de secciones (persistido en localStorage) ───
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar-sections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { medico: true, catalogos: false, sistema: false, admin: false };
  });
  useEffect(() => {
    localStorage.setItem('sidebar-sections', JSON.stringify(openSections));
  }, [openSections]);

  const toggleSection = (key) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // ─── Items principales ───
  const mainItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(miPerfil ? [{ to: miPerfil, label: 'Mi Perfil', icon: User }] : []),
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/citas', label: 'Citas', icon: Calendar },
    { to: '/facturacion', label: 'Facturación', icon: Receipt },
    { to: '/inventario', label: 'Inventario', icon: Package },
  ];

  // ─── Secciones colapsables ───
  const sections = [
    {
      key: 'medico',
      label: 'Médico',
      icon: Stethoscope,
      items: [
        { to: '/consultas', label: 'Consultas', icon: Stethoscope },
        { to: '/vacunaciones', label: 'Vacunaciones', icon: Syringe },
        { to: '/estudios', label: 'Estudios', icon: Microscope },
        { to: '/operaciones', label: 'Operaciones', icon: Activity },
        { to: '/estetica', label: 'Estética', icon: Scissors },
        { to: '/hospitalizaciones', label: 'Hospitalización', icon: BedDouble },
      ],
    },
    {
      key: 'catalogos',
      label: 'Catálogos',
      icon: FolderOpen,
      items: [
        { to: '/catalogos/tipos-estudio', label: 'Tipos de Estudio', icon: Microscope },
        { to: '/catalogos/tipos-operacion', label: 'Tipos de Operación', icon: Activity },
        { to: '/catalogos/tipos-estetica', label: 'Servicios Estética', icon: Scissors },
        { to: '/catalogos/especies', label: 'Especies', icon: Dog },
        { to: '/catalogos/razas', label: 'Razas', icon: PawPrint },
        { to: '/catalogos/vacunas', label: 'Vacunas', icon: Syringe },
        { to: '/catalogos/estados-cita', label: 'Estados de Cita', icon: ClipboardList },
        { to: '/catalogos/categorias', label: 'Categorías', icon: FolderTree },
        { to: '/catalogos/tipos-producto', label: 'Tipos de Producto', icon: Tag },
      ],
    },
    {
      key: 'sistema',
      label: 'Sistema',
      icon: Settings,
      items: [
        { to: '/configuracion/factura', label: 'Config. Factura', icon: Settings },
        { to: '/configuracion/empresa', label: 'Config. Empresa', icon: Building2, adminOnly: true },
      ],
    },
    {
      key: 'admin',
      label: 'Administración',
      icon: Shield,
      adminOnly: true,
      items: [
        { to: '/usuarios', label: 'Usuarios', icon: KeyRound },
        { to: '/reportes/ingresos', label: 'Reporte de Ingresos', icon: TrendingUp },
        { to: '/logs', label: 'Auditoría', icon: ScrollText },
        { to: '/roles', label: 'Roles', icon: Shield },
        { to: '/trabajadores', label: 'Personal', icon: UserCog },
        { to: '/cargos', label: 'Cargos', icon: Briefcase },
      ],
    },
  ];

  // ─── Clases ───
  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors
     ${isActive
       ? 'bg-blue-50 text-blue-600 font-medium'
       : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
     ${miniMode ? 'lg:justify-center lg:gap-0 lg:mx-2 lg:px-2' : ''}`;

  const renderLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onClose}
        className={linkClass}
        title={miniMode ? item.label : undefined}
      >
        <Icon
          className="w-[18px] h-[18px] shrink-0"
          strokeWidth={2}
        />
        <span className={`truncate ${miniMode ? 'lg:hidden' : ''}`}>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col
          transition-all duration-200 ease-in-out w-64
          ${miniMode ? 'lg:w-20' : 'lg:w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Cabecera */}
        <div
          className={`h-16 flex items-center border-b border-gray-100 shrink-0 ${
            miniMode ? 'lg:justify-center px-4' : 'px-4 justify-between'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
              V
            </div>
            <h1
              className={`text-lg font-bold text-blue-600 truncate ${
                miniMode ? 'lg:hidden' : ''
              }`}
            >
              Veterinaria
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-3">
          {/* Items principales */}
          <div className="space-y-0.5">{mainItems.map(renderLink)}</div>

          {/* Secciones colapsables */}
          {sections
            .filter((s) => !s.adminOnly || isAdmin)
            .map((section) => {
              const isSecOpen = openSections[section.key];
              const visibleItems = section.items.filter(
                (item) => !item.adminOnly || isAdmin
              );
              if (visibleItems.length === 0) return null;

              const SectionIcon = section.icon;

              return (
                <div key={section.key} className="mt-2">
                  {/* Encabezado — oculto en mini desktop */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className={`${
                      miniMode ? 'lg:hidden' : ''
                    } w-full flex items-center justify-between px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors`}
                  >
                    <span className="flex items-center gap-2">
                      <SectionIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {section.label}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isSecOpen ? 'rotate-90' : ''
                      }`}
                      strokeWidth={2.5}
                    />
                  </button>

                  {/* Divisor visual en mini desktop */}
                  {miniMode && (
                    <div className="hidden lg:block border-t border-gray-100 my-2 mx-3" />
                  )}

                  {/* Items */}
                  <div
                    className={`space-y-0.5 ${
                      isSecOpen || miniMode ? '' : 'hidden'
                    }`}
                  >
                    {visibleItems.map(renderLink)}
                  </div>
                </div>
              );
            })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;