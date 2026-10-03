import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParametrosFactura, updateParametroFactura, createParametroFactura } from '../../services/parametroFacturaService';
import toast from 'react-hot-toast';

const FacturaConfigPage = () => {
  const [factor, setFactor] = useState('');
  const [iva, setIva] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadParametros();
  }, []);

  const loadParametros = async () => {
    try {
      const res = await getParametrosFactura();
      setFactor(res.data.factor_cambio || '');
      setIva(res.data.iva_porcentaje || '');
    } catch (error) {
      toast.error('Error al cargar configuración');
    }
  };

  const handleSave = async () => {
    if (!factor || isNaN(parseFloat(factor))) {
      toast.error('Ingrese un valor numérico válido para el factor de cambio');
      return;
    }
    if (!iva || isNaN(parseFloat(iva))) {
      toast.error('Ingrese un valor numérico válido para el IVA');
      return;
    }
    setLoading(true);
    try {
      // Guardar factor de cambio
      try {
        await updateParametroFactura('factor_cambio', { valor: factor });
      } catch (err) {
        if (err.response?.status === 404) {
          await createParametroFactura({ clave: 'factor_cambio', valor: factor, descripcion: 'Tasa de cambio USD a Bs' });
        } else throw err;
      }
      // Guardar IVA
      try {
        await updateParametroFactura('iva_porcentaje', { valor: iva });
      } catch (err) {
        if (err.response?.status === 404) {
          await createParametroFactura({ clave: 'iva_porcentaje', valor: iva, descripcion: 'Porcentaje de IVA' });
        } else throw err;
      }
      toast.success('Configuración guardada');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Configuración de Facturación</h1>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Factor de cambio (1 USD = ? Bs)</label>
          <input
            type="number"
            step="0.01"
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            placeholder="Ej. 60.50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Porcentaje de IVA (%)</label>
          <input
            type="number"
            step="0.1"
            value={iva}
            onChange={(e) => setIva(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            placeholder="Ej. 16"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-300 rounded">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacturaConfigPage;