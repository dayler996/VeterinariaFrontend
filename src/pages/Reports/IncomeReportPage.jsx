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

// Componente para filtros avanzados (sin cambios)
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
  setBusquedaTexto
}) => {
  const [vendedorId, setVendedorId] = useState('');
  const [metodoPago, setMetodoPago] = useState('');

  const aplicarFiltros = () => {
    onFilterChange({ 
      vendedorId, 
      productoId, 
      metodoPago,
      busquedaTexto,
      tipoServicio,
      categoriaId: categoriaSeleccionada,
      servicioId: servicioSeleccionado
    });
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
      servicioId: ''
    });
  };

  const productoOptions = useMemo(() => {
    let productosFiltrados = productos;
    if (tipoProductoSeleccionado) {
      productosFiltrados = productos.filter(p => p.tipoProductoId === parseInt(tipoProductoSeleccionado));
    }
    return productosFiltrados.map(p => ({ value: p.id, label: p.nombre }));
  }, [productos, tipoProductoSeleccionado]);

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Vendedor */}
        <select
          value={vendedorId}
          onChange={(e) => setVendedorId(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Todos los vendedores</option>
          {vendedores.map(v => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </select>

        {/* Tipo de producto */}
        <select
          value={tipoProductoSeleccionado}
          onChange={(e) => setTipoProductoSeleccionado(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Todos los tipos de producto</option>
          {tiposProducto.map(tp => (
            <option key={tp.id} value={tp.id}>{tp.nombre}</option>
          ))}
        </select>

        {/* Producto con búsqueda */}
        <div>
          <Select
            options={productoOptions}
            value={productoOptions.find(opt => opt.value === productoId) || null}
            onChange={(selected) => setProductoId(selected ? selected.value : '')}
            isClearable
            placeholder="Buscar producto..."
            noOptionsMessage={() => "No hay productos"}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {/* Método de pago */}
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Todos los métodos de pago</option>
          {metodosPago.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Fila de filtros de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={tipoServicio}
          onChange={(e) => setTipoServicio(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Todos los servicios</option>
          <option value="estudio">Estudios</option>
          <option value="operacion">Operaciones</option>
          <option value="estetica">Estética</option>
        </select>

        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          className="border rounded p-2"
          disabled={!tipoServicio}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select
          value={servicioSeleccionado}
          onChange={(e) => setServicioSeleccionado(e.target.value)}
          className="border rounded p-2"
          disabled={!categoriaSeleccionada}
        >
          <option value="">Todos los servicios</option>
          {servicios.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar en número, cliente, cédula o descripción..."
          value={busquedaTexto}
          onChange={(e) => setBusquedaTexto(e.target.value)}
          className="border rounded p-2"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={aplicarFiltros}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={limpiarFiltros}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
};

const IncomeReportPage = () => {
  const navigate = useNavigate();
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mensual');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Filtros adicionales
  const [vendedorId, setVendedorId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  // Filtros para servicios
  const [tipoServicio, setTipoServicio] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');

  // Filtros para productos por tipo
  const [tipoProductoSeleccionado, setTipoProductoSeleccionado] = useState('');

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Opciones para selects
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [metodosPago, setMetodosPago] = useState(METODOS_PAGO.map(m => m.value));

  // Estados para la lista de facturas
  const [facturasList, setFacturasList] = useState([]);
  const [paginacionFacturas, setPaginacionFacturas] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    cargarOpciones();
  }, []);

  const cargarOpciones = async () => {
    try {
      const [vendedoresRes, productosRes, tiposProductoRes] = await Promise.all([
        api.get('/trabajadores?incluirInactivos=false'),
        api.get('/productos'),
        api.get('/tipos-producto').catch(() => ({ data: [] }))
      ]);
      setVendedores(vendedoresRes.data);
      setProductos(productosRes.data);
      setTiposProducto(tiposProductoRes.data || []);
    } catch (error) {
      toast.error('Error al cargar opciones');
    }
  };

  useEffect(() => {
    if (tipoServicio) {
      cargarCategorias(tipoServicio);
    } else {
      setCategorias([]);
      setCategoriaSeleccionada('');
      setServicios([]);
      setServicioSeleccionado('');
    }
  }, [tipoServicio]);

  const cargarCategorias = async (tipo) => {
    try {
      const res = await api.get(`/categorias?tipo=${tipo}`);
      setCategorias(res.data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    }
  };

  useEffect(() => {
    if (tipoServicio && categoriaSeleccionada) {
      cargarServicios(tipoServicio, categoriaSeleccionada);
    } else {
      setServicios([]);
      setServicioSeleccionado('');
    }
  }, [tipoServicio, categoriaSeleccionada]);

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
        servicioId: servicioSeleccionado || undefined
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

  useEffect(() => {
    cargarReporte();
  }, [periodo, page, vendedorId, productoId, metodoPago, busquedaTexto, tipoServicio, categoriaSeleccionada, servicioSeleccionado]);

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

  const exportToExcel = async () => {
  if (!reporte) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Veterinaria DOGVET';
  workbook.lastModifiedBy = 'Sistema';
  workbook.created = new Date();
  workbook.modified = new Date();

  const fechaGeneracion = new Date().toLocaleString();

  // ========== HOJA RESUMEN ==========
  const wsResumen = workbook.addWorksheet('Resumen');
  wsResumen.columns = [
    { header: 'Concepto', key: 'concepto', width: 35 },
    { header: 'Valor', key: 'valor', width: 30 }
  ];

  // Título principal
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
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // ========== HOJA FACTURAS (con pagado y saldo) ==========
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
      { header: 'Vendedor', key: 'vendedor', width: 20 }
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
      vendedor: f.vendedor
    })));

    // Estilo cabecera
    wsFacturas.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Formato de moneda para columnas numéricas
    ['total', 'montoPagado', 'saldoPendiente'].forEach(col => {
      wsFacturas.getColumn(col).numFmt = '"$"#,##0.00';
    });

    // Bordes para filas de datos
    wsFacturas.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });
  }

  // ========== HOJA ESTADÍSTICAS ==========
  if (reporte.estadisticasFacturas) {
    const est = reporte.estadisticasFacturas;
    const wsStats = workbook.addWorksheet('Estadísticas');
    wsStats.columns = [
      { header: 'Concepto', key: 'concepto', width: 35 },
      { header: 'Valor', key: 'valor', width: 20 }
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
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Formato condicional: solo montos llevan símbolo $
    wsStats.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const conceptoCell = row.getCell(1);
        const valorCell = row.getCell(2);
        if (['Monto anulado', 'Promedio diario de ventas'].includes(conceptoCell.value)) {
          valorCell.numFmt = '"$"#,##0.00';
        } else {
          valorCell.numFmt = '#,##0'; // número entero sin decimales ni símbolo
        }
      }
    });
  }

  // ========== HOJA VENTAS POR VENDEDOR ==========
  if (reporte.porVendedor.length > 0) {
    const wsVendedor = workbook.addWorksheet('Ventas x Vendedor');
    wsVendedor.columns = [
      { header: 'Vendedor', key: 'nombre', width: 25 },
      { header: 'Ventas (USD)', key: 'ventas', width: 15 },
      { header: 'Cantidad Facturas', key: 'cantidad', width: 15 },
      { header: '% del total', key: 'porcentaje', width: 12 }
    ];

    const totalVentas = reporte.totalVendido;
    wsVendedor.addRows(reporte.porVendedor.map(v => ({
      nombre: v.nombre,
      ventas: v.ventas,
      cantidad: v.cantidadFacturas,
      porcentaje: totalVentas > 0 ? ((v.ventas / totalVentas) * 100).toFixed(2) + '%' : '0%'
    })));

    wsVendedor.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    wsVendedor.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    wsVendedor.getColumn('ventas').numFmt = '"$"#,##0.00';
  }

  // ========== HOJA PRODUCTOS ==========
  if (reporte.porProducto.length > 0) {
    const wsProducto = workbook.addWorksheet('Productos');
    wsProducto.columns = [
      { header: '#', key: 'rank', width: 5 },
      { header: 'Producto', key: 'nombre', width: 35 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Total Vendido (USD)', key: 'total', width: 15 },
      { header: '% del total', key: 'porcentaje', width: 12 }
    ];

    const productosOrdenados = [...reporte.porProducto].sort((a, b) => b.totalVendido - a.totalVendido);
    const totalProductos = productosOrdenados.reduce((sum, p) => sum + p.totalVendido, 0);

    wsProducto.addRows(productosOrdenados.map((p, idx) => ({
      rank: idx + 1,
      nombre: p.nombre,
      cantidad: p.cantidad,
      total: p.totalVendido,
      porcentaje: totalProductos > 0 ? ((p.totalVendido / totalProductos) * 100).toFixed(2) + '%' : '0%'
    })));

    wsProducto.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    wsProducto.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    wsProducto.getColumn('total').numFmt = '"$"#,##0.00';
  }

  // ========== HOJA MÉTODOS DE PAGO ==========
  if (reporte.porMetodoPago.length > 0) {
    const wsMetodo = workbook.addWorksheet('Métodos de Pago');
    wsMetodo.columns = [
      { header: 'Método', key: 'metodo', width: 20 },
      { header: 'Monto Total (USD)', key: 'monto', width: 15 },
      { header: 'Cantidad Pagos', key: 'cantidad', width: 15 },
      { header: '% del total', key: 'porcentaje', width: 12 }
    ];

    const totalPagado = reporte.totalPagado;
    wsMetodo.addRows(reporte.porMetodoPago.map(m => ({
      metodo: m.metodo,
      monto: m.montoTotal,
      cantidad: m.cantidadPagos,
      porcentaje: totalPagado > 0 ? ((m.montoTotal / totalPagado) * 100).toFixed(2) + '%' : '0%'
    })));

    wsMetodo.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    wsMetodo.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    wsMetodo.getColumn('monto').numFmt = '"$"#,##0.00';
  }

  // ========== HOJA SERVICIOS POR TIPO ==========
  if (reporte.porTipoServicio) {
    const wsTipo = workbook.addWorksheet('Servicios x Tipo');
    wsTipo.columns = [
      { header: 'Tipo de Servicio', key: 'tipo', width: 20 },
      { header: 'Monto (USD)', key: 'monto', width: 15 },
      { header: '% del total', key: 'porcentaje', width: 12 }
    ];

    const totalServicios = (reporte.porTipoServicio.ESTUDIO || 0) +
                          (reporte.porTipoServicio.OPERACION || 0) +
                          (reporte.porTipoServicio.ESTETICA || 0) +
                          (reporte.porTipoServicio.OTROS || 0);

    wsTipo.addRows([
      { tipo: 'Estudios', monto: reporte.porTipoServicio.ESTUDIO || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.ESTUDIO / totalServicios) * 100).toFixed(2) + '%' : '0%' },
      { tipo: 'Operaciones', monto: reporte.porTipoServicio.OPERACION || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.OPERACION / totalServicios) * 100).toFixed(2) + '%' : '0%' },
      { tipo: 'Estética', monto: reporte.porTipoServicio.ESTETICA || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.ESTETICA / totalServicios) * 100).toFixed(2) + '%' : '0%' },
      { tipo: 'Otros', monto: reporte.porTipoServicio.OTROS || 0, porcentaje: totalServicios > 0 ? ((reporte.porTipoServicio.OTROS / totalServicios) * 100).toFixed(2) + '%' : '0%' }
    ]);

    wsTipo.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    wsTipo.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    wsTipo.getColumn('monto').numFmt = '"$"#,##0.00';
  }


  // ========== GENERAR ARCHIVO ==========
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `reporte_ingresos_${new Date().toISOString().slice(0,10)}.xlsx`);
};


// export to pdf
const exportToPDF = async () => {
  if (!reporte) return;

  const doc = new jsPDF();
  let yOffset = 20; // posición vertical inicial

  // Título principal
  doc.setFontSize(18);
  doc.setTextColor(31, 78, 121); // azul oscuro
  doc.text('REPORTE DE INGRESOS - VETERINARIA DOGVET', 14, yOffset);
  yOffset += 10;

  // Fecha de generación
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, yOffset);
  yOffset += 10;

  // Filtros aplicados
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
    `Búsqueda: ${busquedaTexto || 'Ninguna'}`
  ];
  filtros.forEach(f => {
    doc.text(f, 14, yOffset);
    yOffset += 5;
  });
  yOffset += 5;

  // Resumen general
  if (yOffset > 250) {
    doc.addPage();
    yOffset = 20;
  }
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
    ['Cantidad Facturas', reporte.totalFacturasGlobal || reporte.totalFacturas]
  ];
  autoTable(doc, {
    startY: yOffset,
    head: [['Concepto', 'Valor']],
    body: resumen,
    theme: 'striped',
    headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 } }
  });
  yOffset = doc.lastAutoTable.finalY + 10;

  // Facturas
  if (facturasList.length > 0) {
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 121);
    doc.text('Facturas', 14, yOffset);
    yOffset += 7;
    const facturasBody = facturasList.map(f => [
      f.numero,
      new Date(f.fecha).toLocaleDateString(),
      f.cliente,
      f.cedula,
      formatCurrency(f.total),
      formatCurrency(f.montoPagado || 0),
      formatCurrency(f.saldoPendiente || 0),
      f.estadoPago,
      f.vendedor
    ]);
    autoTable(doc, {
      startY: yOffset,
      head: [['Número', 'Fecha', 'Cliente', 'Cédula', 'Total', 'Pagado', 'Saldo', 'Estado', 'Vendedor']],
      body: facturasBody,
      theme: 'striped',
      headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 25 }
      }
    });
    yOffset = doc.lastAutoTable.finalY + 10;
  }

  // Estadísticas de facturas
  if (reporte.estadisticasFacturas) {
    const est = reporte.estadisticasFacturas;
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
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
      ['Promedio diario', formatCurrency(est.promedioDiario)]
    ];
    autoTable(doc, {
      startY: yOffset,
      body: statsBody,
      theme: 'striped',
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 } }
    });
    yOffset = doc.lastAutoTable.finalY + 10;
  }

  // Ventas por vendedor
  if (reporte.porVendedor.length > 0) {
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 121);
    doc.text('Ventas por Vendedor', 14, yOffset);
    yOffset += 7;
    const totalVentas = reporte.totalVendido;
    const vendedorBody = reporte.porVendedor.map(v => [
      v.nombre,
      formatCurrency(v.ventas),
      v.cantidadFacturas,
      totalVentas > 0 ? ((v.ventas / totalVentas) * 100).toFixed(2) + '%' : '0%'
    ]);
    autoTable(doc, {
      startY: yOffset,
      head: [['Vendedor', 'Ventas (USD)', 'Facturas', '%']],
      body: vendedorBody,
      theme: 'striped',
      headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 } }
    });
    yOffset = doc.lastAutoTable.finalY + 10;
  }

  // Productos vendidos
  if (reporte.porProducto.length > 0) {
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 121);
    doc.text('Productos Vendidos', 14, yOffset);
    yOffset += 7;
    const productosOrdenados = [...reporte.porProducto].sort((a, b) => b.totalVendido - a.totalVendido);
    const totalProductos = productosOrdenados.reduce((sum, p) => sum + p.totalVendido, 0);
    const productoBody = productosOrdenados.map((p, idx) => [
      idx + 1,
      p.nombre,
      p.cantidad,
      formatCurrency(p.totalVendido),
      totalProductos > 0 ? ((p.totalVendido / totalProductos) * 100).toFixed(2) + '%' : '0%'
    ]);
    autoTable(doc, {
      startY: yOffset,
      head: [['#', 'Producto', 'Cantidad', 'Total (USD)', '%']],
      body: productoBody,
      theme: 'striped',
      headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 70 }, 2: { cellWidth: 15 }, 3: { cellWidth: 20 }, 4: { cellWidth: 15 } }
    });
    yOffset = doc.lastAutoTable.finalY + 10;
  }

  // Métodos de pago
  if (reporte.porMetodoPago.length > 0) {
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 121);
    doc.text('Métodos de Pago', 14, yOffset);
    yOffset += 7;
    const totalPagado = reporte.totalPagado;
    const metodoBody = reporte.porMetodoPago.map(m => [
      m.metodo,
      formatCurrency(m.montoTotal),
      m.cantidadPagos,
      totalPagado > 0 ? ((m.montoTotal / totalPagado) * 100).toFixed(2) + '%' : '0%'
    ]);
    autoTable(doc, {
      startY: yOffset,
      head: [['Método', 'Monto (USD)', 'Pagos', '%']],
      body: metodoBody,
      theme: 'striped',
      headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15 } }
    });
    yOffset = doc.lastAutoTable.finalY + 10;
  }

  // Servicios por tipo
  if (reporte.porTipoServicio) {
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 121);
    doc.text('Servicios por Tipo', 14, yOffset);
    yOffset += 7;
    const totalServicios = (reporte.porTipoServicio.ESTUDIO || 0) +
                          (reporte.porTipoServicio.OPERACION || 0) +
                          (reporte.porTipoServicio.ESTETICA || 0) +
                          (reporte.porTipoServicio.OTROS || 0);
    const tipoBody = [
      ['Estudios', formatCurrency(reporte.porTipoServicio.ESTUDIO || 0), totalServicios > 0 ? ((reporte.porTipoServicio.ESTUDIO / totalServicios) * 100).toFixed(2) + '%' : '0%'],
      ['Operaciones', formatCurrency(reporte.porTipoServicio.OPERACION || 0), totalServicios > 0 ? ((reporte.porTipoServicio.OPERACION / totalServicios) * 100).toFixed(2) + '%' : '0%'],
      ['Estética', formatCurrency(reporte.porTipoServicio.ESTETICA || 0), totalServicios > 0 ? ((reporte.porTipoServicio.ESTETICA / totalServicios) * 100).toFixed(2) + '%' : '0%'],
      ['Otros', formatCurrency(reporte.porTipoServicio.OTROS || 0), totalServicios > 0 ? ((reporte.porTipoServicio.OTROS / totalServicios) * 100).toFixed(2) + '%' : '0%']
    ];
    autoTable(doc, {
      startY: yOffset,
      head: [['Tipo', 'Monto (USD)', '%']],
      body: tipoBody,
      theme: 'striped',
      headStyles: { fillColor: [79, 129, 189], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 } }
    });
  }

  // Guardar PDF
  doc.save(`reporte_ingresos_${new Date().toISOString().slice(0,10)}.pdf`);
};

