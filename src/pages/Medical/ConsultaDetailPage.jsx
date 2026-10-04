import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConsulta, deleteConsulta } from '../../services/consultaService';
import { generateConsultaPDF } from '../../services/pdfService';
import { getImageUrl } from '../../utils/imageUtils';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  Stethoscope, Pencil, Trash2, FileDown,
  Heart, User, Calendar, ClipboardList,
  FileText, AlertTriangle, Pill,
  Image as ImageIcon, ZoomIn, X, Download,
} from 'lucide-react';

const ConsultaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [consulta, setConsulta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(false);

  useEffect(() => { loadConsulta(); /* eslint-disable-next-line */ }, [id]);

  const loadConsulta = async () => {
    try {
      const res = await getConsulta(id);
      setConsulta(res.data);
    } catch {
      toast.error('Error al cargar consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar consulta',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteConsulta(id);
      toast.success('Consulta eliminada');
      navigate(`/mascotas/${consulta.mascotaId}`);
    } catch {
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
        sections.push({
          title: 'Foto de la Receta',
          type: 'image',
          content: getImageUrl(consulta.fotoReceta),
          pageBreak: true,
        });
      }
      await generateConsultaPDF('Detalle de Consulta', sections);
    } catch {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Consulta no encontrada</p>
        </div>
      </div>
    );
  }

  const diagnosticoCount = consulta.diagnostico
    ? Object.keys(consulta.diagnostico).length
    : 0;
  const recetaCount = consulta.recetaDetalle
    ? Object.keys(consulta.recetaDetalle).length
    : 0;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="🩺"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: consulta.mascota?.dueno?.nombre, to: `/clientes/${consulta.mascota?.dueno?.id}` },
          { label: consulta.mascota?.nombre, to: `/mascotas/${consulta.mascotaId}` },
          { label: 'Consulta' },
        ]}
        title="Detalle de Consulta"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {new Date(consulta.fecha).toLocaleString()}
            {consulta.doctor?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold">
                  <Stethoscope className="w-3 h-3" strokeWidth={2.5} />
                  Dr. {consulta.doctor.nombre}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/consultas/${id}/editar`)}
              className="inline-flex items-center justify-center gap-1.5
                         bg-white text-slate-700 border border-slate-200
                         px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <Pencil className="w-4 h-4" strokeWidth={2.2} />
              Editar
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={pdfLoading}
              className="inline-flex items-center justify-center gap-1.5
                         bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-blue-700 active:bg-blue-800 transition
                         disabled:opacity-50 shadow-sm shadow-blue-600/20"
            >
              {pdfLoading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                  Generando...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" strokeWidth={2.2} />
                  PDF
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-1.5
                         bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-red-700 active:bg-red-800 transition
                         shadow-sm shadow-red-600/20"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2.2} />
              Eliminar
            </button>
          </>
        }
      />

      {/* ═══ Banner destacado con el motivo ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
          <Stethoscope className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Motivo de consulta
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {consulta.motivo || 'Sin motivo registrado'}
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            {consulta.mascota?.nombre} · {new Date(consulta.fecha).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* ═══ Info general ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Información de la consulta
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoBlock
            icon={Heart}
            label="Mascota"
            value={consulta.mascota?.nombre}
            tone="blue"
          />
          <InfoBlock
            icon={User}
            label="Doctor"
            value={consulta.doctor?.nombre || 'No asignado'}
            tone="blue"
          />
          <InfoBlock
            icon={Calendar}
            label="Fecha"
            value={new Date(consulta.fecha).toLocaleString()}
            tone="blue"
          />
          <InfoBlock
            icon={Stethoscope}
            label="Motivo"
            value={consulta.motivo}
            tone="blue"
          />
        </div>
      </div>

      {/* ═══ Diagnóstico ═══ */}
      {diagnosticoCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Diagnóstico
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {diagnosticoCount}
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {Object.entries(consulta.diagnostico).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="text-xs font-medium text-slate-500 min-w-[140px] shrink-0 capitalize">
                    {k
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (s) => s.toUpperCase())}
                  </span>
                  <span className="text-sm text-slate-800 flex-1 break-words">
                    {v?.toString() || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Receta ═══ */}
      {recetaCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <Pill className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Receta
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {recetaCount}
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {Object.entries(consulta.recetaDetalle).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="text-xs font-medium text-slate-500 min-w-[140px] shrink-0 capitalize">
                    {k
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (s) => s.toUpperCase())}
                  </span>
                  <span className="text-sm text-slate-800 flex-1 break-words">
                    {v?.toString() || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Foto de la receta ═══ */}
      {consulta.fotoReceta && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Foto de la receta
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setFotoAmpliada(true)}
            className="group relative w-full rounded-xl overflow-hidden
                       border border-slate-200 bg-slate-50
                       hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10
                       active:scale-[0.99] transition-all"
          >
            <img
              src={getImageUrl(consulta.fotoReceta)}
              alt="Receta"
              className="w-full max-h-96 object-contain group-hover:scale-[1.02] transition-transform duration-300"
            />
            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity
                               inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                               bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-semibold
                               shadow-lg">
                <ZoomIn className="w-3.5 h-3.5" strokeWidth={2.5} />
                Ampliar imagen
              </span>
            </div>
          </button>

          <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            Toca la imagen para ampliarla
          </p>
        </div>
      )}

      {/* ═══ Lightbox / Visor ampliado ═══ */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm
                     flex items-center justify-center p-4 sm:p-8"
          onClick={() => setFotoAmpliada(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFotoAmpliada(false);
            }}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur
                       text-white transition z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>

          <a
            href={getImageUrl(consulta.fotoReceta)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur
                       text-white transition z-10"
            aria-label="Abrir en nueva pestaña"
          >
            <Download className="w-5 h-5" strokeWidth={2.5} />
          </a>

          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(consulta.fotoReceta)}
              alt="Receta ampliada"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-white"
            />
            <p className="text-center text-xs text-white/70 mt-3">
              Toca fuera de la imagen o presiona ✕ para cerrar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Bloque de info reutilizable ── */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-500',
  }[tone];

  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneCls}`}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">
          {value || '—'}
        </p>
      </div>
    </div>
  );
};

export default ConsultaDetailPage;