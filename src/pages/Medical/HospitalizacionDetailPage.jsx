import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHospitalizacion, updateHospitalizacion, deleteHospitalizacion ,deleteHospitalizacionCascade} from '../../services/hospitalizacionService';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateHospitalizacionPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';

const altaSchema = z.object({
  fechaAlta: z.string().min(1, 'Fecha de alta requerida'),
  notasAlta: z.any().optional(),
});

const HospitalizacionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospitalizacion, setHospitalizacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAlta, setModalAlta] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(altaSchema),
  });

  useEffect(() => {
    loadHospitalizacion();
  }, [id]);

  const loadHospitalizacion = async () => {
    try {
      const res = await getHospitalizacion(id);
      setHospitalizacion(res.data);
    } catch (error) {
      toast.error('Error al cargar hospitalización');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
  // Primero preguntar si está seguro
  if (!confirm('¿Eliminar esta hospitalización?')) return;

  try {
    await deleteHospitalizacion(id);
    toast.success('Hospitalización eliminada');
    navigate(`/mascotas/${hospitalizacion.mascotaId}`);
  } catch (error) {
    // Verificar si es error de restricción de clave foránea (P2003)
    if (error.response?.data?.code === 'P2003' || error.message?.includes('P2003')) {
      // Preguntar si desea eliminar también todos los monitoreos
      if (confirm('La hospitalización tiene monitoreos asociados. ¿Deseas eliminarlos todos junto con la hospitalización?')) {
        try {
          // Llamar a un endpoint especial que elimine en cascada
          await deleteHospitalizacionCascade(id);
          toast.success('Hospitalización y monitoreos eliminados');
          navigate(`/mascotas/${hospitalizacion.mascotaId}`);
        } catch (cascadeError) {
          toast.error('Error al eliminar en cascada');
        }
      } else {
        toast.error('No se eliminó. Primero debes eliminar los monitoreos manualmente.');
      }
    } else {
      toast.error('Error al eliminar');
    }
  }
};

  const handleAlta = async (data) => {
  try {
    let notas = null;
    if (data.notasAlta && data.notasAlta.trim() !== '') {
      // Intentamos parsear por si el usuario escribió un JSON válido
      try {
        notas = JSON.parse(data.notasAlta);
      } catch (e) {
        // No es JSON válido → lo envolvemos en un objeto con clave 'contenido'
        notas = { contenido: data.notasAlta };
      }
    }
    await updateHospitalizacion(id, {
      fechaAlta: data.fechaAlta || null,
      notasAlta: notas,
    });
    toast.success('Alta registrada');
    setModalAlta(false);
    loadHospitalizacion();
  } catch (error) {
    console.error('Error al dar de alta:', error);
    toast.error(error.response?.data?.error || 'Error al registrar alta');
  }
};

  const handleGeneratePDF = async () => {
    if (!hospitalizacion) {
      toast.error('No hay datos para generar el PDF');
      return;
    }
    setPdfLoading(true);
    try {
      const sections = [
        {
          title: 'Información General',
          type: 'keyValue',
          content: [
            ['Mascota', hospitalizacion.mascota?.nombre || 'N/A'],
            ['Dueño', hospitalizacion.mascota?.dueno?.nombre || 'N/A'],
            ['Fecha de Ingreso', new Date(hospitalizacion.fechaIngreso).toLocaleString()],
            ['Doctor', hospitalizacion.doctor?.nombre || 'No asignado'],
          ],
        },
      ];
      if (hospitalizacion.motivo) {
        sections.push({
          title: 'Motivo',
          type: 'text',
          content: hospitalizacion.motivo,
        });
      }
      if (hospitalizacion.detallesIngreso && Object.keys(hospitalizacion.detallesIngreso).length > 0) {
        sections.push({
          title: 'Detalles de Ingreso',
          type: 'keyValue',
          content: Object.entries(hospitalizacion.detallesIngreso).map(([k, v]) => [k, v?.toString() || '']),
        });
      }
      if (hospitalizacion.fechaAlta) {
        sections.push({
          title: 'Fecha de Alta',
          type: 'keyValue',
          content: [['Fecha', new Date(hospitalizacion.fechaAlta).toLocaleString()]],
        });
      }
      if (hospitalizacion.notasAlta && Object.keys(hospitalizacion.notasAlta).length > 0) {
        sections.push({
          title: 'Notas de Alta',
          type: 'keyValue',
          content: Object.entries(hospitalizacion.notasAlta).map(([k, v]) => [k, v?.toString() || '']),
        });
      }
      if (hospitalizacion.monitoreos && hospitalizacion.monitoreos.length > 0) {
        sections.push({
          title: 'Monitoreos',
          type: 'table',
          headers: ['Fecha', 'Doctor', 'Observaciones'],
          data: hospitalizacion.monitoreos.map(m => [
            new Date(m.fechaHora).toLocaleString(),
            m.doctor?.nombre || 'No especificado',
            m.observaciones || '',
          ]),
        });
      }
      await generateHospitalizacionPDF('Detalle de Hospitalización', sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const monitoreosColumns = [
    { header: 'Fecha/Hora', accessorKey: 'fechaHora', cell: ({ getValue }) => new Date(getValue()).toLocaleString() },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
    { header: 'Observaciones', accessorKey: 'observaciones' },
  ];

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!hospitalizacion) return <div className="text-center p-4">Hospitalización no encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Hospitalización</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/hospitalizaciones/${id}/editar`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full sm:w-auto"
          >
            Editar
          </button>
          {!hospitalizacion.fechaAlta && (
            <button
              onClick={() => setModalAlta(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
            >
              Dar de Alta
            </button>
          )}
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
          >
            Eliminar
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={pdfLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            {pdfLoading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mascota</p>
            <p className="font-semibold">{hospitalizacion.mascota?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Doctor responsable</p>
            <p className="font-semibold">{hospitalizacion.doctor?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha Ingreso</p>
            <p className="font-semibold">{new Date(hospitalizacion.fechaIngreso).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha Alta</p>
            <p className="font-semibold">{hospitalizacion.fechaAlta ? new Date(hospitalizacion.fechaAlta).toLocaleString() : '—'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Motivo</p>
            <p className="font-semibold">{hospitalizacion.motivo}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Detalles de Ingreso</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(hospitalizacion.detallesIngreso, null, 2)}
            </pre>
          </div>
          {hospitalizacion.notasAlta && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Notas de Alta</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(hospitalizacion.notasAlta, null, 2)}
              </pre>
            </div>
          )}
          {hospitalizacion.consulta && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Consulta asociada</p>
              <p className="font-semibold">
                {new Date(hospitalizacion.consulta.fecha).toLocaleDateString()} - {hospitalizacion.consulta.motivo}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Monitoreos</h2>
          <button
            onClick={() => navigate(`/hospitalizaciones/${id}/monitoreos/nuevo`)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto mt-2 sm:mt-0"
          >
            Nuevo Monitoreo
          </button>
        </div>
        <DataTable
          columns={monitoreosColumns}
          data={hospitalizacion.monitoreos || []}
          onRowClick={(monitoreo) => navigate(`/monitoreos/${monitoreo.id}`)}
        />
      </div>

      {/* Modal de Alta */}
      <Modal isOpen={modalAlta} onClose={() => setModalAlta(false)} title="Registrar Alta">
        <form onSubmit={handleSubmit(handleAlta)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Fecha de Alta</label>
            <input type="datetime-local" {...register('fechaAlta')} className="mt-1 block w-full border rounded p-2" />
            {errors.fechaAlta && <p className="text-red-600 text-sm">{errors.fechaAlta.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Notas de Alta (JSON, opcional)</label>
            <textarea {...register('notasAlta')} rows="4" className="mt-1 block w-full border rounded p-2 font-mono" />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => setModalAlta(false)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HospitalizacionDetailPage;