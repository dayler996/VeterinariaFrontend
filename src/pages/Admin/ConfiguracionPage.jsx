import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfiguracion, updateConfiguracion } from '../../services/configuracionService';
import ImageUploader from '../../components/common/ImageUploader';
import toast from 'react-hot-toast';

const ConfiguracionPage = () => {
  const [nombre, setNombre] = useState('');
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await getConfiguracion();
      setNombre(res.data.nombre || '');
      setLogo(res.data.logo || '');
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateConfiguracion({ nombre, logo });
      toast.success('Configuración actualizada');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configuración de la Veterinaria</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de la veterinaria</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Logo</label>
          <ImageUploader
            value={logo}
            onChange={setLogo}
            folder="configuracion" // necesitas agregar 'configuracion' en uploadConfig
            label="Logo de la veterinaria"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-300 rounded">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracionPage;