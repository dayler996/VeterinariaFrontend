import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';
import { Link } from 'react-router-dom';
import {
  Menu, User as UserIcon, LogOut, ChevronDown,
  UserCog, Settings, Mail, Shield, Bell,
} from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const userName = user?.trabajador?.nombre || user?.email || 'Usuario';
  const userEmail = user?.email;
  const userCargo = user?.trabajador?.cargo?.nombre;
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  /* Cerrar el menú al hacer click fuera */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  /* Cerrar con Escape */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shrink-0">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-5 lg:px-6 h-14 sm:h-16">

        {/* ═══ Izquierda: menú + saludo ═══ */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Hamburguesa */}
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900
                       hover:bg-slate-100 active:bg-slate-200 transition shrink-0"
            aria-label="Alternar menú"
            title="Alternar menú"
          >
            <Menu className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* Saludo (desktop) */}
          <div className="hidden sm:block min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
              ¡Hola, {userName.split(' ')[0]}! 👋
            </p>
            <p className="text-[11px] text-slate-500 truncate leading-tight">
              Bienvenido de vuelta
            </p>
          </div>

          {/* Saludo (móvil) */}
          <div className="sm:hidden min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
              {userName.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* ═══ Derecha: avatar + menú ═══ */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Badge admin (desktop) */}
          {isAdmin && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                              bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide
                              border border-amber-200">
              <Shield className="w-3 h-3" strokeWidth={2.5} />
              Admin
            </span>
          )}

          {/* Botón perfil con dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-full
                         border transition-all
                ${menuOpen
                  ? 'bg-slate-100 border-slate-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
              aria-label="Menú de usuario"
            >
              {/* Avatar */}
              {user?.trabajador?.foto ? (
                <img
                  src={getImageUrl(user.trabajador.foto)}
                  alt={userName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full
                                bg-gradient-to-br from-slate-700 to-slate-800
                                flex items-center justify-center text-white shrink-0">
                  <UserIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                </span>
              )}

              {/* Nombre (desktop) */}
              <div className="hidden md:block text-left max-w-[140px] min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {userName}
                </p>
                {userCargo && (
                  <p className="text-[10px] text-slate-500 truncate leading-tight">
                    {userCargo}
                  </p>
                )}
              </div>

              {/* Chevron */}
              <ChevronDown
                className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform shrink-0
                  ${menuOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 sm:w-72
                           bg-white rounded-xl shadow-xl shadow-slate-900/10
                           border border-slate-200/80 overflow-hidden
                           animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Info del usuario */}
                <div className="p-3.5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {user?.trabajador?.foto ? (
                      <img
                        src={getImageUrl(user.trabajador.foto)}
                        alt={userName}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800
                                      flex items-center justify-center text-white shrink-0">
                        <UserIcon className="w-5 h-5" strokeWidth={2.2} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {userName}
                      </p>
                      {userEmail && (
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                          {userEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges de rol */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {userCargo && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                        bg-slate-100 text-slate-700 text-[10px] font-semibold
                                        border border-slate-200">
                        <UserCog className="w-2.5 h-2.5" strokeWidth={2.5} />
                        {userCargo}
                      </span>
                    )}
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                        bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide
                                        border border-amber-200">
                        <Shield className="w-2.5 h-2.5" strokeWidth={2.5} />
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-1.5">
                  {user?.trabajador?.id && (
                    <Link
                      to={`/trabajadores/${user.trabajador.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                 text-sm font-medium text-slate-700
                                 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
                      </div>
                      <span className="flex-1">Mi perfil</span>
                    </Link>
                  )}

                  <Link
                    to="/perfil/configuracion"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                               text-sm font-medium text-slate-700
                               hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
                    </div>
                    <span className="flex-1">Configuración</span>
                  </Link>

                  {/* Separador */}
                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                               text-sm font-medium text-red-600
                               hover:bg-red-50 active:bg-red-100 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4 text-red-600" strokeWidth={2.2} />
                    </div>
                    <span className="flex-1 text-left">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botón logout directo (desktop, si no quieres dropdown) */}
          {/* Puedes descomentar si prefieres botón rápido aparte */}
          {/*
          <button
            onClick={logout}
            className="hidden lg:inline-flex items-center gap-1.5
                       px-3 py-2 rounded-lg text-sm font-medium
                       bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition
                       shadow-sm shadow-red-600/20"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.2} />
            <span className="hidden xl:inline">Cerrar sesión</span>
          </button>
          */}
        </div>
      </div>
    </header>
  );
};

export default Header;