import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { METODOS_PAGO } from '../../constants/metodosPago';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ═══════════════════════════════════════════════════
   FILTROS AVANZADOS — Colapsable y responsive
   ═══════════════════════════════════════════════════ */
const FiltrosAvanzados = ({
  onFilterChange,
  vendedores,
  productos,
  metodosPago,
  tiposProducto,
  tipoProductoSeleccionado,
  setTipoProductoSeleccionado,
  productoId,
  setProductoId,
  tipoServicio,
  setTipoServicio,
  categorias,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  servicios,
  servicioSeleccionado,
  setServicioSeleccionado,
  busquedaTexto,
  setBusquedaTexto,
}) => {
  const [vendedorId, setVendedorId] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [abierto, setAbierto] = useState(false);

  const hayFiltrosActivos =
    vendedorId || productoId || metodoPago || busquedaTexto ||
    tipoServicio || categoriaSeleccionada || servicioSeleccionado ||
    tipoProductoSeleccionado;

  const aplicarFiltros = () => {
    onFilterChange({
      vendedorId,
      productoId,
      metodoPago,
      busquedaTexto,
      tipoServicio,
      categoriaId: categoriaSeleccionada,
      servicioId: servicioSeleccionado,
    });
    setAbierto(false);
  };

  const limpiarFiltros = () => {
    setVendedorId('');
    setProductoId('');
    setMetodoPago('');
    setBusquedaTexto('');
    setTipoServicio('');
    setCategoriaSeleccionada('');
    setServicioSeleccionado('');
    setTipoProductoSeleccionado('');
    onFilterChange({
      vendedorId: '',
      productoId: '',
      metodoPago: '',
      busquedaTexto: '',
      tipoServicio: '',
      categoriaId: '',
      servicioId: '',
    });
  };

  const productoOptions = useMemo(() => {
    let productosFiltrados = productos;
    if (tipoProductoSeleccionado) {
      productosFiltrados = productos.filter(
        p => p.tipoProductoId === parseInt(tipoProductoSeleccionado)
      );
    }
    return productosFiltrados.map(p => ({ value: p.id, label: p.nombre }));
  }, [productos, tipoProductoSeleccionado]);

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '38px',
      fontSize: '13px',
      borderColor: '#d1d5db',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, fontSize: '13px' }),
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
      {/* Cabecera: toggle */}
      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium text-sm text-gray-700">Filtros avanzados</span>
          {hayFiltrosActivos && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
              Activos
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${abierto ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel colapsable */}
      {abierto && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Vendedor */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Vendedor
              </label>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>

            {/* Tipo de producto */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Tipo de producto
              </label>
              <select
                value={tipoProductoSeleccionado}
                onChange={(e) => setTipoProductoSeleccionado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {tiposProducto.map(tp => (
                  <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                ))}
              </select>
            </div>

            {/* Producto */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Producto específico
              </label>
              <Select
                options={productoOptions}
                value={productoOptions.find(opt => opt.value === productoId) || null}
                onChange={(selected) => setProductoId(selected ? selected.value : '')}
                isClearable
                placeholder="Buscar producto..."
                noOptionsMessage={() => 'Sin resultados'}
                menuPortalTarget={document.body}
                styles={selectStyles}
                maxMenuHeight={220}
              />
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {metodosPago.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Tipo de servicio */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Tipo de servicio
              </label>
              <select
                value={tipoServicio}
                onChange={(e) => setTipoServicio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="estudio">Estudios</option>
                <option value="operacion">Operaciones</option>
                <option value="estetica">Estética</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Categoría
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                disabled={!tipoServicio}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Todas</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Servicio */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Servicio específico
              </label>
              <select
                value={servicioSeleccionado}
                onChange={(e) => setServicioSeleccionado(e.target.value)}
                disabled={!categoriaSeleccionada}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Todos</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Búsqueda */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Búsqueda general
              </label>
              <input
                type="text"
                placeholder="Buscar en número, cliente, cédula o descripción..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={aplicarFiltros}
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Aplicar filtros
            </button>
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium
                           hover:bg-gray-200 transition w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ═══════════════════════════════════════════════════ */
const IncomeReportPage = () => {
  const navigate = useNavigate();
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mensual');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  /* Filtros */
  const [vendedorId, setVendedorId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [tipoProductoSeleccionado, setTipoProductoSeleccionado] = useState('');

  /* Paginación */
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  /* Opciones */
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const metodosPago = METODOS_PAGO.map(m => m.value);

  /* Facturas */
  const [facturasList, setFacturasList] = useState([]);
  const [paginacionFacturas, setPaginacionFacturas] = useState({
    page: 1, pageSize: 10, total: 0, totalPages: 1,
  });

  /* Tabs */
  const [activeTab, setActiveTab] = useState('resumen');

  /* ── Cargas ── */
  useEffect(() => { cargarOpciones(); }, []);

  useEffect(() => {
    if (tipoServicio) cargarCategorias(tipoServicio);
    else {
      setCategorias([]);
      setCategoriaSeleccionada('');
      setServicios([]);
      setServicioSeleccionado('');
    }
  }, [tipoServicio]);

  useEffect(() => {
    if (tipoServicio && categoriaSeleccionada) cargarServicios(tipoServicio, categoriaSeleccionada);
    else {
      setServicios([]);
      setServicioSeleccionado('');
    }
  }, [tipoServicio, categoriaSeleccionada]);

  useEffect(() => {
    cargarReporte();
  }, [periodo, page, vendedorId, productoId, metodoPago, busquedaTexto, tipoServicio, categoriaSeleccionada, servicioSeleccionado]);

  const cargarOpciones = async () => {
    try {
      const [vRes, pRes, tpRes] = await Promise.all([
        api.get('/trabajadores?incluirInactivos=false'),
        api.get('/productos'),
        api.get('/tipos-producto').catch(() => ({ data: [] })),
      ]);
      setVendedores(vRes.data);
      setProductos(pRes.data);
      setTiposProducto(tpRes.data || []);
    } catch (error) {
      toast.error('Error al cargar opciones');
    }
  };

  const cargarCategorias = async (tipo) => {
    try {
      const res = await api.get(`/categorias?tipo=${tipo}`);
      setCategorias(res.data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    }
  };

  const cargarServicios = async (tipo, catId) => {
    try {
      let endpoint = '';
      if (tipo === 'estudio') endpoint = '/tipos-estudio';
      else if (tipo === 'operacion') endpoint = '/tipos-operacion';
      else if (tipo === 'estetica') endpoint = '/tipos-estetica';
      else return;
      const res = await api.get(endpoint);
      const filtrados = res.data.filter(s => s.categoriaId === parseInt(catId));
      setServicios(filtrados);
    } catch (error) {
      toast.error('Error al cargar servicios');
    }
  };

  const cargarReporte = async () => {
    setLoading(true);
    try {
      const params = {
        periodo,
        page,
        pageSize,
        vendedorId: vendedorId || undefined,
        productoId: productoId || undefined,
        metodoPago: metodoPago || undefined,
        busqueda: busquedaTexto || undefined,
        tipoServicio: tipoServicio || undefined,
        categoriaId: categoriaSeleccionada || undefined,
        servicioId: servicioSeleccionado || undefined,
      };
      if (fechaInicio && fechaFin) {
        params.fechaInicio = fechaInicio;
        params.fechaFin = fechaFin;
      }
      const res = await api.get('/reportes/ingresos', { params });
      setReporte(res.data);
      setFacturasList(res.data.facturas || []);
      setPaginacionFacturas(res.data.paginacionFacturas || { page: 1, pageSize: 10, total: 0, totalPages: 1 });
    } catch (error) {
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterRange = () => {
    if (fechaInicio && fechaFin) {
      setPage(1);
      cargarReporte();
    } else {
      toast.error('Seleccione ambas fechas');
    }
  };

  const handleFiltrosAvanzados = (filtros) => {
    setVendedorId(filtros.vendedorId);
    setProductoId(filtros.productoId);
    setMetodoPago(filtros.metodoPago);
    setBusquedaTexto(filtros.busquedaTexto);
    setTipoServicio(filtros.tipoServicio || '');
    setCategoriaSeleccionada(filtros.categoriaId || '');
    setServicioSeleccionado(filtros.servicioId || '');
    setPage(1);
  };

  /* ═══════════════════════════════════════════
     EXPORTACIÓN — idénticas a tu código original
     ═══════════════════════════════════════════ */
  const exportToExcel = async () => {
    if (!reporte) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Veterinaria DOGVET';
    workbook.lastModifiedBy = 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();

    const fechaGeneracion = new Date().toLocaleString();

    const wsResumen = workbook.addWorksheet('Resumen');
    wsResumen.columns = [
      { header: 'Concepto', key: 'concepto', width: 35 },
      { header: 'Valor', key: 'valor', width: 30 },
    ];

    wsResumen.addRow(['REPORTE DE INGRESOS - VETERINARIA DOGVET', '']);
    wsResumen.mergeCells('A1:B1');
    wsResumen.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1F4E79' } };
    wsResumen.getCell('A1').alignment = { horizontal: 'center' };

    wsResumen.addRow(['Generado el:', fechaGeneracion]);
    wsResumen.addRow([]);
    wsResumen.addRow(['Período:', periodo === 'total' ? 'Todo' : periodo]);
    wsResumen.addRow(['Rango de fechas:', fechaInicio && fechaFin ? `${fechaInicio} a ${fechaFin}` : 'Sin filtro de fecha']);
    wsResumen.addRow([]);
    wsResumen.addRow(['RESUMEN GENERAL', '']);
    wsResumen.mergeCells(`A${wsResumen.lastRow.number}:B${wsResumen.lastRow.number}`);
    wsResumen.getCell(`A${wsResumen.lastRow.number}`).font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } };

    wsResumen.addRow(['Total Ingresos (pagado)', formatCurrency(reporte.totalIngresos)]);
    wsResumen.addRow(['Total Vendido', formatCurrency(reporte.totalVendido)]);
    wsResumen.addRow(['Total Pendiente', formatCurrency(reporte.totalPendiente)]);
    wsResumen.addRow(['Ticket Promedio', formatCurrency(reporte.ticketPromedio)]);
    wsResumen.addRow(['Cantidad Facturas', reporte.totalFacturasGlobal || reporte.totalFacturas]);
    wsResumen.addRow([]);
    wsResumen.addRow(['FILTROS AVANZADOS', '']);
    wsResumen.mergeCells(`A${wsResumen.lastRow.number}:B${wsResumen.lastRow.number}`);
    wsResumen.getCell(`A${wsResumen.lastRow.number}`).font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } };

    wsResumen.addRow([`Vendedor: ${vendedores.find(v => v.id === parseInt(vendedorId))?.nombre || 'Todos'}`, '']);
    wsResumen.addRow([`Producto: ${productos.find(p => p.id === parseInt(productoId))?.nombre || 'Todos'}`, '']);
    wsResumen.addRow([`Método de pago: ${metodoPago || 'Todos'}`, '']);
    wsResumen.addRow([`Tipo servicio: ${tipoServicio || 'Todos'}`, '']);
    wsResumen.addRow([`Categoría: ${categorias.find(c => c.id === parseInt(categoriaSeleccionada))?.nombre || 'Todas'}`, '']);
    wsResumen.addRow([`Servicio específico: ${servicios.find(s => s.id === parseInt(servicioSeleccionado))?.nombre || 'Todos'}`, '']);
    wsResumen.addRow([`Búsqueda: ${busquedaTexto || 'Ninguna'}`, '']);

    wsResumen.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    if (facturasList.length > 0) {
      const wsFacturas = workbook.addWorksheet('Facturas');
      wsFacturas.columns = [
        { header: 'Número', key: 'numero', width: 15 },
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Total (USD)', key: 'total', width: 12 },
        { header: 'Pagado (USD)', key: 'montoPagado', width: 12 },
        { header: 'Saldo (USD)', key: 'saldoPendiente', width: 12 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Vendedor', key: 'vendedor', width: 20 },
      ];

      wsFacturas.addRows(facturasList.map(f => ({
        numero: f.numero,
        fecha: new Date(f.fecha).toLocaleDateString(),
        cliente: f.cliente,
        cedula: f.cedula,
        total: f.total,
        montoPagado: f.montoPagado,
        saldoPendiente: f.saldoPendiente,
        estado: f.estadoPago,
        vendedor: f.vendedor,
      })));

      wsFacturas.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      ['total', 'montoPagado', 'saldoPendiente'].forEach(col => {
        wsFacturas.getColumn(col).numFmt = '"$"#,##0.00';
      });

      wsFacturas.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
        }
      });
    }

    if (reporte.estadisticasFacturas) {
      const est = reporte.estadisticasFacturas;
      const wsStats = workbook.addWorksheet('Estadísticas');
      wsStats.columns = [
        { header: 'Concepto', key: 'concepto', width: 35 },
        { header: 'Valor', key: 'valor', width: 20 },
      ];
      wsStats.addRows([
        ['Facturas por estado:', ''],
        ['Pendientes', est.pendientes],
        ['Abonadas', est.abonadas],
        ['Pagadas', est.pagadas],
        ['Anuladas', est.anuladas],
        ['Total facturas válidas (no anuladas)', est.totalValidas],
        ['Monto anulado', est.montoAnulado],
        ['Días en el rango', est.dias],
        ['Promedio diario de ventas', est.promedioDiario],
      ]);
      wsStats.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
      });
      wsStats.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });
      wsStats.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const conceptoCell = row.getCell(1);
          const valorCell = row.getCell(2);
          if (['Monto anulado', 'Promedio diario de ventas'].includes(conceptoCell.value)) {
            valorCell.numFmt = '"$"#,##0.00';
          } else {
            valorCell.numFmt = '#,##0';
          }
        }
      });
    }

    if (reporte.porVendedor.length > 0) {
      const wsVendedor = workbook.addWorksheet('Ventas x Vendedor');
      wsVendedor.columns = [
        { header: 'Vendedor', key: 'nombre', width: 25 },
        { header: 'Ventas (USD)', key: 'ventas', width: 15 },
        { header: 'Cantidad Facturas', key: 'cantidad', width: 15 },
        { header: '% del total', key: 'porcentaje', width: 12 },
      ];
      const totalVentas = reporte.totalVendido;
      wsVendedor.addRows(reporte.porVendedor.map(v => ({
        nombre: v.nombre,
        ventas: v.ventas,
        cantidad: v.cantidadFacturas,
        porcentaje: totalVentas > 0 ? ((v.ventas / totalVentas) * 100).toFixed(2) + '%' : '0%',
      })));
      wsVendedor.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      wsVendedor.eachRow((row, rowNumber) => {
        if (rowNumber > 1) row.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      });
      wsVendedor.getColumn('ventas').numFmt = '"$"#,##0.00';
    }

    if (reporte.porProducto.length > 0) {
      const wsProducto = workbook.addWorksheet('Productos');
      wsProducto.columns = [
        { header: '#', key: 'rank', width: 5 },
        { header: 'Producto', key: 'nombre', width: 35 },
        { header: 'Cantidad', key: 'cantidad', width: 12 },
        { header: 'Total Vendido (USD)', key: 'total', width: 15 },
        { header: '% del total', key: 'porcentaje', width: 12 },
      ];
      const productosOrdenados = [...reporte.porProducto].sort((a, b) => b.totalVendido - a.totalVendido);
      const totalProductos = productosOrdenados.reduce((sum, p) => sum + p.totalVendido, 0);
      wsProducto.addRows(productosOrdenados.map((p, idx) => ({
        rank: idx + 1,
        nombre: p.nombre,
        cantidad: p.cantidad,
        total: p.totalVendido,
        porcentaje: totalProductos > 0 ? ((p.totalVendido / totalProductos) * 100).toFixed(2) + '%' : '0%',
      })));
      wsProducto.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      wsProducto.eachRow((row, rowNumber) => {
        if (rowNumber > 1) row.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      });
      wsProducto.getColumn('total').numFmt = '"$"#,##0.00';
    }

    if (reporte.porMetodoPago.length > 0) {
      const wsMetodo = workbook.addWorksheet('Métodos de Pago');
      wsMetodo.columns = [
        { header: 'Método', key: 'metodo', width: 20 },
        { header: 'Monto Total (USD)', key: 'monto', width: 15 },
        { header: 'Cantidad Pagos', key: 'cantidad', width: 15 },
        { header: '% del total', key: 'porcentaje', width: 12 },
      ];
      const totalPagado = reporte.totalPagado;
      wsMetodo.addRows(reporte.porMetodoPago.map(m => ({
        metodo: m.metodo,
        monto: m.montoTotal,
        cantidad: m.cantidadPagos,
        porcentaje: totalPagado > 0 ? ((m.montoTotal / totalPagado) * 100).toFixed(2) + '%' : '0%',
      })));
      wsMetodo.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      wsMetodo.eachRow((row, rowNumber) => {
        if (rowNumber > 1) row.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      });
      wsMetodo.getColumn('monto').numFmt = '"$"#,##0.00';
    }

    if (reporte.porTipoServicio) {
      const wsTipo = workbook.addWorksheet('Servicios x Tipo');
      wsTipo.columns = [
        { header: 'Tipo de Servicio', key: 'tipo', width: 20 },
        { header: 'Monto (USD)', key: 'monto', width: 15 },
        { header: '% del total', key: 'porcentaje', width: 12 },
      ];
      const totalServicios =
        (reporte.porTipoServicio.ESTUDIO || 0) +
        (reporte.porTipoServicio.OPERACION || 0) +
        (reporte.porTipoServicio.ESTETICA || 0) +
        (reporte.porTipoServicio.OTROS || 0);
      wsTipo.addRows([
        { tipo: 'Estudios', monto: reporte.porTipoServicio.ESTUDIO || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.ESTUDIO / totalServicios) * 100).toFixed(2) + '%' : '0%' },
        { tipo: 'Operaciones', monto: reporte.porTipoServicio.OPERACION || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.OPERACION / totalServicios) * 100).toFixed(2) + '%' : '0%' },
        { tipo: 'Estética', monto: reporte.porTipoServicio.ESTETICA || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.ESTETICA / totalServicios) * 100).toFixed(2) + '%' : '0%' },
        { tipo: 'Otros', monto: reporte.porTipoServicio.OTROS || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.OTROS / totalServicios) * 100).toFixed(2) + '%' : '0%' },
      ]);
      wsTipo.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      wsTipo.eachRow((row, rowNumber) => {
        if (rowNumber > 1) row.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      });
      wsTipo.getColumn('monto').numFmt = '"$"#,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `reporte_ingresos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!reporte) return;

    const doc = new jsPDF();
    let yOffset = 20;

    doc.setFontSize(18);
    doc.setTextColor(31, 78, 121);
    doc.text('REPORTE DE INGRESOS - VETERINARIA DOGVET', 14, yOffset);
    yOffset += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, yOffset);
    yOffset += 10;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Filtros aplicados:', 14, yOffset);
    yOffset += 7;
    doc.setFontSize(10);
    const filtros = [
      `Período: ${periodo === 'total' ? 'Todo' : periodo}`,
      `Rango: ${fechaInicio && fechaFin ? `${fechaInicio} a ${fechaFin}` : 'Sin filtro de fecha'}`,
      `Vendedor: ${vendedores.find(v => v.id === parseInt(vendedorId))?.nombre || 'Todos'}`,
      `Producto: ${productos.find(p => p.id === parseInt(productoId))?.nombre || 'Todos'}`,
      `Método de pago: ${metodoPago || 'Todos'}`,
      `Tipo servicio: ${tipoServicio || 'Todos'}`,
      `Categoría: ${categorias.find(c => c.id === parseInt(categoriaSeleccionada))?.nombre || 'Todas'}`,
      `Servicio específico: ${servicios.find(s => s.id === parseInt(servicioSeleccionado))?.nombre || 'Todos'}`,
      `Búsqueda: ${busquedaTexto || 'Ninguna'}`,
    ];
    filtros.forEach(f => {
      doc.text(f, 14, yOffset);
      yOffset += 5;
    });
    yOffset += 5;

    if (yOffset > 250) { doc.addPage(); yOffset = 20; }
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 121);
    doc.text('Resumen General', 14, yOffset);
    yOffset += 7;
    doc.setFontSize(11);
    doc.setTextColor(0);
    const resumen = [
      ['Total Ingresos (pagado)', formatCurrency(reporte.totalIngresos)],
      ['Total Vendido', formatCurrency(reporte.totalVendido)],
      ['Total Pendiente', formatCurrency(reporte.totalPendiente)],
      ['Ticket Promedio', formatCurrency(reporte.ticketPromedio)],
      ['Cantidad Facturas', reporte.totalFacturasGlobal || reporte.totalFacturas],
    ];
    autoTable(doc, {
      startY: yOffset,
      head: [['Concepto', 'Valor']],
      body: resumen,
      theme: 'striped',
      headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 } },
    });
    yOffset = doc.lastAutoTable.finalY + 10;

    if (facturasList.length > 0) {
      if (yOffset > 250) { doc.addPage(); yOffset = 20; }
      doc.setFontSize(14);
      doc.setTextColor(31, 78, 121);
      doc.text('Facturas', 14, yOffset);
      yOffset += 7;
      const facturasBody = facturasList.map(f => [
        f.numero, new Date(f.fecha).toLocaleDateString(), f.cliente, f.cedula,
        formatCurrency(f.total), formatCurrency(f.montoPagado || 0),
        formatCurrency(f.saldoPendiente || 0), f.estadoPago, f.vendedor,
      ]);
      autoTable(doc, {
        startY: yOffset,
        head: [['Número', 'Fecha', 'Cliente', 'Cédula', 'Total', 'Pagado', 'Saldo', 'Estado', 'Vendedor']],
        body: facturasBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 }, 1: { cellWidth: 20 }, 2: { cellWidth: 30 }, 3: { cellWidth: 20 },
          4: { cellWidth: 18 }, 5: { cellWidth: 18 }, 6: { cellWidth: 18 }, 7: { cellWidth: 18 }, 8: { cellWidth: 25 },
        },
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    if (reporte.estadisticasFacturas) {
      const est = reporte.estadisticasFacturas;
      if (yOffset > 250) { doc.addPage(); yOffset = 20; }
      doc.setFontSize(14);
      doc.setTextColor(31, 78, 121);
      doc.text('Estadísticas de Facturas', 14, yOffset);
      yOffset += 7;
      const statsBody = [
        ['Facturas por estado:', ''],
        ['Pendientes', est.pendientes],
        ['Abonadas', est.abonadas],
        ['Pagadas', est.pagadas],
        ['Anuladas', est.anuladas],
        ['Total válidas (no anuladas)', est.totalValidas],
        ['Monto anulado', formatCurrency(est.montoAnulado)],
        ['Días en el rango', est.dias],
        ['Promedio diario', formatCurrency(est.promedioDiario)],
      ];
      autoTable(doc, {
        startY: yOffset, body: statsBody, theme: 'striped',
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 } },
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    if (reporte.porVendedor.length > 0) {
      if (yOffset > 250) { doc.addPage(); yOffset = 20; }
      doc.setFontSize(14);
      doc.setTextColor(31, 78, 121);
      doc.text('Ventas por Vendedor', 14, yOffset);
      yOffset += 7;
      const totalVentas = reporte.totalVendido;
      const vendedorBody = reporte.porVendedor.map(v => [
        v.nombre, formatCurrency(v.ventas), v.cantidadFacturas,
        totalVentas > 0 ? ((v.ventas / totalVentas) * 100).toFixed(2) + '%' : '0%',
      ]);
      autoTable(doc, {
        startY: yOffset,
        head: [['Vendedor', 'Ventas (USD)', 'Facturas', '%']],
        body: vendedorBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 } },
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    if (reporte.porProducto.length > 0) {
      if (yOffset > 250) { doc.addPage(); yOffset = 20; }
      doc.setFontSize(14);
      doc.setTextColor(31, 78, 121);
      doc.text('Productos Vendidos', 14, yOffset);
      yOffset += 7;
      const productosOrdenados = [...reporte.porProducto].sort((a, b) => b.totalVendido - a.totalVendido);
      const totalProductos = productosOrdenados.reduce((sum, p) => sum + p.totalVendido, 0);
      const productoBody = productosOrdenados.map((p, idx) => [
        idx + 1, p.nombre, p.cantidad, formatCurrency(p.totalVendido),
        totalProductos > 0 ? ((p.totalVendido / totalProductos) * 100).toFixed(2) + '%' : '0%',
      ]);
      autoTable(doc, {
        startY: yOffset,
        head: [['#', 'Producto', 'Cantidad', 'Total (USD)', '%']],
        body: productoBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 70 }, 2: { cellWidth: 15 }, 3: { cellWidth: 20 }, 4: { cellWidth: 15 } },
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    if (reporte.porMetodoPago.length > 0) {
      if (yOffset > 250) { doc.addPage(); yOffset = 20; }
      doc.setFontSize(14);
      doc.setTextColor(31, 78, 121);
      doc.text('Métodos de Pago', 14, yOffset);
      yOffset += 7;
      const totalPagado = reporte.totalPagado;
      const metodoBody = reporte.porMetodoPago.map(m => [
        m.metodo, formatCurrency(m.montoTotal), m.cantidadPagos,
        totalPagado > 0 ? ((m.montoTotal / totalPagado) * 100).toFixed(2) + '%' : '0%',
      ]);
      autoTable(doc, {
        startY: yOffset,
        head: [['Método', 'Monto (USD)', 'Pagos', '%']],
        body: metodoBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15 } },
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    if (reporte.porTipoServicio) {
      if (yOffset > 250) { doc.addPage(); yOffset = 20; }
      doc.setFontSize(14);
      doc.setTextColor(31, 78, 121);
      doc.text('Servicios por Tipo', 14, yOffset);
      yOffset += 7;
      const totalServicios =
        (reporte.porTipoServicio.ESTUDIO || 0) + (reporte.porTipoServicio.OPERACION || 0) +
        (reporte.porTipoServicio.ESTETICA || 0) + (reporte.porTipoServicio.OTROS || 0);
      const tipoBody = [
        ['Estudios', formatCurrency(reporte.porTipoServicio.ESTUDIO || 0), totalServicios > 0 ? ((reporte.porTipoServicio.ESTUDIO / totalServicios) * 100).toFixed(2) + '%' : '0%'],
        ['Operaciones', formatCurrency(reporte.porTipoServicio.OPERACION || 0), totalServicios > 0 ? ((reporte.porTipoServicio.OPERACION / totalServicios) * 100).toFixed(2) + '%' : '0%'],
        ['Estética', formatCurrency(reporte.porTipoServicio.ESTETICA || 0), totalServicios > 0 ? ((reporte.porTipoServicio.ESTETICA / totalServicios) * 100).toFixed(2) + '%' : '0%'],
        ['Otros', formatCurrency(reporte.porTipoServicio.OTROS || 0), totalServicios > 0 ? ((reporte.porTipoServicio.OTROS / totalServicios) * 100).toFixed(2) + '%' : '0%'],
      ];
      autoTable(doc, {
        startY: yOffset,
        head: [['Tipo', 'Monto (USD)', '%']],
        body: tipoBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 } },
      });
    }

    doc.save(`reporte_ingresos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  /* ── Columnas ── */
  const vendedorColumns = [
    { header: 'Vendedor', accessorKey: 'nombre' },
    { header: 'Ventas ($)', accessorKey: 'ventas', cell: ({ getValue }) => <span className="block text-right tabular-nums font-medium">{formatCurrency(getValue())}</span> },
    { header: 'Facturas', accessorKey: 'cantidadFacturas', cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue()}</span> },
  ];

  const productoColumns = [
    { header: 'Producto', accessorKey: 'nombre' },
    { header: 'Cantidad', accessorKey: 'cantidad', cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue()}</span> },
    { header: 'Total ($)', accessorKey: 'totalVendido', cell: ({ getValue }) => <span className="block text-right tabular-nums font-medium">{formatCurrency(getValue())}</span> },
  ];

  const metodoColumns = [
    { header: 'Método', accessorKey: 'metodo' },
    { header: 'Monto ($)', accessorKey: 'montoTotal', cell: ({ getValue }) => <span className="block text-right tabular-nums font-medium">{formatCurrency(getValue())}</span> },
    { header: 'Pagos', accessorKey: 'cantidadPagos', cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue()}</span> },
  ];

  const facturaColumns = [
    { header: 'Número', accessorKey: 'numero' },
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
    { header: 'Cliente', accessorKey: 'cliente' },
    { header: 'Cédula', accessorKey: 'cedula' },
    { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => <span className="block text-right tabular-nums">{formatCurrency(getValue())}</span> },
    { header: 'Pagado', accessorKey: 'montoPagado', cell: ({ getValue }) => <span className="block text-right tabular-nums text-green-700">{formatCurrency(getValue())}</span> },
    { header: 'Saldo', accessorKey: 'saldoPendiente', cell: ({ getValue }) => <span className="block text-right tabular-nums text-red-600">{formatCurrency(getValue())}</span> },
    { header: 'Estado', accessorKey: 'estadoPago' },
    { header: 'Vendedor', accessorKey: 'vendedor' },
  ];

  /* ── Tabs config ── */
  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: '📊' },
    { id: 'facturas', label: 'Facturas', icon: '🧾', count: facturasList.length },
    { id: 'vendedores', label: 'Vendedores', icon: '👥', count: reporte?.porVendedor?.length },
    { id: 'productos', label: 'Productos', icon: '📦', count: reporte?.porProducto?.length },
    { id: 'metodos', label: 'Pagos', icon: '💳', count: reporte?.porMetodoPago?.length },
  ];

  /* ── Loading ── */
  if (loading && !reporte) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="animate-spin w-8 h-8 mx-auto text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 mt-3">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Reporte de Ingresos</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {periodo === 'total' ? 'Histórico completo' : `Período ${periodo}`}
            {fechaInicio && fechaFin && ` · ${fechaInicio} a ${fechaFin}`}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                       hover:bg-green-700 transition flex-1 sm:flex-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m3 6v-4m3 4v-2M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                       hover:bg-red-700 transition flex-1 sm:flex-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* ═══ Filtros de fecha/periodo ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Período
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="total">Todo</option>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilterRange}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Aplicar rango
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Filtros avanzados ═══ */}
      <FiltrosAvanzados
        onFilterChange={handleFiltrosAvanzados}
        vendedores={vendedores}
        productos={productos}
        metodosPago={metodosPago}
        tiposProducto={tiposProducto}
        tipoProductoSeleccionado={tipoProductoSeleccionado}
        setTipoProductoSeleccionado={setTipoProductoSeleccionado}
        productoId={productoId}
        setProductoId={setProductoId}
        tipoServicio={tipoServicio}
        setTipoServicio={setTipoServicio}
        categorias={categorias}
        categoriaSeleccionada={categoriaSeleccionada}
        setCategoriaSeleccionada={setCategoriaSeleccionada}
        servicios={servicios}
        servicioSeleccionado={servicioSeleccionado}
        setServicioSeleccionado={setServicioSeleccionado}
        busquedaTexto={busquedaTexto}
        setBusquedaTexto={setBusquedaTexto}
      />

      {/* ═══ Cards de resumen ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <StatCard
          label="Total Cobrado"
          value={formatCurrency(reporte.totalIngresos)}
          color="text-green-700"
          bg="bg-green-50"
          border="border-green-100"
          icon="💰"
        />
        <StatCard
          label="Total Vendido"
          value={formatCurrency(reporte.totalVendido)}
          color="text-blue-700"
          bg="bg-blue-50"
          border="border-blue-100"
          icon="📈"
        />
        <StatCard
          label="Por Cobrar"
          value={formatCurrency(reporte.totalPendiente)}
          color="text-red-600"
          bg="bg-red-50"
          border="border-red-100"
          icon="⏳"
        />
        <StatCard
          label="Ticket Promedio"
          value={formatCurrency(reporte.ticketPromedio)}
          color="text-gray-800"
          bg="bg-gray-50"
          border="border-gray-100"
          icon="🎯"
        />
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 overflow-x-auto">
          <nav className="flex gap-1 px-2 sm:px-3 min-w-max">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition
                    ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                      ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-5">
          {/* ── TAB: Resumen ── */}
          {activeTab === 'resumen' && (
            <div className="space-y-5">
              {/* Estadísticas de facturas */}
              {reporte.estadisticasFacturas && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📋</span> Estados de facturas
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <MiniStat label="Pendientes" value={reporte.estadisticasFacturas.pendientes} color="text-yellow-700" bg="bg-yellow-50" />
                    <MiniStat label="Abonadas" value={reporte.estadisticasFacturas.abonadas} color="text-blue-700" bg="bg-blue-50" />
                    <MiniStat label="Pagadas" value={reporte.estadisticasFacturas.pagadas} color="text-green-700" bg="bg-green-50" />
                    <MiniStat label="Anuladas" value={reporte.estadisticasFacturas.anuladas} color="text-red-700" bg="bg-red-50" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3">
                    <MiniStat label="Monto anulado" value={formatCurrency(reporte.estadisticasFacturas.montoAnulado)} color="text-red-600" bg="bg-red-50" />
                    <MiniStat label="Días en el rango" value={reporte.estadisticasFacturas.dias} color="text-gray-700" bg="bg-gray-50" />
                    <MiniStat label="Promedio diario" value={formatCurrency(reporte.estadisticasFacturas.promedioDiario)} color="text-blue-700" bg="bg-blue-50" />
                  </div>
                </div>
              )}

              {/* Por categoría de servicio */}
              {reporte.porCategoriaServicio && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📂</span> Por categoría de servicio
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                    <MiniStat label="Consultas" value={formatCurrency(reporte.porCategoriaServicio.consultas || 0)} color="text-blue-700" bg="bg-blue-50" />
                    <MiniStat label="Operaciones" value={formatCurrency(reporte.porCategoriaServicio.operaciones || 0)} color="text-orange-700" bg="bg-orange-50" />
                    <MiniStat label="Estudios" value={formatCurrency(reporte.porCategoriaServicio.estudios || 0)} color="text-purple-700" bg="bg-purple-50" />
                    <MiniStat label="Estética" value={formatCurrency(reporte.porCategoriaServicio.estetica || 0)} color="text-pink-700" bg="bg-pink-50" />
                    <MiniStat label="Productos" value={formatCurrency(reporte.porCategoriaServicio.productos || 0)} color="text-green-700" bg="bg-green-50" />
                  </div>
                </div>
              )}

              {/* Por tipo de servicio */}
              {reporte.porTipoServicio && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>🏷️</span> Por tipo de servicio
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <MiniStat label="Estudios" value={formatCurrency(reporte.porTipoServicio.ESTUDIO || 0)} color="text-purple-700" bg="bg-purple-50" />
                    <MiniStat label="Operaciones" value={formatCurrency(reporte.porTipoServicio.OPERACION || 0)} color="text-orange-700" bg="bg-orange-50" />
                    <MiniStat label="Estética" value={formatCurrency(reporte.porTipoServicio.ESTETICA || 0)} color="text-pink-700" bg="bg-pink-50" />
                    <MiniStat label="Otros" value={formatCurrency(reporte.porTipoServicio.OTROS || 0)} color="text-gray-700" bg="bg-gray-50" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Facturas ── */}
          {activeTab === 'facturas' && (
            <>
              <DataTable
                columns={facturaColumns}
                data={facturasList}
                onRowClick={(factura) => navigate(`/facturacion/${factura.id}`)}
                showGlobalFilter={false}
                hidePagination
              />
              {paginacionFacturas.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={paginacionFacturas.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}

          {/* ── TAB: Vendedores ── */}
          {activeTab === 'vendedores' && (
            reporte.porVendedor.length > 0 ? (
              <DataTable
                columns={vendedorColumns}
                data={reporte.porVendedor}
                showGlobalFilter={false}
              />
            ) : (
              <EmptyTab icon="👥" message="No hay datos de vendedores para este período" />
            )
          )}

          {/* ── TAB: Productos ── */}
          {activeTab === 'productos' && (
            reporte.porProducto.length > 0 ? (
              <DataTable
                columns={productoColumns}
                data={reporte.porProducto}
                showGlobalFilter={false}
              />
            ) : (
              <EmptyTab icon="📦" message="No hay productos vendidos en este período" />
            )
          )}

          {/* ── TAB: Métodos de pago ── */}
          {activeTab === 'metodos' && (
            reporte.porMetodoPago.length > 0 ? (
              <DataTable
                columns={metodoColumns}
                data={reporte.porMetodoPago}
                showGlobalFilter={false}
              />
            ) : (
              <EmptyTab icon="💳" message="No hay pagos registrados en este período" />
            )
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Card de resumen grande ── */
const StatCard = ({ label, value, color, bg, border, icon }) => (
  <div className={`${bg} rounded-xl border ${border} p-3 sm:p-4`}>
    <div className="flex items-start justify-between gap-2">
      <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">
        {label}
      </p>
      <span className="text-base sm:text-lg opacity-70 shrink-0">{icon}</span>
    </div>
    <p className={`text-lg sm:text-2xl font-bold ${color} mt-1 tabular-nums truncate`}>
      {value}
    </p>
  </div>
);

/* ── Mini stat ── */
const MiniStat = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-lg p-2.5 border border-gray-100`}>
    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">
      {label}
    </p>
    <p className={`text-sm sm:text-base font-bold ${color} mt-0.5 tabular-nums truncate`}>
      {value}
    </p>
  </div>
);

/* ── Empty state para tabs ── */
const EmptyTab = ({ icon, message }) => (
  <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
    <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
      {icon}
    </div>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

export default IncomeReportPage;