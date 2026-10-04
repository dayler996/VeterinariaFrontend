import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { getMascota, updateMascota } from '../../services/mascotaService';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  PawPrint, AlertTriangle, Heart, Users as UsersIcon,
  Power, Info,
} from 'lucide-react';

const EditarMascotaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMascota(); /* eslint-disable-next-line */ }, [id]);

  const loadMascota = async () => {
    try {
      const res = await getMascota(id);
      setMascota(res.data);
    } catch {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      await updateMascota(id, data);
      toast.success('Mascota actualizada');
      navigate(`/mascotas/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
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

  if (!mascota) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">Mascota no encontrada</p>
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
          { label: mascota.dueno?.nombre, to: `/clientes/${mascota.dueno?.id}` },
          { label: mascota.nombre, to: `/mascotas/${id}` },
          { label: 'Editar' },
        ]}
        title="Editar Mascota"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
            {mascota.nombre}
            {mascota.dueno?.nombre && (
              <>
                <span className="text-slate-300">·</span>
                <UsersIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
                {mascota.dueno.nombre}
              </>
            )}
            {!mascota.activo && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-semibold">
                  <Power className="w-3 h-3" strokeWidth={2.5} />
                  Inactiva
                </span>
              </>
            )}
          </span>
        }
      />

      {/* Info strip compacto */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2
                      p-3 rounded-lg bg-cyan-50 border border-cyan-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <PawPrint className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <p className="text-xs text-cyan-900">
            Modifica los datos y guarda los cambios
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-700 shrink-0">
          <Info className="w-3 h-3 shrink-0" strokeWidth={2.5} />
          Los campos con <span className="text-red-500 font-bold">*</span> son obligatorios
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        <MascotaForm
          initialData={mascota}
          onSave={handleSave}
          onCancel={() => navigate(`/mascotas/${id}`)}
          clienteId={mascota.dueno?.id}
        />
      </div>
    </div>
  );
};

export default EditarMascotaPage;