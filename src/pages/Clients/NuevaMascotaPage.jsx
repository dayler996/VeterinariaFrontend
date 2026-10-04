import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { createMascota } from '../../services/mascotaService';
import { getCliente } from '../../services/clienteService';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  PawPrint, AlertTriangle, Users as UsersIcon, Info,
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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear mascota');
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

      {/* Info strip compacto */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2
                      p-3 rounded-lg bg-cyan-50 border border-cyan-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <PawPrint className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <p className="text-xs text-cyan-900">
            Los campos con <span className="text-red-500 font-bold">*</span> son obligatorios
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-700 shrink-0">
          <Info className="w-3 h-3 shrink-0" strokeWidth={2.5} />
          Verifica el nombre antes de guardar
        </div>
      </div>

      {/* Formulario */}
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