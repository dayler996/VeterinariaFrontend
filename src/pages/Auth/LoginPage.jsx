import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getConfiguracionPublica } from '../../services/configuracionService';
import { getImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().min(1, 'Email o nombre de usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // ✅ Endpoint PÚBLICO — no requiere token, no dispara 401
      const res = await getConfiguracionPublica();
      const data = res.data || {};
      setCompanyName(data.nombre || 'Veterinaria');
      setCompanyLogo(data.logo || null);
    } catch (error) {
      console.error('Error al cargar configuración pública', error);
      setCompanyName('Veterinaria');
    } finally {
      setLoadingSettings(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      toast.success('Inicio de sesión exitoso');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  /* ── Skeleton mientras carga settings ── */
  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-pulse">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8" />
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          {/* Logo + nombre */}
          <div className="text-center mb-6 sm:mb-8">
            {companyLogo ? (
              <img
                src={getImageUrl(companyLogo)}
                alt={companyName}
                className="h-16 sm:h-20 mx-auto mb-3 sm:mb-4 object-contain"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-3 sm:mb-4 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg shadow-blue-600/20">
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate px-2">
              {companyName}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Sistema de Gestión Veterinaria
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5" noValidate>
            {/* Email / usuario */}
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-medium mb-1.5"
              >
                Email o usuario
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                autoFocus
                {...register('email')}
                disabled={loading}
                placeholder="usuario@ejemplo.com"
                className={`w-full px-3 py-2.5 text-sm sm:text-base border rounded-lg transition
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-50 disabled:text-gray-500
                  ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.email && (
                <p className="text-red-600 text-xs sm:text-sm mt-1.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-medium mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  disabled={loading}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2.5 pr-11 text-sm sm:text-base border rounded-lg transition
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:bg-gray-50 disabled:text-gray-500
                    ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 transition"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs sm:text-sm mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2
                bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium
                hover:bg-blue-700 active:bg-blue-800
                transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                shadow-sm shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Iniciando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer discreto */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} {companyName}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;