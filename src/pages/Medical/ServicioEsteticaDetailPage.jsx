import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServicioEstetica, deleteServicioEstetica } from '../../services/esteticaService';
import { generateEsteticaPDF } from '../../services/pdfService';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  Scissors, Pencil, Trash2, FileDown,
  Heart, User, Calendar, Sparkles,
  ClipboardList, FileText, AlertTriangle,
} from 'lucide-react';

const ServicioEsteticaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadServicio(); /* eslint-disable-next-line */ }, [id]);

  const loadServicio = async () => {
    try {
      const res = await getServicioEstetica(id);
      setServicio(res.data);
    } catch {
      toast.error('Error al cargar servicio de estética');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar servicio',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteServicioEstetica(id);
      toast.success('Servicio eliminado');
      navigate(`/mascotas/${servicio.mascotaId}`);
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-pink-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!servicio) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Servicio no encontrado</p>
        </div>
      </div>
    );
  }

  const observacionesCount = servicio.observacion
    ? Object.keys(servicio.observacion).length
    : 0;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="✂️"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: servicio.mascota?.dueno?.nombre, to: `/clientes/${servicio.mascota?.dueno?.id}` },
          { label: servicio.mascota?.nombre, to: `/mascotas/${servicio.mascotaId}` },
          { label: 'Estética' },
        ]}
        title="Detalle de Servicio de Estética"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {new Date(servicio.fecha).toLocaleString()}
            {servicio.tipo?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                  {servicio.tipo.nombre}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/estetica/${id}/editar`)}
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
                         bg-pink-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-pink-700 active:bg-pink-800 transition
                         disabled:opacity-50 shadow-sm shadow-pink-600/20"
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

      {/* ═══ Banner de tipo de servicio (destacado) ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-600/25 shrink-0">
          <Scissors className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-pink-700 uppercase tracking-wider">
            Servicio realizado
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {servicio.tipo?.nombre || 'Sin tipo asignado'}
          </p>
          <p className="text-xs text-pink-700 mt-0.5">
            {servicio.mascota?.nombre} · {new Date(servicio.fecha).toLocaleDateString('es-ES', {
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
          <span className="w-1 h-5 bg-pink-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-pink-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Información del servicio
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoBlock
            icon={Heart}
            label="Mascota"
            value={servicio.mascota?.nombre}
            tone="pink"
          />
          <InfoBlock
            icon={User}
            label="Peluquero"
            value={servicio.trabajador?.nombre || 'No asignado'}
            tone="pink"
          />
          <InfoBlock
            icon={Calendar}
            label="Fecha del servicio"
            value={new Date(servicio.fecha).toLocaleString()}
            tone="pink"
          />
          <InfoBlock
            icon={Sparkles}
            label="Tipo de servicio"
            value={servicio.tipo?.nombre}
            tone="pink"
          />
        </div>
      </div>

      {/* ═══ Observaciones ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-pink-600 rounded-full"></span>
          <FileText className="w-4 h-4 text-pink-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">Observaciones</h2>
          {observacionesCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {observacionesCount}
            </span>
          )}
        </div>

        {observacionesCount > 0 ? (
          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {Object.entries(servicio.observacion).map(([k, v]) => (
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
            <p className="font-medium text-slate-500">Sin observaciones</p>
            <p className="text-xs mt-0.5">Este servicio no tiene notas adicionales</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Bloque de info reutilizable ── */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    pink: 'bg-pink-50 text-pink-600',
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

export default ServicioEsteticaDetailPage;