import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstudios } from '../../services/estudioService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const EstudiosPage = () => {
  const navigate = useNavigate();
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Mascota', accessorKey: 'mascota.nombre' },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
  ];

  useEffect(() => {
    loadEstudios();
  }, []);

  const loadEstudios = async () => {
    try {
      setLoading(true);
      const res = await getEstudios();
      setEstudios(res.data);
    } catch (error) {
      toast.error('Error al cargar estudios');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (estudio) => {
    navigate(`/estudios/${estudio.id}`);
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Estudios</h1>
        <button
          onClick={() => navigate('/estudios/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nuevo Estudio
        </button>
      </div>
      <DataTable columns={columns} data={estudios} onRowClick={handleRowClick} />
    </div>
  );
};

export default EstudiosPage;