import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { METODOS_PAGO } from '../../constants/metodosPago';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart3, TrendingUp, TrendingDown, Target,
  DollarSign, FileSpreadsheet, FileDown, FileText,
  Filter, ChevronDown, ChevronUp, X, Check,
  Users as UsersIcon, Package, CreditCard, Receipt,
  Calendar, Search as SearchIcon, FolderOpen, Tag,
  ClipboardList, AlertTriangle, Clock, CheckCircle2,
  XCircle, Wallet, PieChart, Layers,
} from 'lucide-react';

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
        (p) => p.tipoProductoId === parseInt(tipoProductoSeleccionado)
      );
    }
    return productosFiltrados.map((p) => ({ value: p.id, label: p.nombre }));
  }, [productos, tipoProductoSeleccionado]);

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      fontSize: '13px',
      borderColor: '#cbd5e1',
      borderRadius: '0.5rem',
      '&:hover': { borderColor: '#94a3b8' },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, fontSize: '13px' }),
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 mb-4 overflow-hidden">
      {/* Cabecera: toggle */}
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3 text-left
                   hover:bg-slate-50/60 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
          </div>
          <span className="font-medium text-sm text-slate-800">Filtros avanzados</span>
          {hayFiltrosActivos && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                              bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide
                              border border-blue-200">
              <Check className="w-3 h-3" strokeWidth={2.5} />
              Activos
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${abierto ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </button>

      {/* Panel colapsable */}
      {abierto && (
        <div className="px-3 sm:px-4 pb-4 pt-1 space-y-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
            {/* Vendedor */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UsersIcon className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Vendedor
              </label>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>

            {/* Tipo de producto */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Tipo de producto
              </label>
              <select
                value={tipoProductoSeleccionado}
                onChange={(e) => setTipoProductoSeleccionado(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {tiposProducto.map((tp) => (
                  <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                ))}
              </select>
            </div>

            {/* Producto */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Package className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Producto específico
              </label>
              <Select
                options={productoOptions}
                value={productoOptions.find((opt) => opt.value === productoId) || null}
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
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {metodosPago.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Tipo de servicio */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <PieChart className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Tipo de servicio
              </label>
              <select
                value={tipoServicio}
                onChange={(e) => setTipoServicio(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
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
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Categoría
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                disabled={!tipoServicio}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Servicio */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Servicio específico
              </label>
              <select
                value={servicioSeleccionado}
                onChange={(e) => setServicioSeleccionado(e.target.value)}
                disabled={!categoriaSeleccionada}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Búsqueda */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <SearchIcon className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                Búsqueda general
              </label>
              <div className="relative">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  strokeWidth={2.2}
                />
                <input
                  type="text"
                  placeholder="Buscar en número, cliente, cédula o descripción..."
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={aplicarFiltros}
              className="inline-flex items-center justify-center gap-1.5
                         bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                         hover:bg-blue-700 active:bg-blue-800 transition
                         w-full sm:w-auto shadow-sm shadow-blue-600/20"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              Aplicar filtros
            </button>
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center justify-center gap-1.5
                           bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium
                           hover:bg-slate-200 active:bg-slate-300 transition
                           w-full sm:w-auto"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
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
  const metodosPago = METODOS_PAGO.map((m) => m.value);

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
      const filtrados = res.data.filter((s) => s.categoriaId === parseInt(catId));
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
     EXPORTACIÓN — lógica intacta
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

    wsResumen.addRow([`Vendedor: ${vendedores.find((v) => v.id === parseInt(vendedorId))?.nombre || 'Todos'}`, '']);
    wsResumen.addRow([`Producto: ${productos.find((p) => p.id === parseInt(productoId))?.nombre || 'Todos'}`, '']);
    wsResumen.addRow([`Método de pago: ${metodoPago || 'Todos'}`, '']);
    wsResumen.addRow([`Tipo servicio: ${tipoServicio || 'Todos'}`, '']);
    wsResumen.addRow([`Categoría: ${categorias.find((c) => c.id === parseInt(categoriaSeleccionada))?.nombre || 'Todas'}`, '']);
    wsResumen.addRow([`Servicio específico: ${servicios.find((s) => s.id === parseInt(servicioSeleccionado))?.nombre || 'Todos'}`, '']);
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

      wsFacturas.addRows(facturasList.map((f) => ({
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

      wsFacturas.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      ['total', 'montoPagado', 'saldoPendiente'].forEach((col) => {
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
      wsStats.getRow(1).eachCell((cell) => {
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
      wsVendedor.addRows(reporte.porVendedor.map((v) => ({
        nombre: v.nombre,
        ventas: v.ventas,
        cantidad: v.cantidadFacturas,
        porcentaje: totalVentas > 0 ? ((v.ventas / totalVentas) * 100).toFixed(2) + '%' : '0%',
      })));
      wsVendedor.getRow(1).eachCell((cell) => {
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
      wsProducto.getRow(1).eachCell((cell) => {
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
      wsMetodo.addRows(reporte.porMetodoPago.map((m) => ({
        metodo: m.metodo,
        monto: m.montoTotal,
        cantidad: m.cantidadPagos,
        porcentaje: totalPagado > 0 ? ((m.montoTotal / totalPagado) * 100).toFixed(2) + '%' : '0%',
      })));
      wsMetodo.getRow(1).eachCell((cell) => {
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
      wsTipo.getRow(1).eachCell((cell) => {
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
      `Vendedor: ${vendedores.find((v) => v.id === parseInt(vendedorId))?.nombre || 'Todos'}`,
      `Producto: ${productos.find((p) => p.id === parseInt(productoId))?.nombre || 'Todos'}`,
      `Método de pago: ${metodoPago || 'Todos'}`,
      `Tipo servicio: ${tipoServicio || 'Todos'}`,
      `Categoría: ${categorias.find((c) => c.id === parseInt(categoriaSeleccionada))?.nombre || 'Todas'}`,
      `Servicio específico: ${servicios.find((s) => s.id === parseInt(servicioSeleccionado))?.nombre || 'Todos'}`,
      `Búsqueda: ${busquedaTexto || 'Ninguna'}`,
    ];
    filtros.forEach((f) => {
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
      const facturasBody = facturasList.map((f) => [
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
      const vendedorBody = reporte.porVendedor.map((v) => [
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
      const metodoBody = reporte.porMetodoPago.map((m) => [
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
    {
      header: 'Vendedor',
      accessorKey: 'nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <UsersIcon className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Ventas ($)',
      accessorKey: 'ventas',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums font-semibold text-emerald-700">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      header: 'Facturas',
      accessorKey: 'cantidadFacturas',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold tabular-nums">
          <Receipt className="w-3 h-3" strokeWidth={2.5} />
          {getValue()}
        </span>
      ),
    },
  ];

  const productoColumns = [
    {
      header: 'Producto',
      accessorKey: 'nombre',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-amber-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Cantidad',
      accessorKey: 'cantidad',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums text-slate-700">{getValue()}</span>
      ),
    },
    {
      header: 'Total ($)',
      accessorKey: 'totalVendido',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums font-semibold text-emerald-700">
          {formatCurrency(getValue())}
        </span>
      ),
    },
  ];

  const metodoColumns = [
    {
      header: 'Método',
      accessorKey: 'metodo',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-violet-600" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">{getValue() || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Monto ($)',
      accessorKey: 'montoTotal',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums font-semibold text-emerald-700">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      header: 'Pagos',
      accessorKey: 'cantidadPagos',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums text-slate-700">{getValue()}</span>
      ),
    },
  ];

  const facturaColumns = [
    {
      header: 'Número',
      accessorKey: 'numero',
      cell: ({ getValue }) => (
        <span className="font-medium text-sm text-slate-800 tabular-nums">{getValue()}</span>
      ),
    },
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600 tabular-nums">
          {new Date(getValue()).toLocaleDateString()}
        </span>
      ),
    },
    { header: 'Cliente', accessorKey: 'cliente' },
    { header: 'Cédula', accessorKey: 'cedula' },
    {
      header: 'Total',
      accessorKey: 'total',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums font-medium text-slate-700">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      header: 'Pagado',
      accessorKey: 'montoPagado',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums font-medium text-emerald-700">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      header: 'Saldo',
      accessorKey: 'saldoPendiente',
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums font-medium text-red-600">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'estadoPago',
      cell: ({ getValue }) => {
        const estado = (getValue() || '').toUpperCase();
        let cls = 'bg-slate-100 text-slate-700 border-slate-200';
        if (estado.includes('PENDIENT')) cls = 'bg-amber-100 text-amber-700 border-amber-200';
        else if (estado.includes('ABONAD')) cls = 'bg-blue-100 text-blue-700 border-blue-200';
        else if (estado.includes('PAGAD')) cls = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        else if (estado.includes('ANULAD')) cls = 'bg-red-100 text-red-700 border-red-200';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cls}`}>
            {getValue() || '—'}
          </span>
        );
      },
    },
    { header: 'Vendedor', accessorKey: 'vendedor' },
  ];

  /* ── Tabs config ── */
  const tabs = [
    { id: 'resumen', label: 'Resumen', Icon: BarChart3 },
    { id: 'facturas', label: 'Facturas', Icon: Receipt, count: facturasList.length },
    { id: 'vendedores', label: 'Vendedores', Icon: UsersIcon, count: reporte?.porVendedor?.length },
    { id: 'productos', label: 'Productos', Icon: Package, count: reporte?.porProducto?.length },
    { id: 'metodos', label: 'Pagos', Icon: CreditCard, count: reporte?.porMetodoPago?.length },
  ];

  /* ── Loading ── */
  if (loading && !reporte) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-slate-500 text-sm">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      <PageHeader
        icon="📊"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Reporte de Ingresos' },
        ]}
        title="Reporte de Ingresos"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5" strokeWidth={2.2} />
            {periodo === 'total' ? 'Histórico completo' : `Período ${periodo}`}
            {fechaInicio && fechaFin && (
              <>
                <span className="text-slate-300">·</span>
                <span className="tabular-nums">{fechaInicio} a {fechaFin}</span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center justify-center gap-1.5
                         bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-emerald-700 active:bg-emerald-800 transition
                         shadow-sm shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" strokeWidth={2.2} />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center justify-center gap-1.5
                         bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-red-700 active:bg-red-800 transition
                         shadow-sm shadow-red-600/20"
            >
              <FileDown className="w-4 h-4" strokeWidth={2.2} />
              PDF
            </button>
          </>
        }
      />

      {/* ═══ Filtros de fecha/periodo ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-slate-800">
            Período y rango
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Período
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
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
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilterRange}
              className="w-full inline-flex items-center justify-center gap-1.5
                         bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                         hover:bg-blue-700 active:bg-blue-800 transition
                         shadow-sm shadow-blue-600/20"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
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
          icon={DollarSign}
          label="Total Cobrado"
          value={formatCurrency(reporte.totalIngresos)}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Vendido"
          value={formatCurrency(reporte.totalVendido)}
          tone="blue"
        />
        <StatCard
          icon={TrendingDown}
          label="Por Cobrar"
          value={formatCurrency(reporte.totalPendiente)}
          tone="red"
        />
        <StatCard
          icon={Target}
          label="Ticket Promedio"
          value={formatCurrency(reporte.ticketPromedio)}
          tone="violet"
        />
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="border-b border-slate-100 overflow-x-auto">
          <nav className="flex gap-1 px-2 sm:px-3 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition
                    ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums
                      ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
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
            <div className="space-y-6">
              {/* Estadísticas de facturas */}
              {reporte.estadisticasFacturas && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                    <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
                    <h3 className="text-base font-semibold text-slate-800">
                      Estados de facturas
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <MiniStat icon={Clock} label="Pendientes" value={reporte.estadisticasFacturas.pendientes} tone="amber" />
                    <MiniStat icon={Receipt} label="Abonadas" value={reporte.estadisticasFacturas.abonadas} tone="blue" />
                    <MiniStat icon={CheckCircle2} label="Pagadas" value={reporte.estadisticasFacturas.pagadas} tone="emerald" />
                    <MiniStat icon={XCircle} label="Anuladas" value={reporte.estadisticasFacturas.anuladas} tone="red" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3">
                    <MiniStat icon={AlertTriangle} label="Monto anulado" value={formatCurrency(reporte.estadisticasFacturas.montoAnulado)} tone="red" />
                    <MiniStat icon={Calendar} label="Días en el rango" value={reporte.estadisticasFacturas.dias} tone="slate" />
                    <MiniStat icon={TrendingUp} label="Promedio diario" value={formatCurrency(reporte.estadisticasFacturas.promedioDiario)} tone="blue" />
                  </div>
                </div>
              )}

              {/* Por categoría de servicio */}
              {reporte.porCategoriaServicio && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                    <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
                    <h3 className="text-base font-semibold text-slate-800">
                      Por categoría de servicio
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                    <MiniStat icon={FileText} label="Consultas" value={formatCurrency(reporte.porCategoriaServicio.consultas || 0)} tone="blue" />
                    <MiniStat icon={TrendingUp} label="Operaciones" value={formatCurrency(reporte.porCategoriaServicio.operaciones || 0)} tone="orange" />
                    <MiniStat icon={FileText} label="Estudios" value={formatCurrency(reporte.porCategoriaServicio.estudios || 0)} tone="violet" />
                    <MiniStat icon={Target} label="Estética" value={formatCurrency(reporte.porCategoriaServicio.estetica || 0)} tone="pink" />
                    <MiniStat icon={Package} label="Productos" value={formatCurrency(reporte.porCategoriaServicio.productos || 0)} tone="emerald" />
                  </div>
                </div>
              )}

              {/* Por tipo de servicio */}
              {reporte.porTipoServicio && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                    <Tag className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
                    <h3 className="text-base font-semibold text-slate-800">
                      Por tipo de servicio
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <MiniStat icon={FileText} label="Estudios" value={formatCurrency(reporte.porTipoServicio.ESTUDIO || 0)} tone="violet" />
                    <MiniStat icon={TrendingUp} label="Operaciones" value={formatCurrency(reporte.porTipoServicio.OPERACION || 0)} tone="orange" />
                    <MiniStat icon={Target} label="Estética" value={formatCurrency(reporte.porTipoServicio.ESTETICA || 0)} tone="pink" />
                    <MiniStat icon={Layers} label="Otros" value={formatCurrency(reporte.porTipoServicio.OTROS || 0)} tone="slate" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Facturas ── */}
          {activeTab === 'facturas' && (
            <>
              {facturasList.length === 0 ? (
                <EmptyTab icon={Receipt} message="No hay facturas para este período" />
              ) : (
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
            </>
          )}

          {/* ── TAB: Vendedores ── */}
          {activeTab === 'vendedores' && (
            reporte.porVendedor.length > 0 ? (
              <DataTable columns={vendedorColumns} data={reporte.porVendedor} showGlobalFilter={false} />
            ) : (
              <EmptyTab icon={UsersIcon} message="No hay datos de vendedores para este período" />
            )
          )}

          {/* ── TAB: Productos ── */}
          {activeTab === 'productos' && (
            reporte.porProducto.length > 0 ? (
              <DataTable columns={productoColumns} data={reporte.porProducto} showGlobalFilter={false} />
            ) : (
              <EmptyTab icon={Package} message="No hay productos vendidos en este período" />
            )
          )}

          {/* ── TAB: Métodos de pago ── */}
          {activeTab === 'metodos' && (
            reporte.porMetodoPago.length > 0 ? (
              <DataTable columns={metodoColumns} data={reporte.porMetodoPago} showGlobalFilter={false} />
            ) : (
              <EmptyTab icon={CreditCard} message="No hay pagos registrados en este período" />
            )
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════ Card de resumen grande ═══════════════ */
const StatCard = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200/60', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', value: 'text-emerald-700' },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200/60',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    value: 'text-blue-700' },
    red:     { bg: 'bg-red-50',     border: 'border-red-200/60',     iconBg: 'bg-red-100',     iconText: 'text-red-600',     value: 'text-red-700' },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-200/60',  iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  value: 'text-violet-700' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200/60',   iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   value: 'text-slate-700' },
  }[tone];

  return (
    <div className={`${toneCls.bg} rounded-xl border ${toneCls.border} p-3 sm:p-4`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${toneCls.iconBg}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${toneCls.iconText}`} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate leading-tight">
            {label}
          </p>
          <p className={`text-sm sm:text-lg font-bold ${toneCls.value} mt-0.5 tabular-nums truncate`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════ Mini stat ═══════════════ */
const MiniStat = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   icon: 'text-amber-600',   value: 'text-amber-700' },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    icon: 'text-blue-600',    value: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600', value: 'text-emerald-700' },
    red:     { bg: 'bg-red-50',     border: 'border-red-100',     icon: 'text-red-600',     value: 'text-red-700' },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-100',  icon: 'text-violet-600',  value: 'text-violet-700' },
    pink:    { bg: 'bg-pink-50',    border: 'border-pink-100',    icon: 'text-pink-600',    value: 'text-pink-700' },
    orange:  { bg: 'bg-orange-50',  border: 'border-orange-100',  icon: 'text-orange-600',  value: 'text-orange-700' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-100',   icon: 'text-slate-600',   value: 'text-slate-700' },
  }[tone];

  return (
    <div className={`${toneCls.bg} rounded-lg p-2.5 border ${toneCls.border} min-w-0`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 shrink-0 ${toneCls.icon}`} strokeWidth={2.5} />
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </p>
      </div>
      <p className={`text-sm sm:text-base font-bold ${toneCls.value} tabular-nums truncate`}>
        {value}
      </p>
    </div>
  );
};

/* ═══════════════ Empty state para tabs ═══════════════ */
const EmptyTab = ({ icon: Icon, message }) => (
  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
    <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
      <Icon className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
    </div>
    <p className="text-sm text-slate-500 font-medium px-4">{message}</p>
  </div>
);

export default IncomeReportPage;