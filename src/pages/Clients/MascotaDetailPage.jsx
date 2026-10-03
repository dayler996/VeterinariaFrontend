import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getMascota,
  getConsultasByMascota,
  getVacunacionesByMascota,
  getEstudiosByMascota,
  getOperacionesByMascota,
  getEsteticaByMascota,
  getHospitalizacionesByMascota,
  deleteMascota,
} from '../../services/mascotaService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

// Hook personalizado para manejar una sección paginada
const useSeccionPaginada = (fetchFunction, mascotaId, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const cargarPagina = async (pagina) => {
    setLoading(true);
    try {
      const res = await fetchFunction(mascotaId, pagina, pageSize);
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
      setPage(res.data.page);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mascotaId) {
      cargarPagina(page);
    }
  }, [mascotaId, page]);

  return { data, page, totalPages, total, loading, setPage, cargarPagina };
};

// Componente reutilizable para cada sección
const SeccionPaginada = ({
  titulo,
  data,
  columns,
  loading,
  page,
  totalPages,
  onPageChange,
  total,
  onNuevo,
  onRowClick,
}) => (
  <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
      <h2 className="text-lg sm:text-xl font-semibold">
        {titulo} {total > 0 && `(${total})`}
      </h2>
      <button
        onClick={onNuevo}
        className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm hover:bg-blue-700 w-full sm:w-auto mt-2 sm:mt-0"
      >
        Nuevo
      </button>
    </div>
    {loading ? (
      <div className="text-center py-4">Cargando...</div>
    ) : data.length > 0 ? (
      <>
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={data} onRowClick={onRowClick} />
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </>
    ) : (
      <p className="text-gray-500 text-center py-4 text-sm">No hay registros.</p>
    )}
  </div>
);

const MascotaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mascota, setMascota] = useState(null);
  const [loadingMascota, setLoadingMascota] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Estados paginados para cada sección
  const consultas = useSeccionPaginada(getConsultasByMascota, id);
  const vacunaciones = useSeccionPaginada(getVacunacionesByMascota, id);
  const estudios = useSeccionPaginada(getEstudiosByMascota, id);
  const operaciones = useSeccionPaginada(getOperacionesByMascota, id);
  const estetica = useSeccionPaginada(getEsteticaByMascota, id);
  const hospitalizaciones = useSeccionPaginada(getHospitalizacionesByMascota, id);

  useEffect(() => {
    loadMascota();
  }, [id]);

  const loadMascota = async () => {
    try {
      setLoadingMascota(true);
      const res = await getMascota(id);
      setMascota(res.data);
      setImageError(false);
    } catch (error) {
      toast.error('Error al cargar la mascota');
    } finally {
      setLoadingMascota(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta mascota?')) return;
    try {
      await deleteMascota(id);
      toast.success('Mascota eliminada');
      navigate(`/clientes/${mascota.dueno.id}`);
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Definición de columnas (igual que antes)
  const consultasColumns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Motivo', accessorKey: 'motivo' },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
  ];

  const vacunasColumns = [
    { header: 'Fecha', accessorKey: 'fechaAplicacion', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Vacuna', accessorKey: 'vacuna.nombre' },
    { header: 'Próximo refuerzo', accessorKey: 'proximoRefuerzo', cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString() : '-' },
    { header: 'Notif. 1', accessorKey: 'notificado_primero', cell: ({ getValue }) => getValue() ? 'Sí' : 'No' },
    { header: 'Notif. 2', accessorKey: 'notificado_segundo', cell: ({ getValue }) => getValue() ? 'Sí' : 'No' },
  ];

  const estudiosColumns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Doctor', accessorKey: 'doctor.nombre' },
  ];

  const operacionesColumns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Cirujano', accessorKey: 'cirujano.nombre' },
  ];

  const esteticaColumns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Tipo', accessorKey: 'tipo.nombre' },
    { header: 'Peluquero', accessorKey: 'trabajador.nombre' },
  ];

  const hospitalizacionesColumns = [
    { header: 'Ingreso', accessorKey: 'fechaIngreso', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Motivo', accessorKey: 'motivo' },
    { header: 'Alta', accessorKey: 'fechaAlta', cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString() : '-' },
  ];

  if (loadingMascota) return <div className="text-center">Cargando...</div>;
  if (!mascota) return <div>Mascota no encontrada</div>;

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      {/* Cabecera con botones */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Detalle de Mascota</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/mascotas/${id}/editar`)}
            className="bg-yellow-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm sm:text-base hover:bg-yellow-600"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm sm:text-base hover:bg-red-700"
          >
            Eliminar
          </button>
          <button
            onClick={() => navigate(`/citas/nueva?mascotaId=${id}`)}
            className="bg-green-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm sm:text-base hover:bg-green-700"
          >
            Nueva Cita
          </button>
          {/* Botón nuevo */}
        <button
          onClick={() => navigate(`/mascotas/${id}/historial`)}
          className="bg-purple-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm sm:text-base hover:bg-purple-700"
        >
          Historial Médico
        </button>
        </div>
      </div>

      {/* Foto de la mascota */}
      {mascota.foto && !imageError && (
        <div className="mb-4">
          <img
            src={getImageUrl(mascota.foto)}
            alt="Mascota"
            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Datos básicos */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Nombre</p>
            <p className="font-semibold">{mascota.nombre}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Especie</p>
            <p className="font-semibold">{mascota.especie?.nombre}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Raza</p>
            <p className="font-semibold">{mascota.raza?.nombre}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Sexo</p>
            <p className="font-semibold">{mascota.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Fecha Nacimiento</p>
            <p className="font-semibold">{new Date(mascota.fechaNacimiento).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Dueño</p>
            <Link to={`/clientes/${mascota.dueno?.id}`} className="text-blue-600 hover:underline text-sm sm:text-base">
              {mascota.dueno?.nombre}
            </Link>
          </div>
        </div>
      </div>

      {/* Sección Consultas */}
      <SeccionPaginada
        titulo="Consultas"
        data={consultas.data}
        columns={consultasColumns}
        loading={consultas.loading}
        page={consultas.page}
        totalPages={consultas.totalPages}
        onPageChange={consultas.setPage}
        total={consultas.total}
        onNuevo={() => navigate(`/consultas/nueva?mascotaId=${id}`)}
        onRowClick={(row) => navigate(`/consultas/${row.id}`)}
      />

      {/* Sección Vacunaciones */}
      <SeccionPaginada
        titulo="Vacunaciones"
        data={vacunaciones.data}
        columns={vacunasColumns}
        loading={vacunaciones.loading}
        page={vacunaciones.page}
        totalPages={vacunaciones.totalPages}
        onPageChange={vacunaciones.setPage}
        total={vacunaciones.total}
        onNuevo={() => navigate(`/vacunaciones/nueva?mascotaId=${id}`)}
        onRowClick={(row) => navigate(`/vacunaciones/${row.id}`)}
      />

      {/* Sección Estudios */}
      <SeccionPaginada
        titulo="Estudios / Exámenes"
        data={estudios.data}
        columns={estudiosColumns}
        loading={estudios.loading}
        page={estudios.page}
        totalPages={estudios.totalPages}
        onPageChange={estudios.setPage}
        total={estudios.total}
        onNuevo={() => navigate(`/estudios/nueva?mascotaId=${id}`)}
        onRowClick={(row) => navigate(`/estudios/${row.id}`)}
      />

      {/* Sección Operaciones */}
      <SeccionPaginada
        titulo="Operaciones"
        data={operaciones.data}
        columns={operacionesColumns}
        loading={operaciones.loading}
        page={operaciones.page}
        totalPages={operaciones.totalPages}
        onPageChange={operaciones.setPage}
        total={operaciones.total}
        onNuevo={() => navigate(`/operaciones/nueva?mascotaId=${id}`)}
        onRowClick={(row) => navigate(`/operaciones/${row.id}`)}
      />

      {/* Sección Servicios de Estética */}
      <SeccionPaginada
        titulo="Servicios de Estética"
        data={estetica.data}
        columns={esteticaColumns}
        loading={estetica.loading}
        page={estetica.page}
        totalPages={estetica.totalPages}
        onPageChange={estetica.setPage}
        total={estetica.total}
        onNuevo={() => navigate(`/estetica/nueva?mascotaId=${id}`)}
        onRowClick={(row) => navigate(`/estetica/${row.id}`)}
      />

      {/* Sección Hospitalizaciones */}
      <SeccionPaginada
        titulo="Hospitalizaciones"
        data={hospitalizaciones.data}
        columns={hospitalizacionesColumns}
        loading={hospitalizaciones.loading}
        page={hospitalizaciones.page}
        totalPages={hospitalizaciones.totalPages}
        onPageChange={hospitalizaciones.setPage}
        total={hospitalizaciones.total}
        onNuevo={() => navigate(`/hospitalizaciones/nueva?mascotaId=${id}`)}
        onRowClick={(row) => navigate(`/hospitalizaciones/${row.id}`)}
      />
    </div>
  );
};

export default MascotaDetailPage;