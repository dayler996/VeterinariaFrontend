import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { getMascota, updateMascota } from '../../services/mascotaService';
import toast from 'react-hot-toast';

const EditarMascotaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMascota();
  }, [id]);

  const loadMascota = async () => {
    try {
      const res = await getMascota(id);
      setMascota(res.data);
    } catch (error) {
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
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!mascota) return <div className="text-center p-4">Mascota no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Editar Mascota: {mascota.nombre}
      </h1>
      <MascotaForm
        initialData={mascota}
        onSave={handleSave}
        onCancel={() => navigate(`/mascotas/${id}`)}
        clienteId={mascota.dueno?.id}
      />
    </div>
  );
};

export default EditarMascotaPage;