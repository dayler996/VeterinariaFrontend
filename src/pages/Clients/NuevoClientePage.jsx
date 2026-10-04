import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCliente, reactivarCliente } from '../../services/clienteService';
import ClienteForm from '../../components/forms/ClienteForm';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, UserCheck, AlertTriangle,
  CreditCard, Phone, X, Check,
} from 'lucide-react';

const NuevoClientePage = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteInactivo, setClienteInactivo] = useState(null);
  const [reactivando, setReactivando] = useState(false);

  const handleSave = async (data) => {
    try {
      await createCliente(data);
      toast.success('Cliente creado');
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
      toast.success('Cliente reactivado');
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
        subtitle="Registra los datos del cliente"
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/25 shrink-0">
          <UserPlus className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider">
            Nuevo registro
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5">
            Registrar un nuevo cliente
          </p>
          <p className="text-xs text-cyan-700 mt-0.5">
            Los datos quedarán disponibles para asociar mascotas, citas y facturas
          </p>
        </div>
      </div>

      {/* ═══ Formulario ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <ClienteForm
          onSave={handleSave}
          onCancel={() => navigate('/clientes')}
        />
      </div>

      {/* ═══ Modal: Cliente existente inactivo ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !reactivando && setModalOpen(false)}
        title="Cliente existente inactivo"
        size="md"
      >
        {/* Aviso ámbar */}
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.2} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Ya existe un cliente con esa cédula
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Está desactivado. ¿Deseas reactivarlo para usarlo de nuevo?
            </p>
          </div>
        </div>

        {/* Info cliente inactivo */}
        {clienteInactivo && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden mb-4">
            <div className="divide-y divide-slate-100">
              <ModalInfoRow
                icon={Users}
                label="Nombre"
                value={clienteInactivo.nombre}
              />
              <ModalInfoRow
                icon={CreditCard}
                label="Cédula"
                value={clienteInactivo.cedula}
              />
              {clienteInactivo.telefono && (
                <ModalInfoRow
                  icon={Phone}
                  label="Teléfono"
                  value={clienteInactivo.telefono}
                />
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            disabled={reactivando}
            className="inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                       hover:bg-slate-200 transition order-2 sm:order-1 disabled:opacity-50"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleReactivar}
            disabled={reactivando}
            className="inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium
                       hover:bg-emerald-700 active:bg-emerald-800 transition
                       order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-emerald-600/20"
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
  <div className="flex items-center gap-3 px-3 py-2.5">
    <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-cyan-600" strokeWidth={2.2} />
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

export default NuevoClientePage;