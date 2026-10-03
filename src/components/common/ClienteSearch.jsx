import { useState } from 'react';
import { getClientes } from '../../services/clienteService';
import { getMascotas } from '../../services/mascotaService';
import toast from 'react-hot-toast';

const ClienteSearch = ({ onMascotaSelected }) => {
  const [cedula, setCedula] = useState('');
  const [cliente, setCliente] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  const buscarCliente = async () => {
    if (!cedula.trim()) {
      toast.error('Ingrese una cédula');
      return;
    }
    setLoading(true);
    try {
      // Buscar cliente por cédula (el endpoint puede ser /clientes?search=...)
      const res = await getClientes(cedula);
      const clientes = res.data;
      if (clientes.length === 0) {
        toast.error('Cliente no encontrado');
        setCliente(null);
        setMascotas([]);
      } else {
        const clienteEncontrado = clientes[0];
        setCliente(clienteEncontrado);
        // Cargar mascotas de ese cliente
        const mascotasRes = await getMascotas({ clienteId: clienteEncontrado.id });
        setMascotas(mascotasRes.data);
      }
    } catch (error) {
      toast.error('Error al buscar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarMascota = (mascota) => {
    setMascotaSeleccionada(mascota);
    onMascotaSelected(mascota);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Cédula del cliente"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={buscarCliente}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {cliente && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{cliente.nombre}</span></p>
          {mascotas.length === 0 ? (
            <p className="text-red-600">Este cliente no tiene mascotas registradas.</p>
          ) : (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Seleccione una mascota:</label>
              <select
                value={mascotaSeleccionada?.id || ''}
                onChange={(e) => {
                  const masc = mascotas.find(m => m.id === parseInt(e.target.value));
                  handleSeleccionarMascota(masc);
                }}
                className="block w-full border rounded p-2"
              >
                <option value="">-- Seleccione --</option>
                {mascotas.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClienteSearch;