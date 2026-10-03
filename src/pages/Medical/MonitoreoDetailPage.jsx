import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMonitoreo, deleteMonitoreo } from '../../services/monitoreoService';
import { generateMonitoreoPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';

const MonitoreoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monitoreo, setMonitoreo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadMonitoreo();
  }, [id]);

  const loadMonitoreo = async () => {
    try {
      const res = await getMonitoreo(id);
      setMonitoreo(res.data);
    } catch (error) {
      toast.error('Error al cargar el monitoreo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este monitoreo?')) return;
    try {
      await deleteMonitoreo(id);
      toast.success('Monitoreo eliminado');
      navigate(`/hospitalizaciones/${monitoreo.hospitalizacionId}`);
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    try {
      const sections = [
        {
          title: 'Información General',
          type: 'keyValue',
          content: [
            ['Fecha y hora', new Date(monitoreo.fechaHora).toLocaleString()],
            ['Doctor', monitoreo.doctor?.nombre],
            ['Observaciones', monitoreo.observaciones || ''],
          ],
        },
      ];
      if (monitoreo.detalles && Object.keys(monitoreo.detalles).length > 0) {
        sections.push({
          title: 'Detalles',
          type: 'keyValue',
          content: Object.entries(monitoreo.detalles),
        });
      }
      await generateMonitoreoPDF('Detalle de Monitoreo', sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!monitoreo) return <div className="text-center p-4">Monitoreo no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Detalle de Monitoreo</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/monitoreos/${id}/editar`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full sm:w-auto"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
          >
            Eliminar
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={pdfLoading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
          >
            {pdfLoading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm text-gray-600">Fecha y hora</p>
            <p className="font-semibold">{new Date(monitoreo.fechaHora).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Doctor</p>
            <p className="font-semibold">{monitoreo.doctor?.nombre}</p>
          </div>
          {monitoreo.observaciones && (
            <div>
              <p className="text-sm text-gray-600">Observaciones</p>
              <p className="whitespace-pre-wrap">{monitoreo.observaciones}</p>
            </div>
          )}
          {monitoreo.detalles && Object.keys(monitoreo.detalles).length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Detalles</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(monitoreo.detalles, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoreoDetailPage;