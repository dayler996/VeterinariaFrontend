import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVacunacion, deleteVacunacion } from '../../services/vacunacionService';
import { generateVacunacionPDF } from '../../services/pdfService';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  Syringe, Pencil, Trash2, FileDown,
  Heart, User, Calendar, ShieldCheck,
  ClipboardList, FileText, AlertTriangle,
  CalendarClock, Bell, BellOff, BellRing,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';

const VacunacionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [vacunacion, setVacunacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadVacunacion(); /* eslint-disable-next-line */ }, [id]);

  const loadVacunacion = async () => {
    try {
      const res = await getVacunacion(id);
      setVacunacion(res.data);
    } catch {
      toast.error('Error al cargar vacunación');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar vacunación',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteVacunacion(id);
      toast.success('Vacunación eliminada');
      navigate(`/mascotas/${vacunacion.mascotaId}`);
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
            ['Próximo refuerzo', vacunacion.proximoRefuerzo
              ? new Date(vacunacion.proximoRefuerzo).toLocaleDateString()
              : 'No especificado'],
            ['Observación', vacunacion.observacion || ''],
          ],
        },
      ];

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
          sections.push({ title: 'Notificaciones', type: 'keyValue', content: notificacionesContent });
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-emerald-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!vacunacion) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Vacunación no encontrada</p>
        </div>
      </div>
    );
  }

  /* ── Estado del refuerzo ── */
  const refuerzo = vacunacion.proximoRefuerzo ? new Date(vacunacion.proximoRefuerzo) : null;
  const diasRestantes = refuerzo
    ? Math.ceil((refuerzo - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  let refuerzoTone = {
    bg: 'from-slate-50 to-white',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconCls: 'text-slate-500',
    label: 'text-slate-600',
    titleCls: 'text-slate-800',
    subCls: 'text-slate-500',
    pill: 'bg-slate-100 text-slate-600',
    text: 'Sin programar',
  };

  if (diasRestantes !== null) {
    if (diasRestantes < 0) {
      refuerzoTone = {
        bg: 'from-red-50 to-white',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        iconCls: 'text-red-600',
        label: 'text-red-700',
        titleCls: 'text-red-900',
        subCls: 'text-red-700',
        pill: 'bg-red-100 text-red-700',
        text: 'Vencido',
      };
    } else if (diasRestantes <= 7) {
      refuerzoTone = {
        bg: 'from-amber-50 to-white',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100',
        iconCls: 'text-amber-600',
        label: 'text-amber-700',
        titleCls: 'text-amber-900',
        subCls: 'text-amber-700',
        pill: 'bg-amber-100 text-amber-700',
        text: `En ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`,
      };
    } else {
      refuerzoTone = {
        bg: 'from-emerald-50 to-white',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        iconCls: 'text-emerald-600',
        label: 'text-emerald-700',
        titleCls: 'text-emerald-900',
        subCls: 'text-emerald-700',
        pill: 'bg-emerald-100 text-emerald-700',
        text: `En ${diasRestantes} días`,
      };
    }
  }

  /* ── Notificaciones ── */
  const tieneNotif1 = vacunacion.notificado_primero !== undefined;
  const tieneNotif2 = vacunacion.notificado_segundo !== undefined;
  const hayNotificaciones = tieneNotif1 || tieneNotif2;

  const detallesCount = vacunacion.detalles
    ? Object.keys(vacunacion.detalles).length
    : 0;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="💉"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: vacunacion.mascota?.dueno?.nombre, to: `/clientes/${vacunacion.mascota?.dueno?.id}` },
          { label: vacunacion.mascota?.nombre, to: `/mascotas/${vacunacion.mascotaId}` },
          { label: 'Vacunación' },
        ]}
        title="Detalle de Vacunación"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {new Date(vacunacion.fechaAplicacion).toLocaleString()}
            {vacunacion.vacuna?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  <Syringe className="w-3 h-3" strokeWidth={2.5} />
                  {vacunacion.vacuna.nombre}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/vacunaciones/${id}/editar`)}
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
                         bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-emerald-700 active:bg-emerald-800 transition
                         disabled:opacity-50 shadow-sm shadow-emerald-600/20"
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

      {/* ═══ Banner destacado de la vacuna ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Vacuna aplicada
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {vacunacion.vacuna?.nombre || 'Sin vacuna asignada'}
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            {vacunacion.mascota?.nombre} · {new Date(vacunacion.fechaAplicacion).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {refuerzo && (
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${refuerzoTone.pill}`}>
            <CalendarClock className="w-3.5 h-3.5" strokeWidth={2.5} />
            {refuerzoTone.text}
          </span>
        )}
      </div>

      {/* ═══ Info general ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Información de la vacunación
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoBlock
            icon={Heart}
            label="Mascota"
            value={vacunacion.mascota?.nombre}
            tone="emerald"
          />
          <InfoBlock
            icon={User}
            label="Doctor"
            value={vacunacion.doctor?.nombre || 'No asignado'}
            tone="emerald"
          />
          <InfoBlock
            icon={Calendar}
            label="Fecha de aplicación"
            value={new Date(vacunacion.fechaAplicacion).toLocaleString()}
            tone="emerald"
          />
          <InfoBlock
            icon={Syringe}
            label="Vacuna"
            value={vacunacion.vacuna?.nombre}
            tone="emerald"
          />
        </div>
      </div>

      {/* ═══ Próximo refuerzo ═══ */}
      {refuerzo && (
        <div className={`mb-4 p-4 rounded-xl border bg-gradient-to-r flex items-center gap-3 ${refuerzoTone.border} ${refuerzoTone.bg}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${refuerzoTone.iconBg}`}>
            <CalendarClock className={`w-6 h-6 ${refuerzoTone.iconCls}`} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${refuerzoTone.label}`}>
              Próximo refuerzo
            </p>
            <p className={`text-base font-bold mt-0.5 ${refuerzoTone.titleCls}`}>
              {refuerzo.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${refuerzoTone.subCls}`}>
              {diasRestantes < 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  Vencido hace {Math.abs(diasRestantes)} día{Math.abs(diasRestantes) === 1 ? '' : 's'}
                </>
              ) : diasRestantes === 0 ? (
                <>
                  <Clock className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  Es hoy
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  Faltan {diasRestantes} día{diasRestantes === 1 ? '' : 's'}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ═══ Observación ═══ */}
      {vacunacion.observacion && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">Observación</h2>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {vacunacion.observacion}
            </p>
          </div>
        </div>
      )}

      {/* ═══ Notificaciones ═══ */}
      {hayNotificaciones && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <Bell className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Notificaciones
            </h2>
          </div>

          <div className="space-y-3">
            {tieneNotif1 && (
              <NotificacionCard
                numero="Primera notificación"
                enviada={vacunacion.notificado_primero}
                fecha={vacunacion.fecha_notificacion_primero}
              />
            )}
            {tieneNotif2 && (
              <NotificacionCard
                numero="Segunda notificación"
                enviada={vacunacion.notificado_segundo}
                fecha={vacunacion.fecha_notificacion_segundo}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══ Detalles adicionales ═══ */}
      {detallesCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
            <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Detalles adicionales
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {detallesCount}
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {Object.entries(vacunacion.detalles).map(([k, v]) => (
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
    </div>
  );
};

/* ── Bloque de info reutilizable ── */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    emerald: 'bg-emerald-50 text-emerald-600',
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

/* ── Card de notificación ── */
const NotificacionCard = ({ numero, enviada, fecha }) => {
  const enviadaBool = enviada === true;
  const Icon = enviadaBool ? CheckCircle2 : XCircle;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        enviadaBool
          ? 'bg-emerald-50/50 border-emerald-100'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          enviadaBool ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
        }`}
      >
        <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${enviadaBool ? 'text-emerald-900' : 'text-slate-700'}`}>
          {numero}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
              enviadaBool
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {enviadaBool ? (
              <>
                <BellRing className="w-2.5 h-2.5" strokeWidth={2.5} />
                Enviada
              </>
            ) : (
              <>
                <BellOff className="w-2.5 h-2.5" strokeWidth={2.5} />
                No enviada
              </>
            )}
          </span>
          {fecha && (
            <span className="text-[11px] text-slate-500 tabular-nums">
              {new Date(fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacunacionDetailPage;