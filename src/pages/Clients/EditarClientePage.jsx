import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCliente, updateCliente } from '../../services/clienteService';
import ClienteForm from '../../components/forms/ClienteForm';
import toast from 'react-hot-toast';

const EditarClientePage = () => {
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
      await updateCliente(id, data);
      toast.success('Cliente actualizado');
      navigate(`/clientes/${id}`);
    } catch (error) {
      toast.error('Error al actualizar cliente');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!cliente) return <div className="text-center p-4">Cliente no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Cliente</h1>
      <ClienteForm
        initialData={cliente}
        onSave={handleSave}
        onCancel={() => navigate(`/clientes/${id}`)}
      />
    </div>
  );
};

export default EditarClientePage;