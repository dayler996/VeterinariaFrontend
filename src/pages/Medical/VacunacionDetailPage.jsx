import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVacunacion, deleteVacunacion } from '../../services/vacunacionService';
import { generateVacunacionPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';

const VacunacionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacunacion, setVacunacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadVacunacion();
  }, [id]);

  const loadVacunacion = async () => {
    try {
      const res = await getVacunacion(id);
      setVacunacion(res.data);
    } catch (error) {
      toast.error('Error al cargar vacunación');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta vacunación?')) return;
    try {
      await deleteVacunacion(id);
      toast.success('Vacunación eliminada');
      navigate(`/mascotas/${vacunacion.mascotaId}`);
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
            ['Mascota', vacunacion.mascota?.nombre],
            ['Dueño', vacunacion.mascota?.dueno?.nombre],
            ['Fecha de aplicación', new Date(vacunacion.fechaAplicacion).toLocaleString()],
            ['Doctor', vacunacion.doctor?.nombre],
          ],
        },
        {
          title: 'Detalles de la Vacuna',
          type: 'keyValue',
          content: [
            ['Vacuna', vacunacion.vacuna?.nombre],
            ['Próximo refuerzo', vacunacion.proximoRefuerzo ? new Date(vacunacion.proximoRefuerzo).toLocaleDateString() : 'No especificado'],
            ['Observación', vacunacion.observacion || ''],
          ],
        },
      ];

      // Agregar sección de notificaciones si existen
      if (vacunacion.notificado_primero !== undefined || vacunacion.notificado_segundo !== undefined) {
        const notificacionesContent = [];
        if (vacunacion.notificado_primero !== undefined) {
          notificacionesContent.push(['Primera notificación', vacunacion.notificado_primero ? 'Sí' : 'No']);
          if (vacunacion.fecha_notificacion_primero) {
            notificacionesContent.push(['Fecha primera notificación', new Date(vacunacion.fecha_notificacion_primero).toLocaleDateString()]);
          }
        }
        if (vacunacion.notificado_segundo !== undefined) {
          notificacionesContent.push(['Segunda notificación', vacunacion.notificado_segundo ? 'Sí' : 'No']);
          if (vacunacion.fecha_notificacion_segundo) {
            notificacionesContent.push(['Fecha segunda notificación', new Date(vacunacion.fecha_notificacion_segundo).toLocaleDateString()]);
          }
        }
        if (notificacionesContent.length > 0) {
          sections.push({
            title: 'Notificaciones',
            type: 'keyValue',
            content: notificacionesContent,
          });
        }
      }

      if (vacunacion.detalles && Object.keys(vacunacion.detalles).length > 0) {
        sections.push({
          title: 'Detalles adicionales',
          type: 'keyValue',
          content: Object.entries(vacunacion.detalles),
        });
      }
      await generateVacunacionPDF('Detalle de Vacunación', sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!vacunacion) return <div className="text-center p-4">Vacunación no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Detalle de Vacunación</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/vacunaciones/${id}/editar`)}
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
            <p className="text-sm text-gray-600">Mascota</p>
            <p className="font-semibold">{vacunacion.mascota?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dueño</p>
            <p className="font-semibold">{vacunacion.mascota?.dueno?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha de aplicación</p>
            <p className="font-semibold">{new Date(vacunacion.fechaAplicacion).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vacuna</p>
            <p className="font-semibold">{vacunacion.vacuna?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Doctor</p>
            <p className="font-semibold">{vacunacion.doctor?.nombre}</p>
          </div>
          {vacunacion.proximoRefuerzo && (
            <div>
              <p className="text-sm text-gray-600">Próximo refuerzo</p>
              <p className="font-semibold">{new Date(vacunacion.proximoRefuerzo).toLocaleDateString()}</p>
            </div>
          )}
          {vacunacion.observacion && (
            <div>
              <p className="text-sm text-gray-600">Observación</p>
              <p className="whitespace-pre-wrap">{vacunacion.observacion}</p>
            </div>
          )}

          {/* Notificaciones */}
          {(vacunacion.notificado_primero !== undefined || vacunacion.notificado_segundo !== undefined) && (
            <div className="border-t pt-4 mt-2">
              <h3 className="font-semibold text-lg mb-2">Notificaciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vacunacion.notificado_primero !== undefined && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Primera notificación</p>
                      <p className="font-semibold">{vacunacion.notificado_primero ? 'Sí' : 'No'}</p>
                    </div>
                    {vacunacion.fecha_notificacion_primero && (
                      <div>
                        <p className="text-sm text-gray-600">Fecha primera notificación</p>
                        <p className="font-semibold">{new Date(vacunacion.fecha_notificacion_primero).toLocaleDateString()}</p>
                      </div>
                    )}
                  </>
                )}
                {vacunacion.notificado_segundo !== undefined && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Segunda notificación</p>
                      <p className="font-semibold">{vacunacion.notificado_segundo ? 'Sí' : 'No'}</p>
                    </div>
                    {vacunacion.fecha_notificacion_segundo && (
                      <div>
                        <p className="text-sm text-gray-600">Fecha segunda notificación</p>
                        <p className="font-semibold">{new Date(vacunacion.fecha_notificacion_segundo).toLocaleDateString()}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {vacunacion.detalles && Object.keys(vacunacion.detalles).length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Detalles adicionales</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(vacunacion.detalles, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacunacionDetailPage;