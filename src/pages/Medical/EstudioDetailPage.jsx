import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEstudio, deleteEstudio } from '../../services/estudioService';
import { generateEstudioPDF } from '../../services/pdfService';
import { getImageUrl } from '../../utils/imageUtils';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  Microscope, Pencil, Trash2, FileDown,
  Heart, User, Calendar, FlaskConical,
  ClipboardList, FileText, AlertTriangle,
  Image as ImageIcon, Download, X, ZoomIn,
} from 'lucide-react';

const EstudioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [estudio, setEstudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  useEffect(() => { loadEstudio(); /* eslint-disable-next-line */ }, [id]);

  const loadEstudio = async () => {
    try {
      const res = await getEstudio(id);
      setEstudio(res.data);
    } catch {
      toast.error('Error al cargar estudio');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar estudio',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteEstudio(id);
      toast.success('Estudio eliminado');
      navigate(`/mascotas/${estudio.mascotaId}`);
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
          sections.push({
            title: `Imagen ${idx + 1}`,
            type: 'centeredImage',
            content: getImageUrl(img.url),
            pageBreak: true,
          });
        });
      }

      await generateEstudioPDF('Detalle de Estudio', sections);
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-violet-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!estudio) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Estudio no encontrado</p>
        </div>
      </div>
    );
  }

  const resultadosCount = estudio.resultado
    ? Object.keys(estudio.resultado).length
    : 0;
  const imagenesCount = estudio.imagenes?.length || 0;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="🔬"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: estudio.mascota?.dueno?.nombre, to: `/clientes/${estudio.mascota?.dueno?.id}` },
          { label: estudio.mascota?.nombre, to: `/mascotas/${estudio.mascotaId}` },
          { label: 'Estudio' },
        ]}
        title="Detalle de Estudio"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {new Date(estudio.fecha).toLocaleString()}
            {estudio.tipo?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-semibold">
                  <Microscope className="w-3 h-3" strokeWidth={2.5} />
                  {estudio.tipo.nombre}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/estudios/${id}/editar`)}
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
                         bg-violet-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-violet-700 active:bg-violet-800 transition
                         disabled:opacity-50 shadow-sm shadow-violet-600/20"
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

      {/* ═══ Banner destacado del tipo de estudio ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/25 shrink-0">
          <Microscope className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
            Estudio realizado
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {estudio.tipo?.nombre || 'Sin tipo asignado'}
          </p>
          <p className="text-xs text-violet-700 mt-0.5">
            {estudio.mascota?.nombre} · {new Date(estudio.fecha).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {imagenesCount > 0 && (
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-violet-200">
            <ImageIcon className="w-3.5 h-3.5 text-violet-600" strokeWidth={2.2} />
            <span className="text-xs font-semibold text-violet-700 tabular-nums">
              {imagenesCount} {imagenesCount === 1 ? 'imagen' : 'imágenes'}
            </span>
          </div>
        )}
      </div>

      {/* ═══ Info general ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Información del estudio
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoBlock
            icon={Heart}
            label="Mascota"
            value={estudio.mascota?.nombre}
            tone="violet"
          />
          <InfoBlock
            icon={User}
            label="Doctor"
            value={estudio.doctor?.nombre || 'No asignado'}
            tone="violet"
          />
          <InfoBlock
            icon={Calendar}
            label="Fecha"
            value={new Date(estudio.fecha).toLocaleString()}
            tone="violet"
          />
          <InfoBlock
            icon={FlaskConical}
            label="Tipo de estudio"
            value={estudio.tipo?.nombre}
            tone="violet"
          />
        </div>
      </div>

      {/* ═══ Resultados ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
          <FileText className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Resultados
          </h2>
          {resultadosCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {resultadosCount}
            </span>
          )}
        </div>

        {resultadosCount > 0 ? (
          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {Object.entries(estudio.resultado).map(([k, v]) => (
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
        ) : (
          <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
            <p className="font-medium text-slate-500">Sin resultados</p>
            <p className="text-xs mt-0.5">Este estudio no tiene resultados registrados</p>
          </div>
        )}
      </div>

      {/* ═══ Imágenes ═══ */}
      {imagenesCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
            <ImageIcon className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Imágenes del estudio
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {imagenesCount}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {estudio.imagenes.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setImagenAmpliada(img)}
                className="group relative aspect-square rounded-xl overflow-hidden
                           border border-slate-200 bg-slate-50
                           hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10
                           active:scale-[0.98] transition-all"
              >
                <img
                  src={getImageUrl(img.url)}
                  alt={`Estudio imagen ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] font-semibold text-white drop-shadow">
                    Imagen {idx + 1}
                  </span>
                  <span className="p-1 rounded-md bg-white/20 backdrop-blur-sm">
                    <ZoomIn className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            Toca una imagen para ampliarla
          </p>
        </div>
      )}

      {/* ═══ Lightbox / Visor de imagen ampliada ═══ */}
      {imagenAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm
                     flex items-center justify-center p-4 sm:p-8"
          onClick={() => setImagenAmpliada(null)}
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setImagenAmpliada(null);
            }}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur
                       text-white transition z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>

          {/* Botón descargar */}
          <a
            href={getImageUrl(imagenAmpliada.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur
                       text-white transition z-10"
            aria-label="Abrir en nueva pestaña"
          >
            <Download className="w-5 h-5" strokeWidth={2.5} />
          </a>

          {/* Imagen */}
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(imagenAmpliada.url)}
              alt="Estudio ampliado"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
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
    violet: 'bg-violet-50 text-violet-600',
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

export default EstudioDetailPage;