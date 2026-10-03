import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConsultas } from '../../services/consultaService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const ConsultasPage = () => {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleString() },
    { header: 'Mascota', accessorKey: 'mascota.nombre' },
    { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
    { header: 'Motivo', accessorKey: 'motivo' },
  ];

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      setLoading(true);
      const res = await getConsultas();
      setConsultas(res.data);
    } catch (error) {
      toast.error('Error al cargar consultas');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (consulta) => {
    navigate(`/consultas/${consulta.id}`);
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Consultas Médicas</h1>
        <button
          onClick={() => navigate('/consultas/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nueva Consulta
        </button>
      </div>
      <DataTable columns={columns} data={consultas} onRowClick={handleRowClick} />
    </div>
  );
};

export default ConsultasPage;