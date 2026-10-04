import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getHospitalizacion, updateHospitalizacion,
  deleteHospitalizacion, deleteHospitalizacionCascade,
} from '../../services/hospitalizacionService';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateHospitalizacionPDF } from '../../services/pdfService';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
  BedDouble, Pencil, Check, Trash2, FileDown,
  Heart, Stethoscope, Calendar, CalendarCheck,
  FileText, ClipboardList, Activity, AlertTriangle,
  Plus, User, Clock, LogOut, CheckCircle2, X,
} from 'lucide-react';

const altaSchema = z.object({
  fechaAlta: z.string().min(1, 'Fecha de alta requerida'),
  notasAlta: z.any().optional(),
});

const HospitalizacionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [hospitalizacion, setHospitalizacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAlta, setModalAlta] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(altaSchema) });

  useEffect(() => { loadHospitalizacion(); /* eslint-disable-next-line */ }, [id]);

  const loadHospitalizacion = async () => {
    try {
      const res = await getHospitalizacion(id);
      setHospitalizacion(res.data);
    } catch {
      toast.error('Error al cargar hospitalización');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar hospitalización',
      message: 'Se eliminará la hospitalización y sus monitoreos asociados.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteHospitalizacion(id);
      toast.success('Hospitalización eliminada');
      navigate(`/mascotas/${hospitalizacion.mascotaId}`);
    } catch (error) {
      if (error.response?.data?.code === 'P2003' || error.message?.includes('P2003')) {
        const okCascade = await confirm({
          title: 'Eliminar todo',
          message: 'La hospitalización tiene monitoreos asociados. ¿Deseas eliminarlos todos junto con la hospitalización?',
          confirmText: 'Eliminar todo',
          variant: 'danger',
        });
        if (okCascade) {
          try {
            await deleteHospitalizacionCascade(id);
            toast.success('Hospitalización y monitoreos eliminados');
            navigate(`/mascotas/${hospitalizacion.mascotaId}`);
          } catch {
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
        try { notas = JSON.parse(data.notasAlta); }
        catch { notas = { contenido: data.notasAlta }; }
      }
      await updateHospitalizacion(id, { fechaAlta: data.fechaAlta || null, notasAlta: notas });
      toast.success('Alta registrada');
      setModalAlta(false);
      reset();
      loadHospitalizacion();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar alta');
    }
  };

  const handleGeneratePDF = async () => {
    if (!hospitalizacion) return;
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
      if (hospitalizacion.motivo) sections.push({ title: 'Motivo', type: 'text', content: hospitalizacion.motivo });
      if (hospitalizacion.detallesIngreso && Object.keys(hospitalizacion.detallesIngreso).length > 0) {
        sections.push({ title: 'Detalles de Ingreso', type: 'keyValue', content: Object.entries(hospitalizacion.detallesIngreso).map(([k, v]) => [k, v?.toString() || '']) });
      }
      if (hospitalizacion.fechaAlta) {
        sections.push({ title: 'Fecha de Alta', type: 'keyValue', content: [['Fecha', new Date(hospitalizacion.fechaAlta).toLocaleString()]] });
      }
      if (hospitalizacion.notasAlta && Object.keys(hospitalizacion.notasAlta).length > 0) {
        sections.push({ title: 'Notas de Alta', type: 'keyValue', content: Object.entries(hospitalizacion.notasAlta).map(([k, v]) => [k, v?.toString() || '']) });
      }
      if (hospitalizacion.monitoreos && hospitalizacion.monitoreos.length > 0) {
        sections.push({
          title: 'Monitoreos',
          type: 'table',
          headers: ['Fecha', 'Doctor', 'Observaciones'],
          data: hospitalizacion.monitoreos.map((m) => [
            new Date(m.fechaHora).toLocaleString(),
            m.doctor?.nombre || 'No especificado',
            m.observaciones || '',
          ]),
        });
      }
      await generateHospitalizacionPDF('Detalle de Hospitalización', sections);
    } catch {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const monitoreosColumns = [
    {
      header: 'Fecha/Hora',
      accessorKey: 'fechaHora',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {new Date(getValue()).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Doctor',
      accessorKey: 'doctor.nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="text-sm text-slate-700 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Observaciones',
      accessorKey: 'observaciones',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500 truncate block max-w-[320px]">
          {getValue() || '—'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-indigo-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!hospitalizacion) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Hospitalización no encontrada</p>
        </div>
      </div>
    );
  }

  const activa = !hospitalizacion.fechaAlta;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="🏥"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: hospitalizacion.mascota?.dueno?.nombre, to: `/clientes/${hospitalizacion.mascota?.dueno?.id}` },
          { label: hospitalizacion.mascota?.nombre, to: `/mascotas/${hospitalizacion.mascotaId}` },
          { label: 'Hospitalización' },
        ]}
        title="Hospitalización"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            Ingreso: {new Date(hospitalizacion.fechaIngreso).toLocaleString()}
            {activa ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                En curso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                Alta registrada
              </span>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={() => navigate(`/hospitalizaciones/${id}/editar`)}
              className="inline-flex items-center justify-center gap-1.5
                         bg-white text-slate-700 border border-slate-200
                         px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <Pencil className="w-4 h-4" strokeWidth={2.2} />
              Editar
            </button>
            {activa && (
              <button
                onClick={() => setModalAlta(true)}
                className="inline-flex items-center justify-center gap-1.5
                           bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                           hover:bg-emerald-700 active:bg-emerald-800 transition
                           shadow-sm shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
                Dar de Alta
              </button>
            )}
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

      {/* ═══ Banner de estado (móvil-friendly) ═══ */}
      <div
        className={`mb-4 p-3 rounded-xl border flex items-center gap-3 ${
          activa
            ? 'bg-gradient-to-r from-indigo-50 to-white border-indigo-200'
            : 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activa ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
          {activa ? (
            <BedDouble className={`w-5 h-5 text-indigo-600`} strokeWidth={2.2} />
          ) : (
            <LogOut className={`w-5 h-5 text-emerald-600`} strokeWidth={2.2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${activa ? 'text-indigo-900' : 'text-emerald-900'}`}>
            {activa ? 'Paciente hospitalizado' : 'Paciente dado de alta'}
          </p>
          <p className={`text-xs mt-0.5 ${activa ? 'text-indigo-700' : 'text-emerald-700'}`}>
            {activa
              ? `Ingresó el ${new Date(hospitalizacion.fechaIngreso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
              : `Alta el ${new Date(hospitalizacion.fechaAlta).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
      </div>

      {/* ═══ Info general ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
          <ClipboardList className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">Información general</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoBlock icon={Heart} label="Mascota" value={hospitalizacion.mascota?.nombre} tone="indigo" />
          <InfoBlock icon={Stethoscope} label="Doctor responsable" value={hospitalizacion.doctor?.nombre || 'No asignado'} tone="indigo" />
          <InfoBlock
            icon={Calendar}
            label="Fecha de ingreso"
            value={new Date(hospitalizacion.fechaIngreso).toLocaleString()}
            tone="indigo"
          />
          <InfoBlock
            icon={CalendarCheck}
            label="Fecha de alta"
            value={hospitalizacion.fechaAlta ? new Date(hospitalizacion.fechaAlta).toLocaleString() : '—'}
            tone={hospitalizacion.fechaAlta ? 'emerald' : 'slate'}
          />

          {hospitalizacion.motivo && (
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Motivo de ingreso
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed">{hospitalizacion.motivo}</p>
              </div>
            </div>
          )}

          {hospitalizacion.detallesIngreso && Object.keys(hospitalizacion.detallesIngreso).length > 0 && (
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Detalles de ingreso
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {Object.entries(hospitalizacion.detallesIngreso).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3 px-3 py-2">
                      <span className="text-xs font-medium text-slate-500 min-w-[120px] shrink-0 capitalize">
                        {k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
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

          {hospitalizacion.notasAlta && Object.keys(hospitalizacion.notasAlta).length > 0 && (
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <LogOut className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Notas de alta
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 overflow-hidden">
                <div className="divide-y divide-emerald-100/60">
                  {Object.entries(hospitalizacion.notasAlta).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3 px-3 py-2">
                      <span className="text-xs font-medium text-emerald-700 min-w-[120px] shrink-0 capitalize">
                        {k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      </span>
                      <span className="text-sm text-emerald-900 flex-1 break-words">
                        {v?.toString() || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hospitalizacion.consulta && (
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Consulta asociada
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2} />
                <p className="text-sm text-slate-700">
                  <span className="font-medium">
                    {new Date(hospitalizacion.consulta.fecha).toLocaleDateString()}
                  </span>
                  <span className="mx-1.5 text-slate-400">·</span>
                  {hospitalizacion.consulta.motivo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Monitoreos ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            <Activity className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Monitoreos
            </h2>
            {hospitalizacion.monitoreos?.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
                {hospitalizacion.monitoreos.length}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate(`/hospitalizaciones/${id}/monitoreos/nuevo`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5
                       bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium
                       hover:bg-indigo-700 active:bg-indigo-800 transition
                       shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nuevo Monitoreo
          </button>
        </div>

        {hospitalizacion.monitoreos?.length > 0 ? (
          <div className="rounded-lg border border-slate-200/60 overflow-hidden">
            <DataTable
              columns={monitoreosColumns}
              data={hospitalizacion.monitoreos || []}
              onRowClick={(m) => navigate(`/monitoreos/${m.id}`)}
              hidePagination
              showGlobalFilter={false}
            />
          </div>
        ) : (
          <div className="text-center py-10 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
            <p className="font-medium text-slate-500">Aún no hay monitoreos</p>
            <p className="text-xs mt-0.5">Registra el primero con el botón de arriba</p>
          </div>
        )}
      </div>

      {/* ═══ Modal Alta ═══ */}
      <Modal
        isOpen={modalAlta}
        onClose={() => !isSubmitting && setModalAlta(false)}
        title="Registrar Alta"
        size="md"
      >
        <form onSubmit={handleSubmit(handleAlta)} className="space-y-4">
          {/* Aviso */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.2} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-900">
                Confirmar alta de {hospitalizacion.mascota?.nombre}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                El alta marcará la hospitalización como finalizada.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Fecha de alta <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('fechaAlta')}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                ${errors.fechaAlta ? 'border-red-400' : 'border-slate-300'}`}
            />
            {errors.fechaAlta && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errors.fechaAlta.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              Notas de alta
              <span className="text-[11px] text-slate-400 font-normal">(JSON, opcional)</span>
            </label>
            <textarea
              {...register('notasAlta')}
              rows="4"
              placeholder='{"evolucion": "Favorable", "recomendaciones": "..."}'
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-mono
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                         resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Si no es JSON válido, se guardará como texto plano.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalAlta(false)}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                         hover:bg-slate-200 transition order-2 sm:order-1 disabled:opacity-50
                         inline-flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium
                         hover:bg-emerald-700 active:bg-emerald-800 transition
                         order-1 sm:order-2 disabled:opacity-50
                         inline-flex items-center justify-center gap-1.5
                         shadow-sm shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  Registrar alta
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ── Bloque de info reutilizable ── */
const InfoBlock = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    indigo: 'bg-indigo-50 text-indigo-600',
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

export default HospitalizacionDetailPage;