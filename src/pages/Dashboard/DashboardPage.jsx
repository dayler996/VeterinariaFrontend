// import { useState, useEffect } from 'react';
// import { useAuth } from '../../context/AuthContext';
// import { Link } from 'react-router-dom';
// import { getCompanyName, getCompanyLogo } from '../../services/companyService';
// import { getImageUrl } from '../../utils/imageUtils';


// const DashboardPage = () => {
//   const { user } = useAuth();
//   const [companyName, setCompanyName] = useState('');
//   const [companyLogo, setCompanyLogo] = useState(null);

//   useEffect(() => {
//     setCompanyName(getCompanyName());
//     setCompanyLogo(getCompanyLogo());
//   }, []);

//   const modules = [
//     { title: 'Clientes', description: 'Administrar clientes y mascotas', to: '/clientes', icon: '👥', color: 'bg-blue-500' },
//     { title: 'Citas', description: 'Agendar y gestionar citas', to: '/citas', icon: '📅', color: 'bg-green-500' },
//     { title: 'Facturación', description: 'Generar facturas y pagos', to: '/facturacion', icon: '💰', color: 'bg-purple-500' },
//     { title: 'Inventario', description: 'Productos y stock', to: '/inventario', icon: '📦', color: 'bg-yellow-500' },
//     { title: 'Consultas', description: 'Registro de consultas médicas', to: '/consultas', icon: '🩺', color: 'bg-red-500' },
//     { title: 'Hospitalización', description: 'Pacientes internados', to: '/hospitalizaciones', icon: '🏥', color: 'bg-indigo-500' },
//     { title: 'Vacunaciones', description: 'Control de vacunas', to: '/vacunaciones', icon: '💉', color: 'bg-pink-500' },
//   ];

//   const adminModules = [
//     { title: 'Usuarios', description: 'Gestión de accesos', to: '/usuarios', icon: '🔐', color: 'bg-gray-600' },
//     { title: 'Roles', description: 'Permisos y roles', to: '/roles', icon: '⚙️', color: 'bg-gray-600' },
//     { title: 'Personal', description: 'Trabajadores y horarios', to: '/trabajadores', icon: '👨‍⚕️', color: 'bg-gray-600' },
//   ];

//   return (
//     <div className="p-6 pt-16 lg:pt-6"> {/* Añadido pt-16 en móvil para dejar espacio al botón hamburguesa */}
//       {/* Encabezado con logo y nombre */}
//       <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 bg-white rounded-lg shadow p-4">
//         {companyLogo ? (
//           <img src={getImageUrl(companyLogo)}  alt={companyName} className="h-12 w-auto object-contain mx-auto sm:mx-0" />
//         ) : (
//           <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto sm:mx-0">
//             {companyName.charAt(0)}
//           </div>
//         )}
//         <div className="text-center sm:text-left">
//           <h1 className="text-2xl font-bold text-gray-800">{companyName}</h1>
//           <p className="text-gray-600">Bienvenido, {user?.trabajador?.nombre || user?.email}</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {modules.map(mod => (
//           <Link key={mod.to} to={mod.to} className="block">
//             <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
//               <div className={`w-12 h-12 ${mod.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
//                 {mod.icon}
//               </div>
//               <h2 className="text-xl font-semibold mb-2">{mod.title}</h2>
//               <p className="text-gray-600">{mod.description}</p>
//             </div>
//           </Link>
//         ))}

//         {user?.rol?.nombre === 'ADMIN' && adminModules.map(mod => (
//           <Link key={mod.to} to={mod.to} className="block">
//             <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
//               <div className={`w-12 h-12 ${mod.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
//                 {mod.icon}
//               </div>
//               <h2 className="text-xl font-semibold mb-2">{mod.title}</h2>
//               <p className="text-gray-600">{mod.description}</p>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DashboardPage;

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getCompanySettings } from '../../services/companyService';
import { getImageUrl } from '../../utils/imageUtils';

const DashboardPage = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanyName(settings.name);
      setCompanyLogo(settings.logo);
    } catch (error) {
      console.error('Error al cargar configuración', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { title: 'Clientes', description: 'Administrar clientes y mascotas', to: '/clientes', icon: '👥', color: 'bg-blue-500' },
    { title: 'Citas', description: 'Agendar y gestionar citas', to: '/citas', icon: '📅', color: 'bg-green-500' },
    { title: 'Facturación', description: 'Generar facturas y pagos', to: '/facturacion', icon: '💰', color: 'bg-purple-500' },
    { title: 'Inventario', description: 'Productos y stock', to: '/inventario', icon: '📦', color: 'bg-yellow-500' },
    { title: 'Consultas', description: 'Registro de consultas médicas', to: '/consultas', icon: '🩺', color: 'bg-red-500' },
    { title: 'Hospitalización', description: 'Pacientes internados', to: '/hospitalizaciones', icon: '🏥', color: 'bg-indigo-500' },
    { title: 'Vacunaciones', description: 'Control de vacunas', to: '/vacunaciones', icon: '💉', color: 'bg-pink-500' },
  ];

  const adminModules = [
    { title: 'Usuarios', description: 'Gestión de accesos', to: '/usuarios', icon: '🔐', color: 'bg-gray-600' },
    { title: 'Roles', description: 'Permisos y roles', to: '/roles', icon: '⚙️', color: 'bg-gray-600' },
    { title: 'Personal', description: 'Trabajadores y horarios', to: '/trabajadores', icon: '👨‍⚕️', color: 'bg-gray-600' },
  ];

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-6 pt-16 lg:pt-6">
      {/* Encabezado con logo y nombre */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 bg-white rounded-lg shadow p-4">
        {companyLogo ? (
          <img src={getImageUrl(companyLogo)} alt={companyName} className="h-12 w-auto object-contain mx-auto sm:mx-0" />
        ) : (
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto sm:mx-0">
            {companyName.charAt(0)}
          </div>
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-800">{companyName}</h1>
          <p className="text-gray-600">Bienvenido, {user?.trabajador?.nombre || user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(mod => (
          <Link key={mod.to} to={mod.to} className="block">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className={`w-12 h-12 ${mod.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
                {mod.icon}
              </div>
              <h2 className="text-xl font-semibold mb-2">{mod.title}</h2>
              <p className="text-gray-600">{mod.description}</p>
            </div>
          </Link>
        ))}

        {user?.rol?.nombre === 'ADMIN' && adminModules.map(mod => (
          <Link key={mod.to} to={mod.to} className="block">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className={`w-12 h-12 ${mod.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
                {mod.icon}
              </div>
              <h2 className="text-xl font-semibold mb-2">{mod.title}</h2>
              <p className="text-gray-600">{mod.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;