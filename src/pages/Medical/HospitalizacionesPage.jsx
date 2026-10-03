import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHospitalizaciones } from '../../services/hospitalizacionService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const HospitalizacionesPage = () => {
  const navigate = useNavigate();
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { header: 'Ingreso', accessorKey: 'fechaIngreso', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Mascota', accessorKey: 'mascota.nombre' },
    { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
    { header: 'Motivo', accessorKey: 'motivo' },
    { header: 'Alta', accessorKey: 'fechaAlta', cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString() : '-' },
  ];

  useEffect(() => {
    loadHospitalizaciones();
  }, []);

  const loadHospitalizaciones = async () => {
    try {
      setLoading(true);
      const res = await getHospitalizaciones();
      setHospitalizaciones(res.data);
    } catch (error) {
      toast.error('Error al cargar hospitalizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (hospitalizacion) => {
    navigate(`/hospitalizaciones/${hospitalizacion.id}`);
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Hospitalizaciones</h1>
        <button
          onClick={() => navigate('/hospitalizaciones/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nueva Hospitalización
        </button>
      </div>

      <DataTable columns={columns} data={hospitalizaciones} onRowClick={handleRowClick} />
    </div>
  );
};

export default HospitalizacionesPage;