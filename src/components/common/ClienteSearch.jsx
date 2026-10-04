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
      // ✅ CORREGIDO: se pasa como objeto { search }
      const res = await getClientes({ search: cedula });
      const clientes = res.data;

      if (!clientes || clientes.length === 0) {
        toast.error('Cliente no encontrado');
        setCliente(null);
        setMascotas([]);
        return;
      }

      const clienteEncontrado = clientes[0];
      setCliente(clienteEncontrado);

      // Cargar mascotas del cliente
      const mascotasRes = await getMascotas({ clienteId: clienteEncontrado.id });
      setMascotas(mascotasRes.data || []);
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      toast.error('Error al buscar cliente');
      setCliente(null);
      setMascotas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarMascota = (mascota) => {
    setMascotaSeleccionada(mascota);
    onMascotaSelected(mascota);
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Cédula del cliente"
          value={cedula}
          onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarCliente())}
          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={buscarCliente}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Buscando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              Buscar
            </>
          )}
        </button>
      </div>

      {cliente && (
        <div className="mt-2">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
            <p className="text-sm">
              <span className="font-semibold text-gray-800">{cliente.nombre}</span>
              <span className="text-gray-500"> · CI: {cliente.cedula}</span>
            </p>
          </div>

          {mascotas.length === 0 ? (
            <p className="text-sm text-red-600 p-2 bg-red-50 border border-red-100 rounded-lg">
              Este cliente no tiene mascotas registradas.
            </p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccione una mascota:</label>
              <select
                value={mascotaSeleccionada?.id || ''}
                onChange={(e) => {
                  const masc = mascotas.find(m => m.id === parseInt(e.target.value));
                  handleSeleccionarMascota(masc);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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