import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFacturas } from '../../services/facturaService';
import { getTrabajadores } from '../../services/trabajadorService';
import { DataTable } from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    search: '',
    estado: '',
    vendedorId: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const estados = [
    { value: '', label: 'Todos' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'ABONADA', label: 'Abonada' },
    { value: 'PAGADA', label: 'Pagada' },
    { value: 'ANULADA', label: 'Anulada' },
  ];

  const columns = [
    { header: 'Número', accessorKey: 'numero' },
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Cliente', accessorKey: 'cliente.nombre' },
    { header: 'Vendedor', accessorKey: 'vendedor.nombre' }, // Columna agregada
    { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => `$${getValue()}` },
    { header: 'Pagado', accessorKey: 'montoPagado', cell: ({ getValue }) => `$${getValue()}` },
    { header: 'Saldo', accessorKey: 'saldoPendiente', cell: ({ getValue }) => `$${getValue()}` },
    { header: 'Estado', accessorKey: 'estadoPago' },
  ];

  useEffect(() => {
    cargarVendedores();
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [filtros.estado, filtros.vendedorId, filtros.fechaInicio, filtros.fechaFin]); // Recargar cuando cambien filtros que requieren backend

  const cargarVendedores = async () => {
    try {
      const res = await getTrabajadores(); // Obtiene todos los trabajadores
      setVendedores(res.data);
    } catch (error) {
      toast.error('Error al cargar vendedores');
    }
  };

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.fechaInicio) params.desde = filtros.fechaInicio;
      if (filtros.fechaFin) params.hasta = filtros.fechaFin;
      // El backend no soporta filtro por vendedor ni búsqueda por texto, así que los haremos localmente
      const res = await getFacturas(params);
      let facturasData = res.data;

      // Filtro local por vendedor
      if (filtros.vendedorId) {
        facturasData = facturasData.filter(f => f.vendedor?.id === parseInt(filtros.vendedorId));
      }

      // Filtro local por búsqueda en número, cliente o vendedor
      if (filtros.search) {
        const busqueda = filtros.search.toLowerCase();
        facturasData = facturasData.filter(f =>
          f.numero.toLowerCase().includes(busqueda) ||
          (f.cliente?.nombre && f.cliente.nombre.toLowerCase().includes(busqueda)) ||
          (f.vendedor?.nombre && f.vendedor.nombre.toLowerCase().includes(busqueda))
        );
      }

      setFacturas(facturasData);
    } catch (error) {
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarFacturas(); // Aplicar filtros locales
  };

  const handleLimpiar = () => {
    setFiltros({
      search: '',
      estado: '',
      vendedorId: '',
      fechaInicio: '',
      fechaFin: '',
    });
    // Después de limpiar, se volverá a cargar con los filtros vacíos (efecto)
  };

  const handleRowClick = (factura) => {
    navigate(`/facturacion/${factura.id}`);
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Facturación</h1>
        <button
          onClick={() => navigate('/facturacion/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nueva Factura
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <form onSubmit={handleBuscar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda por texto */}
            <div>
              <label className="block text-sm font-medium">Buscar</label>
              <input
                type="text"
                name="search"
                value={filtros.search}
                onChange={handleFiltroChange}
                placeholder="Número, cliente o vendedor"
                className="mt-1 block w-full border rounded p-2"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium">Estado</label>
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleFiltroChange}
                className="mt-1 block w-full border rounded p-2"
              >
                {estados.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por vendedor */}
            <div>
              <label className="block text-sm font-medium">Vendedor</label>
              <select
                name="vendedorId"
                value={filtros.vendedorId}
                onChange={handleFiltroChange}
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="">Todos</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha inicio */}
            <div>
              <label className="block text-sm font-medium">Fecha desde</label>
              <input
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-sm font-medium">Fecha hasta</label>
              <input
                type="date"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleLimpiar}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Limpiar filtros
            </button>
          </div>
        </form>
      </div>

      <DataTable
        columns={columns}
        data={facturas}
        onRowClick={handleRowClick}
        showGlobalFilter={false}
      />
    </div>
  );
};

export default InvoicesPage;