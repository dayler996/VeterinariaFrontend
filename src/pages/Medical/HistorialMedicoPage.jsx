import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistorialMedico } from '../../services/mascotaService';
import { generateHistorialMedicoPDF } from '../../services/pdfService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const tipoMap = {
  consulta: { label: 'Consulta', color: 'bg-blue-100 text-blue-800' },
  vacunacion: { label: 'Vacunación', color: 'bg-green-100 text-green-800' },
  estudio: { label: 'Estudio', color: 'bg-purple-100 text-purple-800' },
  operacion: { label: 'Operación', color: 'bg-orange-100 text-orange-800' },
  estetica: { label: 'Estética', color: 'bg-pink-100 text-pink-800' },
  hospitalizacion: { label: 'Hospitalización', color: 'bg-red-100 text-red-800' },
};

const HistorialMedicoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [mascotaNombre, setMascotaNombre] = useState('');

  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        tipo: filtroTipo || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        busqueda: busqueda || undefined,
      };
      const res = await getHistorialMedico(id, params);
      setEventos(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
      if (res.data.data.length > 0 && res.data.data[0].mascotaNombre) {
        setMascotaNombre(res.data.data[0].mascotaNombre);
      }
    } catch (error) {
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [id, page, filtroTipo, fechaInicio, fechaFin, busqueda]);

  const handleLimpiarFiltros = () => {
    setFiltroTipo('');
    setFechaInicio('');
    setFechaFin('');
    setBusqueda('');
    setPage(1);
  };

  const handleExportPDF = async () => {
    if (eventos.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const sections = [
      {
        title: 'Historial Médico',
        type: 'table',
        headers: ['Fecha', 'Tipo', 'Descripción', 'Profesional'],
        data: eventos.map(e => [
          new Date(e.fecha).toLocaleDateString(),
          tipoMap[e.tipo]?.label || e.tipo,
          e.descripcion,
          e.profesional || '-',
        ]),
      },
    ];

    const tituloPDF = mascotaNombre ? `Historial de ${mascotaNombre}` : 'Historial Médico';
    await generateHistorialMedicoPDF(tituloPDF, sections);
  };

  const columns = [
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ getValue }) => {
        const tipo = getValue();
        const estilo = tipoMap[tipo]?.color || 'bg-gray-100 text-gray-800';
        return <span className={`px-2 py-1 rounded text-xs font-medium ${estilo}`}>{tipoMap[tipo]?.label || tipo}</span>;
      },
    },
    { header: 'Descripción', accessorKey: 'descripcion' },
    {
      header: 'Profesional',
      accessorKey: 'profesional',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      header: 'Detalle',
      accessorKey: 'detalle',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/${row.original.tipo}s/${row.original.id}`)}
          className="text-blue-600 hover:underline text-sm"
        >
          Ver detalle
        </button>
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">
        {mascotaNombre ? `Historial de ${mascotaNombre}` : 'Historial Médico'}
      </h1>

      {/* Filtros responsivos */}
      <div className="bg-white p-3 sm:p-4 rounded shadow mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          <option value="consulta">Consultas</option>
          <option value="vacunacion">Vacunaciones</option>
          <option value="estudio">Estudios</option>
          <option value="operacion">Operaciones</option>
          <option value="estetica">Estética</option>
          <option value="hospitalizacion">Hospitalizaciones</option>
        </select>

        <input
          type="date"
          placeholder="Fecha inicio"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="border rounded p-2 text-sm"
        />
        <input
          type="date"
          placeholder="Fecha fin"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="border rounded p-2 text-sm"
        />
        <input
          type="text"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border rounded p-2 text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
        <button
          onClick={handleLimpiarFiltros}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-400 w-full sm:w-auto"
        >
          Limpiar filtros
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 w-full sm:w-auto"
        >
          Exportar PDF
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : eventos.length > 0 ? (
        <>
          {/* Contenedor con scroll horizontal y ancho mínimo forzado */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: '800px' }}>
              <DataTable columns={columns} data={eventos} />
            </div>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      ) : (
        <p className="text-center py-4 text-gray-500">No hay registros en el historial.</p>
      )}
    </div>
  );
};

export default HistorialMedicoPage;