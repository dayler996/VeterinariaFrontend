import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCliente, reactivarCliente } from '../../services/clienteService';
import ClienteForm from '../../components/forms/ClienteForm';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, AlertTriangle, CreditCard, Phone,
  X, Mail, MapPin, ArrowRight, Info, CheckCircle2,
  UserPlus,
} from 'lucide-react';

const NuevoClientePage = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteInactivo, setClienteInactivo] = useState(null);
  const [reactivando, setReactivando] = useState(false);

  const handleSave = async (data) => {
    try {
      await createCliente(data);
      toast.success('Cliente creado exitosamente');
      navigate('/clientes');
    } catch (error) {
      if (error.response?.status === 409) {
        setClienteInactivo(error.response.data.clienteExistente);
        setModalOpen(true);
      } else {
        toast.error(error.response?.data?.error || 'Error al crear cliente');
      }
    }
  };

  const handleReactivar = async () => {
    setReactivando(true);
    try {
      await reactivarCliente(clienteInactivo.id);
      toast.success('Cliente reactivado exitosamente');
      setModalOpen(false);
      navigate('/clientes');
    } catch {
      toast.error('Error al reactivar cliente');
    } finally {
      setReactivando(false);
    }
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="👥"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: 'Nuevo Cliente' },
        ]}
        title="Nuevo Cliente"
        subtitle="Completa los datos para registrar el cliente"
      />

      {/* ═══ Info strip compacto ═══ */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2
                      p-3 rounded-lg bg-cyan-50 border border-cyan-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <UserPlus className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <p className="text-xs text-cyan-900">
            Los campos con <span className="text-red-500 font-bold">*</span> son obligatorios
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-700 shrink-0">
          <Info className="w-3 h-3 shrink-0" strokeWidth={2.5} />
          Verifica la cédula antes de guardar
        </div>
      </div>

      {/* ═══ Formulario ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <ClienteForm
          onSave={handleSave}
          onCancel={() => navigate('/clientes')}
        />
      </div>

      {/* ═══ Modal: Cliente inactivo existente ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !reactivando && setModalOpen(false)}
        title="Cliente existente inactivo"
        size="md"
      >
        {/* Aviso */}
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-white
                        border border-amber-200 flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-900">
              Ya existe un cliente con esa cédula
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Fue desactivado previamente. Si lo reactivas, recuperará todas sus
              mascotas, citas y facturas.
            </p>
          </div>
        </div>

        {/* Info cliente inactivo */}
        {clienteInactivo && (
          <>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1 h-4 bg-slate-700 rounded-full"></span>
              <Users className="w-3.5 h-3.5 text-slate-700 shrink-0" strokeWidth={2.2} />
              <h3 className="text-sm font-semibold text-slate-800">
                Datos del cliente
              </h3>
              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full
                                bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                Inactivo
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden mb-4">
              <div className="divide-y divide-slate-100">
                <ModalInfoRow icon={Users}      label="Nombre"    value={clienteInactivo.nombre} />
                <ModalInfoRow icon={CreditCard} label="Cédula"    value={clienteInactivo.cedula} />
                {clienteInactivo.telefono && (
                  <ModalInfoRow icon={Phone} label="Teléfono" value={clienteInactivo.telefono} />
                )}
                {clienteInactivo.email && (
                  <ModalInfoRow icon={Mail} label="Email" value={clienteInactivo.email} />
                )}
                {clienteInactivo.direccion && (
                  <ModalInfoRow icon={MapPin} label="Dirección" value={clienteInactivo.direccion} />
                )}
              </div>
            </div>
          </>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            disabled={reactivando}
            className="inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                       hover:bg-slate-200 active:bg-slate-300 transition
                       order-2 sm:order-1 disabled:opacity-50"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleReactivar}
            disabled={reactivando}
            className="inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white
                       rounded-lg text-sm font-semibold
                       hover:from-emerald-600 hover:to-emerald-700
                       active:from-emerald-700 active:to-emerald-800
                       transition order-1 sm:order-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-emerald-600/25"
          >
            {reactivando ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                Reactivando...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" strokeWidth={2.5} />
                Reactivar cliente
                <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

/* ── Fila de info en el modal ── */
const ModalInfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5 px-3 py-2.5">
    <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
      <Icon className="w-3.5 h-3.5 text-cyan-600" strokeWidth={2.2} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">
        {value || '—'}
      </p>
    </div>
  </div>
);

export default NuevoClientePage;