// fin to pdf






  if (loading && !reporte) return <div className="text-center p-4">Cargando reporte...</div>;
  if (!reporte) return <div className="text-center p-4">No hay datos</div>;

  const vendedorColumns = [
    { header: 'Vendedor', accessorKey: 'nombre' },
    { header: 'Ventas ($)', accessorKey: 'ventas', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Facturas', accessorKey: 'cantidadFacturas' },
  ];

  const productoColumns = [
    { header: 'Producto', accessorKey: 'nombre' },
    { header: 'Cantidad', accessorKey: 'cantidad' },
    { header: 'Total Vendido ($)', accessorKey: 'totalVendido', cell: ({ getValue }) => formatCurrency(getValue()) },
  ];

  const metodoColumns = [
    { header: 'Método de Pago', accessorKey: 'metodo' },
    { header: 'Monto Total ($)', accessorKey: 'montoTotal', cell: ({ getValue }) => formatCurrency(getValue()) },
    { header: 'Cantidad Pagos', accessorKey: 'cantidadPagos' },
  ];

  const facturaColumns = [
  { header: 'Número', accessorKey: 'numero' },
  { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() },
  { header: 'Cliente', accessorKey: 'cliente' },
  { header: 'Cédula', accessorKey: 'cedula' },
  { header: 'Total', accessorKey: 'total', cell: ({ getValue }) => formatCurrency(getValue()) },
  { header: 'Pagado', accessorKey: 'montoPagado', cell: ({ getValue }) => formatCurrency(getValue()) },
  { header: 'Saldo', accessorKey: 'saldoPendiente', cell: ({ getValue }) => formatCurrency(getValue()) },
  { header: 'Estado', accessorKey: 'estadoPago' },
  { header: 'Vendedor', accessorKey: 'vendedor' },
];

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
  <h1 className="text-2xl font-bold">Reporte de Ingresos</h1>
  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    <button
      onClick={exportToExcel}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
    >
      Exportar a Excel
    </button>
    <button
      onClick={exportToPDF}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
    >
      Exportar a PDF
    </button>
  </div>
</div>

      {/* Filtros de fecha */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="border rounded p-2"
        >
          <option value="total">Todo</option>
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
          <option value="anual">Anual</option>
        </select>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          placeholder="Fecha inicio"
          className="border rounded p-2"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          placeholder="Fecha fin"
          className="border rounded p-2"
        />
        <button
          onClick={handleFilterRange}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filtrar por rango
        </button>
      </div>

      {/* Filtros avanzados */}
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

      {/* Resumen general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Ingresos (pagado)</p>
          <p className="text-2xl font-bold">{formatCurrency(reporte.totalIngresos)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-600">Vendido</p>
          <p className="text-2xl font-bold">{formatCurrency(reporte.totalVendido)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-600">Pendiente</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(reporte.totalPendiente)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-600">Ticket Promedio</p>
          <p className="text-2xl font-bold">{formatCurrency(reporte.ticketPromedio)}</p>
        </div>
      </div>

      {/* Facturas del Reporte - Ahora primero */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Facturas del Reporte</h2>
        <DataTable
          columns={facturaColumns}
          data={facturasList}
          onRowClick={(factura) => navigate(`/facturacion/${factura.id}`)}
          showGlobalFilter={false}
        />
        <Pagination
          currentPage={page}
          totalPages={paginacionFacturas.totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Por método de pago */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Por Método de Pago</h2>
        <DataTable
          columns={metodoColumns}
          data={reporte.porMetodoPago}
          showGlobalFilter={false}
        />
      </div>

      {/* Por categoría de servicio */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Por Categoría de Servicio</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div><span className="font-medium">Consultas:</span> {formatCurrency(reporte.porCategoriaServicio.consultas)}</div>
          <div><span className="font-medium">Operaciones:</span> {formatCurrency(reporte.porCategoriaServicio.operaciones)}</div>
          <div><span className="font-medium">Estudios:</span> {formatCurrency(reporte.porCategoriaServicio.estudios)}</div>
          <div><span className="font-medium">Estética:</span> {formatCurrency(reporte.porCategoriaServicio.estetica)}</div>
          <div><span className="font-medium">Productos:</span> {formatCurrency(reporte.porCategoriaServicio.productos)}</div>
        </div>
      </div>

      {/* Ventas por Vendedor */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Ventas por Vendedor</h2>
        <DataTable
          columns={vendedorColumns}
          data={reporte.porVendedor}
          showGlobalFilter={false}
        />
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(reporte.totalFacturasGlobal / pageSize)}
          onPageChange={setPage}
        />
      </div>

      {/* Productos Vendidos */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Productos Vendidos</h2>
        <DataTable
          columns={productoColumns}
          data={reporte.porProducto}
          showGlobalFilter={false}
        />
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(reporte.totalFacturasGlobal / pageSize)}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default IncomeReportPage;