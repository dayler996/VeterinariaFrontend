import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { getMascota, updateMascota } from '../../services/mascotaService';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const EditarMascotaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMascota(); }, [id]);

  const loadMascota = async () => {
    try {
      const res = await getMascota(id);
      setMascota(res.data);
    } catch { toast.error('Error al cargar la mascota'); }
    finally { setLoading(false); }
  };

  const handleSave = async (data) => {
    try {
      await updateMascota(id, data);
      toast.success('Mascota actualizada');
      navigate(`/mascotas/${id}`);
    } catch { toast.error('Error al actualizar'); }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;
  if (!mascota) return <div className="text-center p-4 text-gray-500">Mascota no encontrada</div>;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="🐾"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: mascota.dueno?.nombre, to: `/clientes/${mascota.dueno?.id}` },
          { label: mascota.nombre, to: `/mascotas/${id}` },
          { label: 'Editar' },
        ]}
        title={`Editar Mascota: ${mascota.nombre}`}
        subtitle={`Dueño: ${mascota.dueno?.nombre || '—'}`}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
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