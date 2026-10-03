import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-2 sm:py-3 ml-12 lg:ml-0">
        {/* ml-12 en móvil para no pegarse al botón, en lg se quita */}
        <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
          Bienvenido, {user?.trabajador?.nombre || user?.email}
        </h2>
        <div className="flex items-center gap-4">
          {user?.trabajador && (
            <a
              href={`/trabajadores/${user.trabajador.id}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
            >
              {user.trabajador.foto ? (
                <img
                  src={user.trabajador.foto}
                  alt={user.trabajador.nombre}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white">
                  👤
                </span>
              )}
              <span className="hidden sm:inline">Mi Perfil</span>
            </a>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 w-full sm:w-auto"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;