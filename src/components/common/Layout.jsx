import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // drawer móvil
  const [collapsed, setCollapsed] = useState(false);      // mini en desktop

  // Un solo handler: decide según el tamaño de pantalla
  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(o => !o);      // móvil → drawer
    } else {
      setCollapsed(c => !c);        // desktop → colapsar
    }
  };

  // Si el usuario agranda la ventana, cierra el drawer móvil
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
          collapsed={collapsed}
        />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;