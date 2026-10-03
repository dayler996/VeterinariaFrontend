import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { createMascota } from '../../services/mascotaService';
import { getCliente } from '../../services/clienteService';
import toast from 'react-hot-toast';

const NuevaMascotaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCliente();
  }, [id]);

  const loadCliente = async () => {
    try {
      const res = await getCliente(id);
      setCliente(res.data);
    } catch (error) {
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
      toast.error('Error al crear mascota');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!cliente) return <div className="text-center p-4">Cliente no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Nueva Mascota para {cliente.nombre}
      </h1>
      <MascotaForm
        onSave={handleSave}
        onCancel={() => navigate(`/clientes/${id}`)}
        clienteId={parseInt(id)}
      />
    </div>
  );
};

export default NuevaMascotaPage;