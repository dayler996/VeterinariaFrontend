// frontend/src/components/common/Layout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /* Móvil: abre/cierra el drawer */
  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) setSidebarOpen((o) => !o);
    else setCollapsed((c) => !c);
  };

  /* Desktop: solo colapsa/expande (usado por el botón del sidebar) */
  const handleToggleCollapse = () => setCollapsed((c) => !c);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}   /* 👈 nuevo */
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
          collapsed={collapsed}
        />

        <main className="relative flex-1 overflow-y-auto bg-slate-50 scroll-smooth">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0
                       bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)]
                       [background-size:24px_24px] opacity-[0.35]"
          />

          <div className="relative p-4 md:p-6 lg:p-7 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;