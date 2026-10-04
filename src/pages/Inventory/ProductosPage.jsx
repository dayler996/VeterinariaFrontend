import { useState, useEffect } from 'react';
import {
  getProductos, createProducto, updateProducto, deleteProducto, ajustarStock,
} from '../../services/productoService';
import { getTiposProducto } from '../../services/crudCatalogoService';
import { getParametrosFactura } from '../../services/parametroFacturaService';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImageUploader from '../../components/common/ImageUploader';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Package, PackagePlus, Pencil, Power, Search,
  FileSpreadsheet, Plus, Filter, X, SlidersHorizontal,
  AlertTriangle, TrendingDown, TrendingUp, CheckCircle2,
  Layers,
} from 'lucide-react';

/* ── Schemas ── */
const productoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  stock: z.number().min(0, 'Stock no puede ser negativo'),
  stockMinimo: z.number().min(0),
  precioCosto: z.number().min(0, 'Precio costo requerido'),
  precioVenta: z.number().min(0, 'Precio venta requerido'),
  imagen: z.string().optional(),
  tipoProductoId: z.number().optional().nullable(),
  vacunaId: z.number().optional().nullable(),
});

const ajusteSchema = z.object({
  cantidad: z.number().refine((val) => val !== 0, { message: 'Cantidad no puede ser 0' }),
});

