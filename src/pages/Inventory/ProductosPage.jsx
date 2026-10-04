// frontend/src/pages/Productos/ProductosPage.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  getProductos, createProducto, updateProducto, deleteProducto, ajustarStock,
} from '../../services/productoService';
import { getTiposProducto } from '../../services/crudCatalogoService';
import { getParametrosFactura } from '../../services/parametroFacturaService';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import ProductoForm from '../../components/forms/ProductoForm';
import SelectField from '../../components/common/SelectField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Package, PackagePlus, Pencil, Power, Search as SearchIcon,
  FileSpreadsheet, Plus, SlidersHorizontal, X, AlertTriangle,
  TrendingDown, TrendingUp, CheckCircle2, Layers, DollarSign,
  Boxes, Warehouse, Info, ArrowRight, Check, Minus,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SCHEMA AJUSTE
   ═══════════════════════════════════════════════════ */
const ajusteSchema = z.object({
  cantidad: z
    .number({ invalid_type_error: 'Ingresa un número' })
    .refine((val) => val !== 0, { message: 'La cantidad no puede ser 0' })
    .refine((val) => Math.abs(val) <= 999999, { message: 'Cantidad demasiado alta' }),
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
    register: registerAjuste,
    handleSubmit: handleSubmitAjuste,
    reset: resetAjuste,
    watch: watchAjuste,
    setValue: setValueAjuste,
    formState: { errors: errorsAjuste, isSubmitting: isSubmittingAjuste },
  } = useForm({ resolver: zodResolver(ajusteSchema), defaultValues: { cantidad: 0 } });

  const cantidadAjuste = watchAjuste('cantidad');

  /* ── Cargas ── */
  useEffect(() => { loadData(); cargarFactor(); /* eslint-disable-next-line */ }, [mostrarInactivos]);

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
    } catch {
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
    } catch {
      console.error('Error al cargar factor de cambio');
    }
  };

  /* ── Handlers ── */
  const handleNew = () => {
    setSelectedProducto(null);
    setModalOpen(true);
  };

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
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
    } catch {
      toast.error(`Error al ${accion} el producto`);
    }
  };

  const handleSubmitProducto = async (data) => {
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
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const onSubmitAjuste = async (data) => {
    try {
      await ajustarStock(selectedProducto.id, data.cantidad);
      toast.success(`Stock ajustado (${data.cantidad > 0 ? '+' : ''}${data.cantidad})`);
      setModalAjusteOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al ajustar stock');
    }
  };

  /* ── Filtrado ── */
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (filtroTipo && p.tipoProductoId !== parseInt(filtroTipo)) return false;
      if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (stockMin && p.stock < parseInt(stockMin)) return false;
      if (stockMax && p.stock > parseInt(stockMax)) return false;
      return true;
    });
  }, [productos, filtroTipo, searchTerm, stockMin, stockMax]);

  const hayFiltrosActivos = filtroTipo || searchTerm || stockMin || stockMax;

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setSearchTerm('');
    setStockMin('');
    setStockMax('');
  };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const activos = productos.filter((p) => p.activo);
    const sinStock = activos.filter((p) => p.stock === 0).length;
    const stockBajo = activos.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo).length;
    const valorInventario = activos.reduce((sum, p) => sum + (p.precioCosto * p.stock), 0);
    return {
      total: activos.length,
      sinStock,
      stockBajo,
      valorInventario,
    };
  }, [productos]);

  /* ── Opciones SelectField tipoProducto ── */
  const tipoProductoOptions = useMemo(
    () => tiposProducto.map((tp) => ({
      value: tp.id,
      label: tp.nombre,
      icon: Layers,
    })),
    [tiposProducto]
  );

  /* ── Export Excel ── */
  const exportToExcel = () => {
    if (productosFiltrados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['ID', 'Nombre', 'Tipo', 'Stock', 'Stock Mínimo', 'Precio Costo ($)', 'Precio Venta ($)', 'Precio Venta (Bs)', 'Activo'],
      ...productosFiltrados.map((p) => [
        p.id,
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-amber-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ PageHeader ═══ */}
      <PageHeader
        icon="📦"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Inventario' },
        ]}
        title="Inventario"
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Package className="w-3.5 h-3.5" strokeWidth={2.2} />
            {productosFiltrados.length} de {productos.length} producto{productos.length !== 1 && 's'}
            {hayFiltrosActivos && <span className="text-amber-600 font-medium"> (filtrados)</span>}
          </span>
        }
        actions={
          <>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center justify-center gap-1.5
                         bg-white text-slate-700 border border-slate-200
                         px-3 py-2 rounded-lg text-sm font-medium
                         hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" strokeWidth={2.2} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleNew}
              className="inline-flex items-center justify-center gap-1.5
                         bg-gradient-to-br from-amber-500 to-amber-600 text-white
                         px-3 py-2 rounded-lg text-sm font-semibold
                         hover:from-amber-600 hover:to-amber-700
                         active:from-amber-700 active:to-amber-800 transition
                         shadow-sm shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Nuevo producto
            </button>
          </>
        }
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/25 shrink-0">
          <Warehouse className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Control de inventario
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            Productos y existencias
          </p>
          <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0" strokeWidth={2.2} />
            Precios en USD · Mostrando conversión a Bs. con factor {factorCambio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <StatCard
          icon={Package}
          label="Total activos"
          value={stats.total}
          tone="slate"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock bajo"
          value={stats.stockBajo}
          tone="amber"
        />
        <StatCard
          icon={X}
          label="Sin stock"
          value={stats.sinStock}
          tone="red"
        />
        <StatCard
          icon={DollarSign}
          label="Valor inventario"
          value={`$${stats.valorInventario.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          tone="emerald"
        />
      </div>

      {/* ═══ Filtros ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4">
        {/* Buscador + toggle mobile */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2.2}
            />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                           text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Limpiar"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFiltrosAbiertos((o) => !o)}
            className="sm:hidden relative inline-flex items-center justify-center gap-1.5 px-3 py-2.5
                       border border-slate-300 rounded-lg text-sm text-slate-700 bg-white
                       hover:bg-slate-50 transition"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2.2} />
            <span>Filtros</span>
            {hayFiltrosActivos && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filtros adicionales */}
        <div className={`${filtrosAbiertos ? 'grid' : 'hidden'} sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3`}>
          {/* Tipo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
              Tipo
            </label>
            <SelectField
              value={filtroTipo ? parseInt(filtroTipo) : ''}
              onChange={(v) => setFiltroTipo(v === '' ? '' : String(v))}
              options={tipoProductoOptions}
              placeholder="Todos los tipos"
              tone="amber"
              searchable={tiposProducto.length > 8}
            />
          </div>

          {/* Stock mínimo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
              Stock mínimo
            </label>
            <div className="relative">
              <Boxes
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                strokeWidth={2.2}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Ej: 5"
                value={stockMin}
                onChange={(e) => setStockMin(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Stock máximo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
              Stock máximo
            </label>
            <div className="relative">
              <Boxes
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                strokeWidth={2.2}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Ej: 100"
                value={stockMax}
                onChange={(e) => setStockMax(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Toggle inactivos + limpiar */}
          <div className="flex items-end justify-between gap-2">
            {isAdmin && (
              <label className="inline-flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg
                                 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 transition
                                 whitespace-nowrap select-none flex-1">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                />
                <span>Ver inactivos</span>
              </label>
            )}
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs text-red-600 hover:text-red-700 font-semibold whitespace-nowrap
                           inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition"
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
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <Package className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {hayFiltrosActivos
              ? 'No hay productos que coincidan con los filtros'
              : 'Aún no hay productos registrados'}
          </p>
          {!hayFiltrosActivos && (
            <button
              onClick={handleNew}
              className="mt-3 text-amber-600 hover:text-amber-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Crear el primero
            </button>
          )}
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="mt-3 text-amber-600 hover:text-amber-800 text-sm font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              Limpiar filtros
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
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Costo</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Venta $</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Venta Bs</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productosFiltrados.map((producto) => {
                    const stockBajo = producto.stock <= producto.stockMinimo;
                    const sinStock = producto.stock === 0;
                    return (
                      <tr
                        key={producto.id}
                        onClick={() => handleEdit(producto)}
                        className={`cursor-pointer transition group
                          ${!producto.activo ? 'opacity-50' : ''}
                          hover:bg-amber-50/40`}
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
                              <p className="font-medium text-sm text-slate-800 truncate max-w-[220px]">
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
                            ${sinStock
                              ? 'bg-red-100 text-red-700'
                              : stockBajo
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'}`}>
                            {(sinStock || stockBajo) && <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />}
                            {producto.stock}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">mín {producto.stockMinimo}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500 tabular-nums">
                          ${Number(producto.precioCosto).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800 tabular-nums">
                          ${Number(producto.precioVenta).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500 tabular-nums">
                          Bs. {(producto.precioVenta * factorCambio).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                            ${producto.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'}`}>
                            {producto.activo ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                                Activo
                              </>
                            ) : (
                              <>
                                <Power className="w-3 h-3" strokeWidth={2.5} />
                                Inactivo
                              </>
                            )}
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
                                    : 'text-emerald-600 hover:bg-emerald-100'}`}
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
              const sinStock = producto.stock === 0;
              return (
                <div
                  key={producto.id}
                  className={`bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden
                    transition active:scale-[0.995] ${!producto.activo ? 'opacity-60' : ''}`}
                >
                  {/* Header clickeable */}
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
                            ? 'bg-emerald-100 text-emerald-700'
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

                  {/* Datos */}
                  <div className="grid grid-cols-3 gap-1 px-3 pb-3">
                    <div className={`rounded-lg p-2 text-center ${
                      sinStock
                        ? 'bg-red-50'
                        : stockBajo
                        ? 'bg-amber-50'
                        : 'bg-slate-50'
                    }`}>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        Stock
                      </p>
                      <p className={`text-base font-bold tabular-nums flex items-center justify-center gap-0.5
                        ${sinStock ? 'text-red-600' : stockBajo ? 'text-amber-600' : 'text-slate-800'}`}>
                        {(sinStock || stockBajo) && <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />}
                        {producto.stock}
                      </p>
                      <p className="text-[9px] text-slate-400 tabular-nums">mín {producto.stockMinimo}</p>
                    </div>
                    <div className="rounded-lg p-2 text-center bg-slate-50">
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        Venta $
                      </p>
                      <p className="text-base font-bold text-slate-800 tabular-nums">
                        ${Number(producto.precioVenta).toFixed(2)}
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
                              : 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'}`}
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

      {/* ═══ Modal: Crear/Editar Producto ═══ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <ProductoForm
          initialData={selectedProducto}
          onSave={handleSubmitProducto}
          onCancel={() => setModalOpen(false)}
          vacunas={[]}
        />
      </Modal>

      {/* ═══ Modal: Ajustar Stock ═══ */}
      <Modal
        isOpen={modalAjusteOpen}
        onClose={() => setModalAjusteOpen(false)}
        title="Ajustar Stock"
        size="sm"
      >
        <form onSubmit={handleSubmitAjuste(onSubmitAjuste)} className="space-y-4">
          {/* Info del producto */}
          {selectedProducto && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-white border border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Package className="w-4.5 h-4.5 text-amber-600" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {selectedProducto.nombre}
                  </p>
                  <p className="text-[11px] text-amber-700 tabular-nums">
                    Stock actual: <span className="font-bold">{selectedProducto.stock}</span> unidades
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ayuda */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" strokeWidth={2.2} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-900">
                Ingresa una cantidad
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Usa números positivos para agregar stock o negativos para descontar.
              </p>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
              Cantidad a ajustar
            </label>

            {/* Botones rápidos */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {[-10, -1, +1, +10].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setValueAjuste('cantidad', (Number(cantidadAjuste) || 0) + val, { shouldValidate: true })}
                  className={`inline-flex items-center justify-center gap-0.5 min-w-[52px] px-2.5 py-1.5 rounded-lg
                             text-xs font-bold tabular-nums border transition
                    ${val > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                >
                  {val > 0 ? '+' : ''}{val}
                </button>
              ))}
            </div>

            {/* Input con +/- */}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => setValueAjuste('cantidad', (Number(cantidadAjuste) || 0) - 1, { shouldValidate: true })}
                className="w-12 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100
                           active:bg-red-200 transition flex items-center justify-center"
              >
                <Minus className="w-4 h-4" strokeWidth={3} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                {...registerAjuste('cantidad', { valueAsNumber: true })}
                className={`flex-1 border rounded-lg px-3 py-3 text-center text-xl font-bold tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${errorsAjuste.cantidad ? 'border-red-400' : 'border-slate-300'}`}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setValueAjuste('cantidad', (Number(cantidadAjuste) || 0) + 1, { shouldValidate: true })}
                className="w-12 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600
                           hover:bg-emerald-100 active:bg-emerald-200 transition flex items-center justify-center"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>

            {errorsAjuste.cantidad && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errorsAjuste.cantidad.message}
              </p>
            )}

            {/* Preview del nuevo stock */}
            {selectedProducto && Number(cantidadAjuste) !== 0 && !errorsAjuste.cantidad && (
              <div className={`mt-3 p-2.5 rounded-lg border text-center ${
                Number(cantidadAjuste) > 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${
                  Number(cantidadAjuste) > 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  Nuevo stock
                </p>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <span className="text-sm text-slate-500 tabular-nums line-through">
                    {selectedProducto.stock}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} />
                  <span className={`text-xl font-bold tabular-nums ${
                    Number(cantidadAjuste) > 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {selectedProducto.stock + Number(cantidadAjuste)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalAjusteOpen(false)}
              disabled={isSubmittingAjuste}
              className="inline-flex items-center justify-center gap-2
                         px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                         hover:bg-slate-200 active:bg-slate-300 transition
                         order-2 sm:order-1 disabled:opacity-50"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingAjuste || Number(cantidadAjuste) === 0}
              className="inline-flex items-center justify-center gap-2
                         px-5 py-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white
                         rounded-lg text-sm font-semibold
                         hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800
                         transition order-1 sm:order-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-sm shadow-amber-600/25"
            >
              {isSubmittingAjuste ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                  Ajustando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  Ajustar stock
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   StatCard
   ═══════════════════════════════════════════════════ */
const StatCard = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const toneCls = {
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200/60',   iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   value: 'text-slate-800' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200/60',   iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   value: 'text-amber-700' },
    red:     { bg: 'bg-red-50',     border: 'border-red-200/60',     iconBg: 'bg-red-100',     iconText: 'text-red-600',     value: 'text-red-700' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200/60', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', value: 'text-emerald-700' },
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
          <p className={`text-lg sm:text-2xl font-bold ${toneCls.value} mt-0.5 tabular-nums truncate`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductosPage;