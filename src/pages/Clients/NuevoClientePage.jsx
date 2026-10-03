// frontend/src/pages/clientes/NuevoClientePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCliente, reactivarCliente } from '../../services/clienteService';
import ClienteForm from '../../components/forms/ClienteForm';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';

const NuevoClientePage = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteInactivo, setClienteInactivo] = useState(null);

  const handleSave = async (data) => {
    try {
      await createCliente(data);
      toast.success('Cliente creado');
      navigate('/clientes');
    } catch (error) {
      if (error.response?.status === 409) {
        // Cliente inactivo encontrado
        setClienteInactivo(error.response.data.clienteExistente);
        setModalOpen(true);
      } else {
        toast.error(error.response?.data?.error || 'Error al crear cliente');
      }
    }
  };

  const handleReactivar = async () => {
    try {
      await reactivarCliente(clienteInactivo.id);
      toast.success('Cliente reactivado');
      setModalOpen(false);
      navigate('/clientes');
    } catch (error) {
      toast.error('Error al reactivar cliente');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nuevo Cliente</h1>
      <ClienteForm
        onSave={handleSave}
        onCancel={() => navigate('/clientes')}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Cliente existente inactivo">
        <p>Ya existe un cliente con esta cédula pero está desactivado. ¿Deseas reactivarlo?</p>
        {clienteInactivo && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <p><strong>Nombre:</strong> {clienteInactivo.nombre}</p>
            <p><strong>Cédula:</strong> {clienteInactivo.cedula}</p>
            <p><strong>Teléfono:</strong> {clienteInactivo.telefono}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
          <button onClick={handleReactivar} className="px-4 py-2 bg-green-600 text-white rounded">Reactivar</button>
        </div>
      </Modal>
    </div>
  );
};

export default NuevoClientePage;