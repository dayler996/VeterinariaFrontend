import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';

const Header = ({ onMenuClick, sidebarOpen, collapsed }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm shrink-0">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* ⬇️ HAMBURGUESA — visible en TODOS los tamaños */}
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 -ml-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Alternar menú"
            title="Alternar menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
            Bienvenido, {user?.trabajador?.nombre || user?.email}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {user?.trabajador && (
            <a href={`/trabajadores/${user.trabajador.id}`}
               className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
              {user.trabajador.foto ? (
                <img src={getImageUrl(user.trabajador.foto)} alt={user.trabajador.nombre}
                     className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white">
                  👤
                </span>
              )}
              <span className="hidden sm:inline">Mi Perfil</span>
            </a>
          )}

          <button onClick={logout}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white bg-red-600 rounded hover:bg-red-700 whitespace-nowrap">
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;