import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOperaciones } from '../../services/operacionService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const OperacionesPage = () => {
  const navigate = useNavigate();
  const [operaciones, setOperaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Mascota', accessorKey: 'mascota.nombre' },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Cirujano', accessorKey: 'cirujano.nombre' },
  ];

  useEffect(() => {
    loadOperaciones();
  }, []);

  const loadOperaciones = async () => {
    try {
      setLoading(true);
      const res = await getOperaciones();
      setOperaciones(res.data);
    } catch (error) {
      toast.error('Error al cargar operaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (operacion) => {
    navigate(`/operaciones/${operacion.id}`);
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Operaciones</h1>
        <button
          onClick={() => navigate('/operaciones/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nueva Operación
        </button>
      </div>
      <DataTable columns={columns} data={operaciones} onRowClick={handleRowClick} />
    </div>
  );
};

export default OperacionesPage;