/* ═══════════════════════════════════════════════════ */
const ProductosPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  const [productos, setProductos] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [factorCambio, setFactorCambio] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [stockMin, setStockMin] = useState('');
  const [stockMax, setStockMax] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: { stock: 0, stockMinimo: 5 },
  });

  const imagen = watch('imagen');

  const {
    register: registerAjuste,
    handleSubmit: handleSubmitAjuste,
    reset: resetAjuste,
    formState: { errors: errorsAjuste },
  } = useForm({ resolver: zodResolver(ajusteSchema) });

  /* ── Carga ── */
  useEffect(() => { loadData(); cargarFactor(); }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const [prodRes, tiposRes] = await Promise.all([
        getProductos(params),
        getTiposProducto(),
      ]);
      setProductos(prodRes.data);
      setTiposProducto(tiposRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarFactor = async () => {
    try {
      const res = await getParametrosFactura();
      const factor = res.data?.factor_cambio;
      if (factor) setFactorCambio(parseFloat(factor));
    } catch (error) {
      console.error('Error al cargar factor de cambio');
    }
  };

  /* ── Handlers ── */
  const handleNew = () => {
    setSelectedProducto(null);
    reset({ stock: 0, stockMinimo: 5, imagen: '' });
    setModalOpen(true);
  };

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    reset({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
      precioCosto: producto.precioCosto,
      precioVenta: producto.precioVenta,
      imagen: producto.imagen || '',
      tipoProductoId: producto.tipoProductoId ?? null,
      vacunaId: producto.vacunaId ?? null,
    });
    setModalOpen(true);
  };

  const handleAjuste = (producto) => {
    setSelectedProducto(producto);
    resetAjuste({ cantidad: 0 });
    setModalAjusteOpen(true);
  };

  const handleDelete = async (id) => {
    const producto = productos.find((p) => p.id === id);
    const accion = producto.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este producto?`)) return;
    try {
      if (producto.activo) {
        await deleteProducto(id);
        toast.success('Producto desactivado');
      } else {
        await updateProducto(id, { ...producto, activo: true });
        toast.success('Producto activado');
      }
      loadData();
    } catch (error) {
      toast.error(`Error al ${accion} el producto`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (!data.tipoProductoId) data.tipoProductoId = null;
      if (!data.vacunaId) data.vacunaId = null;

      if (selectedProducto) {
        await updateProducto(selectedProducto.id, data);
        toast.success('Producto actualizado');
      } else {
        await createProducto(data);
        toast.success('Producto creado');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const onSubmitAjuste = async (data) => {
    try {
      await ajustarStock(selectedProducto.id, data.cantidad);
      toast.success('Stock ajustado');
      setModalAjusteOpen(false);
      loadData();
    } catch (error) {
      toast.error('Error al ajustar stock');
    }
  };

  /* ── Filtrado ── */
  const productosFiltrados = productos.filter((p) => {
    if (filtroTipo && p.tipoProductoId !== parseInt(filtroTipo)) return false;
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (stockMin && p.stock < parseInt(stockMin)) return false;
    if (stockMax && p.stock > parseInt(stockMax)) return false;
    return true;
  });

  const hayFiltrosActivos = filtroTipo || searchTerm || stockMin || stockMax;

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setSearchTerm('');
    setStockMin('');
    setStockMax('');
  };

  /* ── Export Excel ── */
  const exportToExcel = () => {
    if (productosFiltrados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['ID', 'Imagen', 'Nombre', 'Tipo', 'Stock', 'Stock Mínimo', 'Precio Costo ($)', 'Precio Venta ($)', 'Precio Venta (Bs)', 'Activo'],
      ...productosFiltrados.map((p) => [
        p.id,
        p.imagen || '—',
        p.nombre,
        p.tipoProducto?.nombre || '—',
        p.stock,
        p.stockMinimo,
        p.precioCosto,
        p.precioVenta,
        (p.precioVenta * factorCambio).toFixed(2),
        p.activo ? 'Sí' : 'No',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-blue-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {productosFiltrados.length} de {productos.length} producto{productos.length !== 1 && 's'}
            {hayFiltrosActivos && <span className="text-blue-600 font-medium"> (filtrados)</span>}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={exportToExcel}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200
                       px-3.5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" strokeWidth={2.2} />
            <span className="hidden xs:inline">Excel</span>
            <span className="xs:hidden">XLS</span>
          </button>
          <button
            onClick={handleNew}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 text-white
                       px-3.5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition
                       shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Nuevo producto</span>
          </button>
        </div>
      </div>

      {/* ═══ Filtros ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
        {/* Búsqueda + toggle móvil */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Limpiar"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Toggle filtros móvil */}
          <button
            type="button"
            onClick={() => setFiltrosAbiertos((o) => !o)}
            className="sm:hidden relative inline-flex items-center justify-center gap-1.5 px-3 py-2.5
                       border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2.2} />
            <span>Filtros</span>
            {hayFiltrosActivos && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filtros adicionales */}
        <div className={`${filtrosAbiertos ? 'grid' : 'hidden'} sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3`}>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            {tiposProducto.map((tp) => (
              <option key={tp.id} value={tp.id}>{tp.nombre}</option>
            ))}
          </select>

          <div className="relative">
            <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={2.2} />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Stock mínimo"
              value={stockMin}
              onChange={(e) => setStockMin(e.target.value)}
              className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={2.2} />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Stock máximo"
              value={stockMax}
              onChange={(e) => setStockMax(e.target.value)}
              className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer flex-1 select-none">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span>Inactivos</span>
              </label>
            )}
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Contenido ═══ */}
      {productosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <Package className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayFiltrosActivos ? 'No hay productos con esos filtros' : 'No hay productos registrados'}
          </p>
          {!hayFiltrosActivos && (
            <button
              onClick={handleNew}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ═══ DESKTOP: Tabla ═══ */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Costo</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Venta $</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Venta Bs</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productosFiltrados.map((producto) => {
                    const stockBajo = producto.stock <= producto.stockMinimo;
                    return (
                      <tr
                        key={producto.id}
                        onClick={() => handleEdit(producto)}
                        className={`cursor-pointer transition group
                          ${!producto.activo ? 'opacity-50' : ''}
                          hover:bg-blue-50/40`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {producto.imagen ? (
                              <img
                                src={getImageUrl(producto.imagen)}
                                alt={producto.nombre}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-slate-400" strokeWidth={2} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-800 truncate max-w-[200px]">
                                {producto.nombre}
                              </p>
                              <p className="text-[11px] text-slate-400 tabular-nums">#{producto.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {producto.tipoProducto ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              <Layers className="w-3 h-3" strokeWidth={2.2} />
                              {producto.tipoProducto.nombre}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold tabular-nums
                            ${stockBajo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {stockBajo && <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />}
                            {producto.stock}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">mín {producto.stockMinimo}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500 tabular-nums">
                          ${producto.precioCosto}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800 tabular-nums">
                          ${producto.precioVenta}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500 tabular-nums">
                          Bs. {(producto.precioVenta * factorCambio).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                            ${producto.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-600'}`}>
                            {producto.activo ? <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} /> : <Power className="w-3 h-3" strokeWidth={2.5} />}
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleEdit(producto)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" strokeWidth={2.2} />
                            </button>
                            <button
                              onClick={() => handleAjuste(producto)}
                              className="p-2 rounded-lg text-amber-600 hover:bg-amber-100 transition"
                              title="Ajustar stock"
                            >
                              <PackagePlus className="w-4 h-4" strokeWidth={2.2} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(producto.id)}
                                className={`p-2 rounded-lg transition
                                  ${producto.activo
                                    ? 'text-red-600 hover:bg-red-100'
                                    : 'text-green-600 hover:bg-green-100'}`}
                                title={producto.activo ? 'Desactivar' : 'Activar'}
                              >
                                <Power className="w-4 h-4" strokeWidth={2.2} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ MÓVIL: Cards ═══ */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {productosFiltrados.map((producto) => {
              const stockBajo = producto.stock <= producto.stockMinimo;
              return (
                <div
                  key={producto.id}
                  className={`bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden
                    transition active:scale-[0.995] ${!producto.activo ? 'opacity-60' : ''}`}
                >
                  {/* Cabecera clickeable */}
                  <button
                    type="button"
                    onClick={() => handleEdit(producto)}
                    className="w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50/60 active:bg-slate-100/60 transition"
                  >
                    {producto.imagen ? (
                      <img
                        src={getImageUrl(producto.imagen)}
                        alt={producto.nombre}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-800 leading-tight line-clamp-2">
                          {producto.nombre}
                        </p>
                        <span className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide
                          ${producto.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'}`}>
                          {producto.activo ? 'On' : 'Off'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {producto.tipoProducto && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                            <Layers className="w-2.5 h-2.5" strokeWidth={2.5} />
                            {producto.tipoProducto.nombre}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          #{producto.id}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Datos: stock / venta USD / venta Bs */}
                  <div className="grid grid-cols-3 gap-1 px-3 pb-3">
                    <div className={`rounded-lg p-2 text-center ${stockBajo ? 'bg-red-50' : 'bg-slate-50'}`}>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        Stock
                      </p>
                      <p className={`text-base font-bold tabular-nums flex items-center justify-center gap-0.5
                        ${stockBajo ? 'text-red-600' : 'text-slate-800'}`}>
                        {stockBajo && <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />}
                        {producto.stock}
                      </p>
                      <p className="text-[9px] text-slate-400 tabular-nums">mín {producto.stockMinimo}</p>
                    </div>
                    <div className="rounded-lg p-2 text-center bg-slate-50">
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        Venta $
                      </p>
                      <p className="text-base font-bold text-slate-800 tabular-nums">
                        ${producto.precioVenta}
                      </p>
                    </div>
                    <div className="rounded-lg p-2 text-center bg-slate-50">
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        Venta Bs
                      </p>
                      <p className="text-sm font-semibold text-slate-700 truncate tabular-nums">
                        {(producto.precioVenta * factorCambio).toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex border-t border-slate-100">
                    <button
                      onClick={() => handleEdit(producto)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Editar
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      onClick={() => handleAjuste(producto)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                                 text-amber-600 hover:bg-amber-50 active:bg-amber-100 transition"
                    >
                      <PackagePlus className="w-3.5 h-3.5" strokeWidth={2.3} />
                      Ajustar
                    </button>
                    {isAdmin && (
                      <>
                        <div className="w-px bg-slate-100" />
                        <button
                          onClick={() => handleDelete(producto.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition
                            ${producto.activo
                              ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                              : 'text-green-600 hover:bg-green-50 active:bg-green-100'}`}
                        >
                          <Power className="w-3.5 h-3.5" strokeWidth={2.3} />
                          {producto.activo ? 'Off' : 'On'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ Modal Producto ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
            <input
              {...register('nombre')}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`}
            />
            {errors.nombre && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
            <textarea
              {...register('descripcion')}
              rows="2"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         resize-none"
            />
          </div>

          <div>
            <ImageUploader
              value={imagen}
              onChange={(url) => setValue('imagen', url)}
              folder="producto"
              label="Imagen del producto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de producto</label>
            <select
              {...register('tipoProductoId', { setValueAs: (v) => (v === '' ? null : parseInt(v)) })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sin tipo</option>
              {tiposProducto.map((tp) => (
                <option key={tp.id} value={tp.id}>{tp.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock inicial</label>
              <input
                type="number"
                inputMode="numeric"
                {...register('stock', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.stock ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.stock && <p className="text-red-600 text-xs mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock mínimo</label>
              <input
                type="number"
                inputMode="numeric"
                {...register('stockMinimo', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.stockMinimo ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.stockMinimo && <p className="text-red-600 text-xs mt-1">{errors.stockMinimo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio costo ($)</label>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register('precioCosto', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.precioCosto ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.precioCosto && <p className="text-red-600 text-xs mt-1">{errors.precioCosto.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio venta ($)</label>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register('precioVenta', { valueAsNumber: true })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.precioVenta ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.precioVenta && <p className="text-red-600 text-xs mt-1">{errors.precioVenta.message}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                         hover:bg-slate-200 transition order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition disabled:opacity-50
                         inline-flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══ Modal Ajuste Stock ═══ */}
      <Modal
        isOpen={modalAjusteOpen}
        onClose={() => setModalAjusteOpen(false)}
        title="Ajustar Stock"
        size="sm"
      >
        <form onSubmit={handleSubmitAjuste(onSubmitAjuste)} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.2} />
              <p className="text-sm font-semibold text-slate-800 truncate">
                {selectedProducto?.nombre}
              </p>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Stock actual:{' '}
              <span className="font-semibold text-slate-800 tabular-nums">
                {selectedProducto?.stock}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Cantidad a ajustar
            </label>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" strokeWidth={2.5} />
              positivo para entrada
              <span className="mx-0.5">·</span>
              <TrendingDown className="w-3 h-3 text-red-600" strokeWidth={2.5} />
              negativo para salida
            </p>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              {...registerAjuste('cantidad', { valueAsNumber: true })}
              className={`w-full border rounded-lg px-3 py-3 text-center text-lg font-semibold tabular-nums
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errorsAjuste.cantidad ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="0"
            />
            {errorsAjuste.cantidad && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errorsAjuste.cantidad.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalAjusteOpen(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                         hover:bg-slate-200 transition order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition order-1 sm:order-2
                         inline-flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
              Ajustar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductosPage;