import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMonitoreo, deleteMonitoreo } from '../../services/monitoreoService';
import { generateMonitoreoPDF } from '../../services/pdfService';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  Activity, Pencil, Trash2, FileDown,
  Stethoscope, Calendar, FileText,
  ClipboardList, AlertTriangle, Heart,
  BedDouble, Clock, TrendingUp,
} from 'lucide-react';

const MonitoreoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [monitoreo, setMonitoreo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadMonitoreo(); /* eslint-disable-next-line */ }, [id]);

  const loadMonitoreo = async () => {
    try {
      const res = await getMonitoreo(id);
      setMonitoreo(res.data);
    } catch {
      toast.error('Error al cargar el monitoreo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar monitoreo',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMonitoreo(id);
      toast.success('Monitoreo eliminado');
      navigate(`/hospitalizaciones/${monitoreo.hospitalizacionId}`);
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-indigo-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!monitoreo) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Monitoreo no encontrado</p>
        </div>
      </div>
    );
  }

  const detallesCount = monitoreo.detalles
    ? Object.keys(monitoreo.detalles).length
    : 0;

  const fechaMonitoreo = new Date(monitoreo.fechaHora);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="📈"
        breadcrumbs={[
          { label: 'Hospitalizaciones', to: '/hospitalizaciones' },
          { label: 'Hospitalización', to: `/hospitalizaciones/${monitoreo.hospitalizacionId}` },
          { label: 'Monitoreo' },
        ]}
        title="Detalle de Monitoreo"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {fechaMonitoreo.toLocaleString()}
            {monitoreo.doctor?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                  <Stethoscope className="w-3 h-3" strokeWidth={2.5} />
                  Dr. {monitoreo.doctor.nombre}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/monitoreos/${id}/editar`)}
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
                         bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-indigo-700 active:bg-indigo-800 transition
                         disabled:opacity-50 shadow-sm shadow-indigo-600/20"
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

      {/* ═══ Banner destacado del monitoreo ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
          <Activity className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
            Registro de monitoreo
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {fechaMonitoreo.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 mt-0.5">
            <Clock className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            <span className="tabular-nums">
              {fechaMonitoreo.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {detallesCount > 0 && (
              <>
                <span className="text-indigo-300">·</span>
                <TrendingUp className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                <span>{detallesCount} signo{detallesCount === 1 ? '' : 's'} registrado{detallesCount === 1 ? '' : 's'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Info general ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Información general
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoBlock
            icon={Calendar}
            label="Fecha y hora"
            value={fechaMonitoreo.toLocaleString()}
            tone="indigo"
          />
          <InfoBlock
            icon={Stethoscope}
            label="Doctor"
            value={monitoreo.doctor?.nombre || 'No asignado'}
            tone="indigo"
          />
          <InfoBlock
            icon={BedDouble}
            label="Hospitalización"
            value={`#${monitoreo.hospitalizacionId}`}
            tone="indigo"
          />
        </div>
      </div>

      {/* ═══ Signos / Detalles ═══ */}
      {detallesCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Heart className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Signos y detalles
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {detallesCount}
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {Object.entries(monitoreo.detalles).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="text-xs font-medium text-slate-500 min-w-[140px] shrink-0 capitalize">
                    {k
                      .replace(/([A-Z_])/g, (m) => (m === '_' ? ' ' : ` ${m}`))
                      .replace(/^./, (s) => s.toUpperCase())}
                  </span>
                  <span className="text-sm font-medium text-slate-800 flex-1 break-words tabular-nums">
                    {v?.toString() || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Observaciones ═══ */}
      {monitoreo.observaciones && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Observaciones
            </h2>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {monitoreo.observaciones}
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
    indigo: 'bg-indigo-50 text-indigo-600',
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

export default MonitoreoDetailPage;