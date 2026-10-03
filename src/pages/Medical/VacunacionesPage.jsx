import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVacunaciones } from '../../services/vacunacionService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const VacunacionesPage = () => {
  const navigate = useNavigate();
  const [vacunaciones, setVacunaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { header: 'Fecha', accessorKey: 'fechaAplicacion', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Mascota', accessorKey: 'mascota.nombre' },
    { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
    { header: 'Vacuna', accessorKey: 'vacuna.nombre' },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
    { header: 'Refuerzo', accessorKey: 'proximoRefuerzo', cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString() : '-' },
  ];

  useEffect(() => {
    loadVacunaciones();
  }, []);

  const loadVacunaciones = async () => {
    try {
      setLoading(true);
      const res = await getVacunaciones();
      setVacunaciones(res.data);
    } catch (error) {
      toast.error('Error al cargar vacunaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (vacunacion) => {
    navigate(`/vacunaciones/${vacunacion.id}`);
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Vacunaciones</h1>
        <button
          onClick={() => navigate('/vacunaciones/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nueva Vacunación
        </button>
      </div>
      <DataTable columns={columns} data={vacunaciones} onRowClick={handleRowClick} />
    </div>
  );
};

export default VacunacionesPage;