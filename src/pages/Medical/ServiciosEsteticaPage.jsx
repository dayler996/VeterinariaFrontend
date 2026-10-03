import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServiciosEstetica } from '../../services/esteticaService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const ServiciosEsteticaPage = () => {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Mascota', accessorKey: 'mascota.nombre' },
    { header: 'Dueño', accessorKey: 'mascota.dueno.nombre' },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Peluquero', accessorKey: 'trabajador.nombre' },
  ];

  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    try {
      setLoading(true);
      const res = await getServiciosEstetica();
      setServicios(res.data);
    } catch (error) {
      toast.error('Error al cargar servicios de estética');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (servicio) => {
    // Asegurarse de que el objeto tiene un campo 'id'
    if (servicio && servicio.id) {
      navigate(`/estetica/${servicio.id}`);
    } else {
      console.error('Servicio sin ID:', servicio);
      toast.error('Error al abrir el detalle');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Servicios de Estética</h1>
        <button
          onClick={() => navigate('/estetica/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nuevo Servicio
        </button>
      </div>

      <DataTable
        columns={columns}
        data={servicios}
        onRowClick={handleRowClick}
      />
    </div>
  );
};

export default ServiciosEsteticaPage;