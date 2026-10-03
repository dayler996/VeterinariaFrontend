import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacturas } from '../../services/facturaService';
import { getCliente } from '../../services/clienteService';
import { generateHistorialFacturasPDF } from '../../services/pdfService';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

const FacturasClientePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Filtros
  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [search, setSearch] = useState('');

  const estados = [
    { value: '', label: 'Todos' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'ABONADA', label: 'Abonada' },
    { value: 'PAGADA', label: 'Pagada' },
    { value: 'ANULADA', label: 'Anulada' },
  ];

  useEffect(() => {
    cargarCliente();
  }, [id]);

  useEffect(() => {
    cargarFacturas();
  }, [id, page, estado, fechaInicio, fechaFin, search]);

  const cargarCliente = async () => {
    try {
      const res = await getCliente(id);
      setCliente(res.data);
    } catch (error) {
      toast.error('Error al cargar cliente');
    }
  };

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const params = {
        clienteId: id,
        page,
        limit: 10,
        estado: estado || undefined,
        desde: fechaInicio || undefined,
        hasta: fechaFin || undefined,
        search: search || undefined,
      };
      const res = await getFacturas(params);
      // Adaptarse a diferentes formatos de respuesta
      if (res.data && Array.isArray(res.data.data)) {
        setFacturas(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      } else if (Array.isArray(res.data)) {
        setFacturas(res.data);
        setTotalPages(1);
        setTotal(res.data.length);
      } else {
        throw new Error('Formato de respuesta inesperado');
      }
    } catch (error) {
      console.error('Error cargando facturas:', error);
      toast.error('Error al cargar facturas');
      setFacturas([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setEstado('');
    setFechaInicio('');
    setFechaFin('');
    setSearch('');
    setPage(1);
  };

  const handleExportPDF = async () => {
    if (facturas.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const dataForPDF = facturas.map(f => [
      f.numero,
      new Date(f.fecha).toLocaleDateString(),
      formatCurrency(f.total),
      formatCurrency(f.montoPagado),
      formatCurrency(f.saldoPendiente),
      f.estadoPago,
    ]);

    const sections = [
      {
        title: `Facturas de ${cliente?.nombre || 'Cliente'}`,
        type: 'table',
        headers: ['Número', 'Fecha', 'Total', 'Pagado', 'Saldo', 'Estado'],
        data: dataForPDF,
      },
    ];

    await generateHistorialFacturasPDF(`Facturas de ${cliente?.nombre || 'Cliente'}`, sections);
  };

  const columns = [
    { header: 'Número', accessorKey: 'numero' },
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Pagado', accessorKey: 'montoPagado', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Saldo', accessorKey: 'saldoPendiente', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Estado', accessorKey: 'estadoPago' },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/facturacion/${row.original.id}`)}
          className="text-blue-600 hover:underline text-sm"
        >
          Ver detalle
        </button>
      ),
    },
  ];

  if (!cliente && loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">
        Facturas de {cliente?.nombre || 'Cliente'}
      </h1>

      <div className="bg-white p-3 sm:p-4 rounded shadow mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border rounded p-2 text-sm">
          {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="border rounded p-2 text-sm" />
        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="border rounded p-2 text-sm" />
        <input type="text" placeholder="Buscar por número..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded p-2 text-sm" />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
        <button onClick={handleLimpiarFiltros} className="bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-400 w-full sm:w-auto">
          Limpiar filtros
        </button>
        <button onClick={handleExportPDF} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 w-full sm:w-auto">
          Exportar PDF
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : facturas.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <DataTable columns={columns} data={facturas} />
          </div>
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <p className="text-center py-4 text-gray-500">No hay facturas para este cliente.</p>
      )}
    </div>
  );
};

export default FacturasClientePage;