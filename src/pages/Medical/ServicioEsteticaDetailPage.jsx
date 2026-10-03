import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServicioEstetica, deleteServicioEstetica } from '../../services/esteticaService';
import { generateEsteticaPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';

const ServicioEsteticaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadServicio();
  }, [id]);

  const loadServicio = async () => {
    try {
      const res = await getServicioEstetica(id);
      setServicio(res.data);
    } catch (error) {
      toast.error('Error al cargar servicio de estética');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      await deleteServicioEstetica(id);
      toast.success('Servicio eliminado');
      navigate(`/mascotas/${servicio.mascotaId}`);
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
            ['Mascota', servicio.mascota?.nombre],
            ['Dueño', servicio.mascota?.dueno?.nombre],
            ['Fecha', new Date(servicio.fecha).toLocaleString()],
            ['Peluquero', servicio.trabajador?.nombre || 'No asignado'],
          ],
        },
        {
          title: 'Servicio Realizado',
          type: 'keyValue',
          content: [['Tipo', servicio.tipo?.nombre]],
        },
      ];
      if (servicio.observacion && Object.keys(servicio.observacion).length > 0) {
        sections.push({
          title: 'Observaciones',
          type: 'keyValue',
          content: Object.entries(servicio.observacion),
        });
      }
      await generateEsteticaPDF('Detalle de Servicio de Estética', sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!servicio) return <div className="text-center p-4">Servicio no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Detalle de Servicio de Estética</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/estetica/${id}/editar`)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="font-semibold">{new Date(servicio.fecha).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mascota</p>
            <p className="font-semibold">{servicio.mascota?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo</p>
            <p className="font-semibold">{servicio.tipo?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Peluquero</p>
            <p className="font-semibold">{servicio.trabajador?.nombre || 'No asignado'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Observaciones</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(servicio.observacion, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicioEsteticaDetailPage;