import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConsulta, deleteConsulta } from '../../services/consultaService';
import { generateConsultaPDF } from '../../services/pdfService';
import { getImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const ConsultaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadConsulta();
  }, [id]);

  const loadConsulta = async () => {
    try {
      const res = await getConsulta(id);
      setConsulta(res.data);
    } catch (error) {
      toast.error('Error al cargar consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta consulta?')) return;
    try {
      await deleteConsulta(id);
      toast.success('Consulta eliminada');
      navigate(`/mascotas/${consulta.mascotaId}`);
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
            ['Mascota', consulta.mascota?.nombre],
            ['Dueño', consulta.mascota?.dueno?.nombre],
            ['Fecha', new Date(consulta.fecha).toLocaleString()],
            ['Doctor', consulta.doctor?.nombre],
            ['Motivo', consulta.motivo],
          ],
        },
      ];
      if (consulta.diagnostico && Object.keys(consulta.diagnostico).length > 0) {
        sections.push({
          title: 'Diagnóstico',
          type: 'keyValue',
          content: Object.entries(consulta.diagnostico),
        });
      }
      if (consulta.recetaDetalle && Object.keys(consulta.recetaDetalle).length > 0) {
        sections.push({
          title: 'Receta',
          type: 'keyValue',
          content: Object.entries(consulta.recetaDetalle),
        });
      }
      if (consulta.fotoReceta) {
        console.log('Agregando foto de receta al PDF:', consulta.fotoReceta);
        sections.push({
          title: 'Foto de la Receta',
          type: 'image',
          content:  getImageUrl(consulta.fotoReceta),
          pageBreak: true,
        });
      }
      await generateConsultaPDF('Detalle de Consulta', sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!consulta) return <div className="text-center p-4">Consulta no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Detalle de Consulta</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/consultas/${id}/editar`)}
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
            <p className="font-semibold">{new Date(consulta.fecha).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mascota</p>
            <p className="font-semibold">{consulta.mascota?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Doctor</p>
            <p className="font-semibold">{consulta.doctor?.nombre}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Motivo</p>
            <p className="font-semibold whitespace-pre-wrap">{consulta.motivo}</p>
          </div>
          {consulta.diagnostico && Object.keys(consulta.diagnostico).length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Diagnóstico</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(consulta.diagnostico, null, 2)}
              </pre>
            </div>
          )}
          {consulta.recetaDetalle && Object.keys(consulta.recetaDetalle).length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Receta</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(consulta.recetaDetalle, null, 2)}
              </pre>
            </div>
          )}
          {consulta.fotoReceta && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-2">Foto de la receta</p>
              <img
                src={ getImageUrl(consulta.fotoReceta)}
                alt="Receta"
                className="max-w-full max-h-96 rounded shadow border"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultaDetailPage;