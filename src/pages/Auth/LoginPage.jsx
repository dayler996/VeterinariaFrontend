// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { getCompanyName, getCompanyLogo } from '../../services/companyService';
// import { getImageUrl } from '../../utils/imageUtils';
// import toast from 'react-hot-toast';

// const schema = z.object({
//   email: z.string().min(1, 'Email o nombre de usuario requerido'),
//   password: z.string().min(1, 'Contraseña requerida')
// });

// const LoginPage = () => {
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [companyName, setCompanyName] = useState('');
//   const [companyLogo, setCompanyLogo] = useState(null);

//   const { register, handleSubmit, formState: { errors } } = useForm({
//     resolver: zodResolver(schema)
//   });

//   useEffect(() => {
//     setCompanyName(getCompanyName());
//     setCompanyLogo(getCompanyLogo());
//   }, []);

//   const onSubmit = async (data) => {
//     try {
//       setLoading(true);
//       await login(data.email, data.password);
//       toast.success('Inicio de sesión exitoso');
//       navigate('/dashboard');
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Error al iniciar sesión');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
//       <div className="bg-white p-8 rounded-lg shadow-xl w-96">
//         <div className="text-center mb-8">
//           {companyLogo ? (
//             <img 
//               src={getImageUrl(companyLogo)} 
//               alt={companyName} 
//               className="h-20 mx-auto mb-4 object-contain"
//             />
//           ) : (
//             <div className="h-20 w-20 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
//               {companyName.charAt(0)}
//             </div>
//           )}
//           <h1 className="text-2xl font-bold text-gray-800">{companyName}</h1>
//           <p className="text-gray-500 text-sm mt-1">Sistema de Gestión Veterinaria</p>
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)}>
//           <div className="mb-4">
//             <label className="block text-gray-700 text-sm font-medium mb-2">
//               Email o nombre de usuario
//             </label>
//             <input
//               {...register('email')}
//               type="text"
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               disabled={loading}
//               placeholder="Ingrese su email o usuario"
//             />
//             {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
//           </div>
//           <div className="mb-6">
//             <label className="block text-gray-700 text-sm font-medium mb-2">
//               Contraseña
//             </label>
//             <input
//               {...register('password')}
//               type="password"
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               disabled={loading}
//             />
//             {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
//           </div>
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
//           >
//             {loading ? 'Iniciando...' : 'Iniciar Sesión'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCompanySettings } from '../../services/companyService';
import { getImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().min(1, 'Email o nombre de usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida')
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanyName(settings.name);
      setCompanyLogo(settings.logo);
    } catch (error) {
      console.error('Error al cargar configuración de empresa', error);
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

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-xl w-96 text-center">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <div className="text-center mb-8">
          {companyLogo ? (
            <img 
              src={getImageUrl(companyLogo)} 
              alt={companyName} 
              className="h-20 mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="h-20 w-20 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {companyName.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{companyName}</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestión Veterinaria</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email o nombre de usuario
            </label>
            <input
              {...register('email')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              placeholder="Ingrese su email o usuario"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Contraseña
            </label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;