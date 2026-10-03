import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  const miPerfil = user?.trabajador ? `/trabajadores/${user.trabajador.id}` : null;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    ...(miPerfil ? [{ to: miPerfil, label: 'Mi Perfil', icon: '👤' }] : []),
    { to: '/clientes', label: 'Clientes', icon: '👥' },
    { to: '/citas', label: 'Citas', icon: '📅' },
    { to: '/facturacion', label: 'Facturación', icon: '💰' },
    { to: '/inventario', label: 'Inventario', icon: '📦' },
    { to: '/consultas', label: 'Consultas', icon: '🩺' },
    { to: '/vacunaciones', label: 'Vacunaciones', icon: '💉' },
    { to: '/estudios', label: 'Estudios', icon: '🔬' },
    { to: '/operaciones', label: 'Operaciones', icon: '⚕️' },
    { to: '/estetica', label: 'Estética', icon: '✂️' },
    { to: '/hospitalizaciones', label: 'Hospitalización', icon: '🏥' },
    { to: '/configuracion/factura', label: 'Config. Factura', icon: '⚙️' },
  ];

  const adminItems = [
    { to: '/usuarios', label: 'Usuarios', icon: '🔐' },
    // En adminItems
    { to: '/reportes/ingresos', label: 'Reporte de Ingresos', icon: '📈' },
    { to: '/logs', label: 'Auditoría', icon: '📋' },
    { to: '/roles', label: 'Roles', icon: '⚙️' },
    { to: '/trabajadores', label: 'Personal', icon: '👨‍⚕️' },
    { to: '/cargos', label: 'Cargos', icon: '📋' }, // Nuevo
    { to: '/configuracion/empresa', label: 'Config. Empresa', icon: '🏢' },
  ];

  const catalogItems = [
    { to: '/catalogos/tipos-estudio', label: 'Tipos de Estudio', icon: '🔬' },
    { to: '/catalogos/tipos-operacion', label: 'Tipos de Operación',  icon: '⚕️' },
    { to: '/catalogos/tipos-estetica', label: 'Servicios Estética', icon: '✂️' },
    { to: '/catalogos/especies', label: 'Especies', icon: '🐶' },
    { to: '/catalogos/razas', label: 'Razas', icon: '🐾' },
    { to: '/catalogos/vacunas', label: 'Vacunas', icon: '💉' },
    { to: '/catalogos/estados-cita', label: 'Estados de Cita', icon: '📌' },
    { to: '/catalogos/categorias', label: 'Categorías', icon: '📂' },
    // Nuevo ítem para Tipos de Producto
    { to: '/catalogos/tipos-producto', label: 'Tipos de Producto', icon: '🏷️' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-md shadow-lg"
        aria-label="Menú"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 transition duration-200 ease-in-out z-40 w-64 bg-white shadow-lg lg:shadow`}
      >
        <div className="p-4">
          <h1 className="text-xl font-bold text-blue-600">Veterinaria</h1>
        </div>
        <nav className="mt-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                  isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="border-t my-2"></div>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Catálogos
          </div>
          {catalogItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                  isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="border-t my-2"></div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administración
              </div>
              {adminItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                      isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;