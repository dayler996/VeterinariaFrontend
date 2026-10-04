import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { getMascota, updateMascota } from '../../services/mascotaService';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  PawPrint, Pencil, AlertTriangle,
  Heart, Users as UsersIcon, Power,
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
    } catch {
      toast.error('Error al actualizar');
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
        title={`Editar Mascota`}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
            {mascota.nombre}
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

      {/* ═══ Banner info mascota ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/25 shrink-0">
          <Pencil className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider">
            Editando mascota
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {mascota.nombre}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-cyan-700 mt-0.5">
            <UsersIcon className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            <span className="truncate">
              Dueño: {mascota.dueno?.nombre || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Formulario ═══ */}
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