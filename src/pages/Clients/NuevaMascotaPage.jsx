import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MascotaForm from '../../components/forms/MascotaForm';
import { createMascota } from '../../services/mascotaService';
import { getCliente } from '../../services/clienteService';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const NuevaMascotaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCliente(); }, [id]);

  const loadCliente = async () => {
    try {
      const res = await getCliente(id);
      setCliente(res.data);
    } catch { toast.error('Error al cargar cliente'); }
    finally { setLoading(false); }
  };

  const handleSave = async (data) => {
    try {
      await createMascota({ ...data, clienteId: parseInt(id) });
      toast.success('Mascota creada');
      navigate(`/clientes/${id}`);
    } catch { toast.error('Error al crear mascota'); }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;
  if (!cliente) return <div className="text-center p-4 text-gray-500">Cliente no encontrado</div>;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="🐾"
        breadcrumbs={[
          { label: 'Clientes', to: '/clientes' },
          { label: cliente.nombre, to: `/clientes/${id}` },
          { label: 'Nueva Mascota' },
        ]}
        title="Nueva Mascota"
        subtitle={`Para ${cliente.nombre}`}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
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