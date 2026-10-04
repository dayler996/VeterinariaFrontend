// frontend/src/components/common/Sidebar.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, User, Users, Calendar, Receipt, Package,
  Stethoscope, Syringe, Microscope, Activity, Scissors, BedDouble,
  FolderOpen, Dog, PawPrint, Tag, FolderTree, ClipboardList,
  Settings, Building2, Shield, KeyRound, TrendingUp, ScrollText,
  UserCog, Briefcase, ChevronRight, ChevronLeft, X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const miPerfil = user?.trabajador ? `/trabajadores/${user.trabajador.id}` : null;

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const miniMode = isDesktop && collapsed;

  useEffect(() => {
    document.body.style.overflow = isOpen && !isDesktop ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isDesktop]);

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

  /* ══════════════════════════════════════════════
     ⚠️ Secciones con adminOnly:true → SOLO ADMIN
     ══════════════════════════════════════════════ */
  const mainItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(miPerfil ? [{ to: miPerfil, label: 'Mi Perfil', icon: User }] : []),
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/citas', label: 'Citas', icon: Calendar },
    { to: '/facturacion', label: 'Facturación', icon: Receipt },
    { to: '/inventario', label: 'Inventario', icon: Package },
  ];

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
      adminOnly: true,
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
      adminOnly: true,
      items: [
        { to: '/configuracion/factura', label: 'Config. Factura', icon: Settings },
        { to: '/configuracion/empresa', label: 'Config. Empresa', icon: Building2 },
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

  /* ── Clases de link ── */
  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-all duration-150
     ${isActive
       ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-white font-medium shadow-sm'
       : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}
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
        {({ isActive }) => (
          <>
            {isActive && !miniMode && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full
                               bg-gradient-to-b from-cyan-400 to-blue-500" />
            )}
            {isActive && miniMode && (
              <span className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full
                               bg-gradient-to-b from-cyan-400 to-blue-500" />
            )}
            <Icon
              className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                isActive ? 'text-cyan-400' : ''
              }`}
              strokeWidth={2}
            />
            <span className={`truncate ${miniMode ? 'lg:hidden' : ''}`}>
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40
          bg-slate-900 text-slate-100
          border-r border-slate-800
          flex flex-col
          transition-all duration-300 ease-in-out
          w-64
          ${miniMode ? 'lg:w-20' : 'lg:w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* ═══════════════════════════════════════════
            Cabecera con logo + botón de colapsar
            - En miniMode: el logo es clickeable y al hover
              cambia el paw por un chevron derecho.
            - Expandido: botón chevron-left a la derecha.
            - Móvil: botón X para cerrar el drawer.
            ═══════════════════════════════════════════ */}
        <div
          className={`h-16 flex items-center border-b border-slate-800 shrink-0
            ${miniMode ? 'lg:justify-center lg:px-3' : 'px-4 justify-between'}`}
        >
          {/* Logo */}
          {miniMode ? (
            /* ── Logo clickeable para expandir (solo mini desktop) ── */
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex group relative w-9 h-9 rounded-xl
                         bg-gradient-to-br from-cyan-500 to-blue-600
                         items-center justify-center text-white shrink-0
                         shadow-lg shadow-cyan-500/20
                         hover:scale-105 active:scale-95 transition-transform"
              title="Expandir menú"
              aria-label="Expandir menú"
            >
              <PawPrint
                className="w-5 h-5 absolute transition-opacity duration-150
                           opacity-100 group-hover:opacity-0"
                strokeWidth={2.2}
              />
              <ChevronRight
                className="w-5 h-5 absolute transition-opacity duration-150
                           opacity-0 group-hover:opacity-100"
                strokeWidth={2.2}
              />
            </button>
          ) : (
            /* ── Logo estático (expandido o móvil) ── */
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600
                              flex items-center justify-center text-white shrink-0
                              shadow-lg shadow-cyan-500/20">
                <PawPrint className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  VetApp
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight uppercase tracking-wider">
                  Portal Clínico
                </p>
              </div>
            </div>
          )}

          {/* ── Botón colapsar (solo desktop expandido) ── */}
          {!miniMode && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg
                         text-slate-500 hover:text-white hover:bg-slate-800
                         transition shrink-0"
              title="Colapsar menú"
              aria-label="Colapsar menú"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
            </button>
          )}

          {/* ── Botón cerrar (solo móvil) ── */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* ═══════════════════════════════════════════
            NAV con scrollbar personalizado (Tailwind-only)
            ═══════════════════════════════════════════ */}
        <nav
          className="flex-1 overflow-y-auto py-3
            [scrollbar-width:thin]
            [scrollbar-color:rgba(71,85,105,0.6)_transparent]
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar]:h-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-track]:my-2
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-slate-700/70
            [&::-webkit-scrollbar-thumb]:border
            [&::-webkit-scrollbar-thumb]:border-solid
            [&::-webkit-scrollbar-thumb]:border-transparent
            [&::-webkit-scrollbar-thumb]:bg-clip-padding
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80
            [&::-webkit-scrollbar-corner]:bg-transparent"
        >
          <div className="space-y-0.5">{mainItems.map(renderLink)}</div>

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
                <div key={section.key} className="mt-3">
                  {miniMode && (
                    <div className="hidden lg:block border-t border-slate-800 my-2 mx-3" />
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className={`${miniMode ? 'lg:hidden' : ''}
                      w-full flex items-center justify-between px-4 py-1.5
                      text-[10px] font-bold text-slate-500 uppercase tracking-widest
                      hover:text-slate-300 transition-colors`}
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

        {/* ═══ Footer ═══ */}
        <div className={`border-t border-slate-800 p-3 shrink-0 ${miniMode ? 'lg:hidden' : ''}`}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            © {new Date().getFullYear()}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            VetApp · v1.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;