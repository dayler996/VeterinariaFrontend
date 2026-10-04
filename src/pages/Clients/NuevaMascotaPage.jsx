import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { createMascota } from '../../services/mascotaService';
import { getCliente } from '../../services/clienteService';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  PawPrint, UserPlus, Users as UsersIcon,
  AlertTriangle, Heart, Sparkles,
} from 'lucide-react';

const NuevaMascotaPage = () => {
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
      await createMascota({ ...data, clienteId: parseInt(id) });
      toast.success('Mascota creada');
      navigate(`/clientes/${id}`);
    } catch {
      toast.error('Error al crear mascota');
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
          <button
            onClick={() => navigate('/clientes')}
            className="mt-3 text-cyan-600 hover:text-cyan-800 text-sm font-medium"
          >
            ← Volver a clientes
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="🐾"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: cliente.nombre, to: `/clientes/${id}` },
          { label: 'Nueva Mascota' },
        ]}
        title="Nueva Mascota"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <UsersIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
            Para {cliente.nombre}
          </span>
        }
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
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            Registrar una nueva mascota
          </p>
          <p className="text-xs text-cyan-700 mt-0.5">
            Los datos quedarán asociados al dueño {cliente.nombre}
          </p>
        </div>
      </div>

      {/* ═══ Formulario ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <MascotaForm
          onSave={handleSave}
          onCancel={() => navigate(`/clientes/${id}`)}
          clienteId={parseInt(id)}
        />
      </div>
    </div>
  );
};

export default NuevaMascotaPage;