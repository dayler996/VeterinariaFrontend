import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCliente, updateCliente } from '../../services/clienteService';
import ClienteForm from '../../components/forms/ClienteForm';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  User, Pencil, CreditCard, AlertTriangle, Users as UsersIcon,
} from 'lucide-react';

const EditarClientePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCliente(); /* eslint-disable-next-line */ }, [id]);

  const loadCliente = async () => {
    try {
      const res = await getCliente(id);
      setCliente(res.data);
    } catch {
      toast.error('Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      await updateCliente(id, data);
      toast.success('Cliente actualizado');
      navigate(`/clientes/${id}`);
    } catch {
      toast.error('Error al actualizar cliente');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-cyan-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Cliente no encontrado</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="👤"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: cliente.nombre, to: `/clientes/${id}` },
          { label: 'Editar' },
        ]}
        title={`Editar Cliente: ${cliente.nombre}`}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <CreditCard className="w-3.5 h-3.5" strokeWidth={2.2} />
            CI: {cliente.cedula}
            {!cliente.activo && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-semibold">
                  Inactivo
                </span>
              </>
            )}
          </span>
        }
      />

      {/* ═══ Banner info cliente ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/25 shrink-0">
          <Pencil className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider">
            Editando cliente
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {cliente.nombre}
          </p>
          <p className="text-xs text-cyan-700 mt-0.5">
            Modifica los datos y guarda para aplicar los cambios
          </p>
        </div>
      </div>

      {/* ═══ Formulario ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <ClienteForm
          initialData={cliente}
          onSave={handleSave}
          onCancel={() => navigate(`/clientes/${id}`)}
        />
      </div>
    </div>
  );
};

export default EditarClientePage;