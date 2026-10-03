import { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto, ajustarStock } from '../../services/productoService';
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
  cantidad: z.number().refine(val => val !== 0, { message: 'Cantidad no puede ser 0' }),
});

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

  // Nuevos estados para filtros dinámicos
  const [searchTerm, setSearchTerm] = useState('');
  const [stockMin, setStockMin] = useState('');
  const [stockMax, setStockMax] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: { stock: 0, stockMinimo: 5 }
  });

  const imagen = watch('imagen');

  const {
    register: registerAjuste,
    handleSubmit: handleSubmitAjuste,
    reset: resetAjuste,
    formState: { errors: errorsAjuste }
  } = useForm({ resolver: zodResolver(ajusteSchema) });

  useEffect(() => {
    loadData();
    cargarFactor();
  }, [mostrarInactivos]);

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
    const producto = productos.find(p => p.id === id);
    const accion = producto.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este producto?`)) return;
    try {
      if (producto.activo) {
        await deleteProducto(id);
      } else {
        await updateProducto(id, { ...producto, activo: true });
      }
      toast.success(`Producto Activado`);
      loadData();
    } catch (error) {
      toast.error(`Error al Desactivar el producto`);
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

  // Aplicar filtros locales
  const productosFiltrados = productos.filter(p => {
    if (filtroTipo && p.tipoProductoId !== parseInt(filtroTipo)) return false;
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (stockMin && p.stock < parseInt(stockMin)) return false;
    if (stockMax && p.stock > parseInt(stockMax)) return false;
    return true;
  });

  const exportToExcel = () => {
    if (productosFiltrados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [
      ['ID', 'Imagen', 'Nombre', 'Tipo', 'Stock', 'Stock Mínimo', 'Precio Costo ($)', 'Precio Venta ($)', 'Precio Venta (Bs)', 'Activo'],
      ...productosFiltrados.map(p => [
        p.id,
        p.imagen || '—',
        p.nombre,
        p.tipoProducto?.nombre || '—',
        p.stock,
        p.stockMinimo,
        p.precioCosto,
        p.precioVenta,
        (p.precioVenta * factorCambio).toFixed(2),
        p.activo ? 'Sí' : 'No'
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, `inventario_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Todos los tipos</option>
            {tiposProducto.map(tp => (
              <option key={tp.id} value={tp.id}>{tp.nombre}</option>
            ))}
          </select>
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
              />
              Mostrar inactivos
            </label>
          )}
          <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros dinámicos */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded p-2 flex-1"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Stock min"
            value={stockMin}
            onChange={(e) => setStockMin(e.target.value)}
            className="border rounded p-2 w-24"
          />
          <input
            type="number"
            placeholder="Stock max"
            value={stockMax}
            onChange={(e) => setStockMax(e.target.value)}
            className="border rounded p-2 w-24"
          />
        </div>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Exportar a Excel
        </button>
      </div>

      {/* Tabla responsiva */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">ID</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Stock Mínimo</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Precio Costo ($)</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta ($)</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Precio Venta (Bs)</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productosFiltrados.map((producto) => (
              <tr key={producto.id} onClick={() => handleEdit(producto)} className={`cursor-pointer hover:bg-gray-50 ${!producto.activo ? 'opacity-50 line-through' : ''}`}>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">{producto.id}</td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {producto.imagen ? (
                    <img src={getImageUrl(producto.imagen)} alt={producto.nombre} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded" />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900">{producto.nombre}</td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{producto.tipoProducto?.nombre || '—'}</td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm">
                  <span className={producto.stock <= producto.stockMinimo ? 'text-red-600 font-bold' : 'text-gray-900'}>
                    {producto.stock}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{producto.stockMinimo}</td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">${producto.precioCosto}</td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900">${producto.precioVenta}</td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">Bs. {(producto.precioVenta * factorCambio).toFixed(2)}</td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEdit(producto)} className="text-yellow-600 hover:text-yellow-800 text-left">Editar</button>
                    <button onClick={() => handleAjuste(producto)} className="text-blue-600 hover:text-blue-800 text-left">Ajustar</button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(producto.id)} className={producto.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}>
                        {producto.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Producto */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
            {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <textarea {...register('descripcion')} rows="2" className="mt-1 block w-full border rounded p-2" />
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
            <label className="block text-sm font-medium">Tipo de producto</label>
            <select
              {...register('tipoProductoId', { setValueAs: v => v === '' ? null : parseInt(v) })}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Sin tipo</option>
              {tiposProducto.map(tp => (
                <option key={tp.id} value={tp.id}>{tp.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Stock Inicial</label>
            <input type="number" {...register('stock', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
            {errors.stock && <p className="text-red-600 text-sm">{errors.stock.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Stock Mínimo</label>
            <input type="number" {...register('stockMinimo', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
            {errors.stockMinimo && <p className="text-red-600 text-sm">{errors.stockMinimo.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Precio Costo ($)</label>
            <input type="number" step="0.01" {...register('precioCosto', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
            {errors.precioCosto && <p className="text-red-600 text-sm">{errors.precioCosto.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Precio Venta ($)</label>
            <input type="number" step="0.01" {...register('precioVenta', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
            {errors.precioVenta && <p className="text-red-600 text-sm">{errors.precioVenta.message}</p>}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajuste Stock */}
      <Modal isOpen={modalAjusteOpen} onClose={() => setModalAjusteOpen(false)} title="Ajustar Stock">
        <form onSubmit={handleSubmitAjuste(onSubmitAjuste)} className="space-y-4">
          <p className="text-sm">Producto: <span className="font-semibold">{selectedProducto?.nombre}</span></p>
          <p className="text-sm">Stock actual: <span className="font-semibold">{selectedProducto?.stock}</span></p>
          <div>
            <label className="block text-sm font-medium">
              Cantidad (positivo para entrada, negativo para salida)
            </label>
            <input type="number" {...registerAjuste('cantidad', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
            {errorsAjuste.cantidad && <p className="text-red-600 text-sm">{errorsAjuste.cantidad.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalAjusteOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Ajustar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductosPage;