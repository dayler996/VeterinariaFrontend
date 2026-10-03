import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOperacion, deleteOperacion } from '../../services/operacionService';
import { generateOperacionPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';

const OperacionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [operacion, setOperacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadOperacion();
  }, [id]);

  const loadOperacion = async () => {
    try {
      const res = await getOperacion(id);
      setOperacion(res.data);
    } catch (error) {
      toast.error('Error al cargar operación');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta operación?')) return;
    try {
      await deleteOperacion(id);
      toast.success('Operación eliminada');
      navigate(`/mascotas/${operacion.mascotaId}`);
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
            ['Mascota', operacion.mascota?.nombre],
            ['Dueño', operacion.mascota?.dueno?.nombre],
            ['Fecha', new Date(operacion.fecha).toLocaleString()],
            ['Cirujano', operacion.cirujano?.nombre],
          ],
        },
        {
          title: 'Tipo de Operación',
          type: 'keyValue',
          content: [['Tipo', operacion.tipo?.nombre]],
        },
      ];
      if (operacion.notas && Object.keys(operacion.notas).length > 0) {
        sections.push({
          title: 'Notas quirúrgicas',
          type: 'keyValue',
          content: Object.entries(operacion.notas),
        });
      }
      await generateOperacionPDF('Detalle de Operación', sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!operacion) return <div className="text-center p-4">Operación no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Detalle de Operación</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/operaciones/${id}/editar`)}
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
            <p className="font-semibold">{new Date(operacion.fecha).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mascota</p>
            <p className="font-semibold">{operacion.mascota?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo</p>
            <p className="font-semibold">{operacion.tipo?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cirujano</p>
            <p className="font-semibold">{operacion.cirujano?.nombre}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Notas</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(operacion.notas, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperacionDetailPage;