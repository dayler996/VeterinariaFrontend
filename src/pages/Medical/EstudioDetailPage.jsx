import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEstudio, deleteEstudio } from '../../services/estudioService';
import {  generateEstudioPDF } from '../../services/pdfService';
import { getImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const EstudioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estudio, setEstudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadEstudio();
  }, [id]);

  const loadEstudio = async () => {
    try {
      const res = await getEstudio(id);
      setEstudio(res.data);
    } catch (error) {
      toast.error('Error al cargar estudio');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este estudio?')) return;
    try {
      await deleteEstudio(id);
      toast.success('Estudio eliminado');
      navigate(`/mascotas/${estudio.mascotaId}`);
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
            ['Mascota', estudio.mascota?.nombre],
            ['Dueño', estudio.mascota?.dueno?.nombre],
            ['Fecha', new Date(estudio.fecha).toLocaleString()],
            ['Doctor', estudio.doctor?.nombre],
          ],
        },
        {
          title: 'Tipo de Estudio',
          type: 'keyValue',
          content: [['Tipo', estudio.tipo?.nombre]],
        },
      ];
      if (estudio.resultado && Object.keys(estudio.resultado).length > 0) {
        sections.push({
          title: 'Resultados',
          type: 'keyValue',
          content: Object.entries(estudio.resultado),
        });
      }
      if (estudio.imagenes && estudio.imagenes.length > 0) {
        
        estudio.imagenes.forEach((img, idx) => {
          console.log('Agregando imágenes al PDF:', img.url);
          sections.push({
            title: `Imagen ${idx + 1}`,
            type: 'centeredImage',
            content: getImageUrl(img.url),
            pageBreak: true
          });
        });
      }
      await  generateEstudioPDF('Detalle de Estudio', sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!estudio) return <div className="text-center p-4">Estudio no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Detalle de Estudio</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/estudios/${id}/editar`)}
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
            <p className="font-semibold">{new Date(estudio.fecha).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mascota</p>
            <p className="font-semibold">{estudio.mascota?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo</p>
            <p className="font-semibold">{estudio.tipo?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Doctor</p>
            <p className="font-semibold">{estudio.doctor?.nombre}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Resultado</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(estudio.resultado, null, 2)}
            </pre>
          </div>
          {estudio.imagenes && estudio.imagenes.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-2">Imágenes</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {estudio.imagenes.map(img => (
                  <img key={img.id} src={getImageUrl(img.url)} alt="estudio" className="rounded shadow border" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstudioDetailPage;