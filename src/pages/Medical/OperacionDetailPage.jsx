import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOperacion, deleteOperacion } from '../../services/operacionService';
import { generateOperacionPDF } from '../../services/pdfService';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  Stethoscope, Pencil, Trash2, FileDown,
  Heart, User, Calendar, Activity,
  ClipboardList, FileText, AlertTriangle,
  Scissors,
} from 'lucide-react';

const OperacionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [operacion, setOperacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadOperacion(); /* eslint-disable-next-line */ }, [id]);

  const loadOperacion = async () => {
    try {
      const res = await getOperacion(id);
      setOperacion(res.data);
    } catch {
      toast.error('Error al cargar operación');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar operación',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteOperacion(id);
      toast.success('Operación eliminada');
      navigate(`/mascotas/${operacion.mascotaId}`);
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
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-orange-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!operacion) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Operación no encontrada</p>
        </div>
      </div>
    );
  }

  const notasCount = operacion.notas ? Object.keys(operacion.notas).length : 0;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="⚕️"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: operacion.mascota?.dueno?.nombre, to: `/clientes/${operacion.mascota?.dueno?.id}` },
          { label: operacion.mascota?.nombre, to: `/mascotas/${operacion.mascotaId}` },
          { label: 'Operación' },
        ]}
        title="Detalle de Operación"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {new Date(operacion.fecha).toLocaleString()}
            {operacion.tipo?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-semibold">
                  <Stethoscope className="w-3 h-3" strokeWidth={2.5} />
                  {operacion.tipo.nombre}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/operaciones/${id}/editar`)}
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
                         bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-orange-700 active:bg-orange-800 transition
                         disabled:opacity-50 shadow-sm shadow-orange-600/20"
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

      {/* ═══ Banner destacado del tipo de operación ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/25 shrink-0">
          <Stethoscope className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">
            Procedimiento quirúrgico
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {operacion.tipo?.nombre || 'Sin tipo asignado'}
          </p>
          <p className="text-xs text-orange-700 mt-0.5">
            {operacion.mascota?.nombre} · {new Date(operacion.fecha).toLocaleDateString('es-ES', {
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
          <span className="w-1 h-5 bg-orange-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Información de la operación
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoBlock
            icon={Heart}
            label="Mascota"
            value={operacion.mascota?.nombre}
            tone="orange"
          />
          <InfoBlock
            icon={Scissors}
            label="Cirujano"
            value={operacion.cirujano?.nombre || 'No asignado'}
            tone="orange"
          />
          <InfoBlock
            icon={Calendar}
            label="Fecha"
            value={new Date(operacion.fecha).toLocaleString()}
            tone="orange"
          />
          <InfoBlock
            icon={Activity}
            label="Tipo de operación"
            value={operacion.tipo?.nombre}
            tone="orange"
          />
        </div>
      </div>

      {/* ═══ Notas quirúrgicas ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-orange-600 rounded-full"></span>
          <FileText className="w-4 h-4 text-orange-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Notas quirúrgicas
          </h2>
          {notasCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
              {notasCount}
            </span>
          )}
        </div>

        {notasCount > 0 ? (
          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {Object.entries(operacion.notas).map(([k, v]) => (
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
            <p className="font-medium text-slate-500">Sin notas quirúrgicas</p>
            <p className="text-xs mt-0.5">Esta operación no tiene notas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Bloque de info reutilizable ── */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    orange: 'bg-orange-50 text-orange-600',
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

export default OperacionDetailPage;