// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { getCompanyName, setCompanyName, getCompanyLogo, setCompanyLogo } from '../../services/companyService';
// import ImageUploader from '../../components/common/ImageUploader';
// import toast from 'react-hot-toast';

// const CompanySettingsPage = () => {
//   const [companyName, setCompanyNameState] = useState('');
//   const [companyLogo, setCompanyLogoState] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Cargar configuración existente
//     setCompanyNameState(getCompanyName());
//     setCompanyLogoState(getCompanyLogo());
//   }, []);

//   const handleSave = () => {
//     setLoading(true);
//     try {
//       setCompanyName(companyName);
//       setCompanyLogo(companyLogo);
//       toast.success('Configuración guardada');
//       navigate('/dashboard');
//     } catch (error) {
//       toast.error('Error al guardar');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-6">Configuración de la Empresa</h1>
      
//       <div className="bg-white shadow rounded-lg p-6 space-y-6">
//         {/* Nombre de la empresa */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Nombre de la veterinaria
//           </label>
//           <input
//             type="text"
//             value={companyName}
//             onChange={(e) => setCompanyNameState(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             placeholder="Ej. Veterinaria Central"
//           />
//         </div>

//         {/* Logo de la empresa */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Logo de la empresa
//           </label>
//           <ImageUploader
//             value={companyLogo}
//             onChange={setCompanyLogoState}
//             folder="company"
//             label="Seleccionar logo"
//           />
//           <p className="text-xs text-gray-500 mt-1">
//             El logo se mostrará en la pantalla de login y en el dashboard.
//           </p>
//         </div>

//         {/* Botones */}
//         <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
//           <button
//             type="button"
//             onClick={() => navigate('/dashboard')}
//             className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 order-2 sm:order-1"
//           >
//             Cancelar
//           </button>
//           <button
//             type="button"
//             onClick={handleSave}
//             disabled={loading}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
//           >
//             {loading ? 'Guardando...' : 'Guardar cambios'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CompanySettingsPage;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanySettings, updateCompanySettings } from '../../services/companyService';
import ImageUploader from '../../components/common/ImageUploader';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

const CompanySettingsPage = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanyName(settings.name);
      setCompanyLogo(settings.logo);
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateCompanySettings(companyName, companyLogo);
      toast.success('Configuración guardada');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configuración de la Empresa</h1>
      
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la veterinaria
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej. Veterinaria Central"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo de la empresa
          </label>
          <ImageUploader
            value={getImageUrl(companyLogo)}
            onChange={setCompanyLogo}
            folder="company"
            label="Seleccionar logo"
          />
          <p className="text-xs text-gray-500 mt-1">
            El logo se mostrará en la pantalla de login y en el dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsPage;