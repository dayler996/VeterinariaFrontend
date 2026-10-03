import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import { getClientes } from '../../services/clienteService';
import { getProductos } from '../../services/productoService';
import { getTiposEstudio, getTiposOperacion, getTiposEstetica, getCategorias, getTiposProducto } from '../../services/crudCatalogoService';
import { getParametrosFactura } from '../../services/parametroFacturaService';
import { createFactura } from '../../services/facturaService';
import { useAuth } from '../../context/AuthContext';
import { generateFacturaPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';
import { METODOS_PAGO } from '../../constants/metodosPago';

const itemSchema = z.object({
  tipo: z.enum(['producto', 'estudio', 'operacion', 'estetica']),
  id: z.number().optional(),
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.number().min(1),
  precioUnit: z.number().positive(),
  productoId: z.number().optional(),
  mascotaId: z.number().optional(),
  categoriaId: z.number().optional(),
  tipoProductoId: z.number().optional(),
});

const facturaSchema = z.object({
  clienteId: z.number({ required_error: 'Cliente requerido' }),
  vendedorId: z.number(),
  detalles: z.array(itemSchema).min(1, 'Agregue al menos un detalle'),
  iva: z.boolean().default(false),
  montoPagado: z.number().min(0).default(0),
  metodoPago: z.string().optional(),
});

const NuevaFacturaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendedorId = user?.trabajador?.id || 1;

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [estudios, setEstudios] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [serviciosEstetica, setServiciosEstetica] = useState([]);
  const [categoriasEstudio, setCategoriasEstudio] = useState([]);
  const [categoriasOperacion, setCategoriasOperacion] = useState([]);
  const [categoriasEstetica, setCategoriasEstetica] = useState([]);
  const [factorCambio, setFactorCambio] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erroresStock, setErroresStock] = useState({});

  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      detalles: [{ tipo: 'producto', descripcion: '', cantidad: 1, precioUnit: 0 }],
      montoPagado: 0,
      vendedorId,
      iva: false,
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });

  const detalles = watch('detalles');
  const ivaActivo = watch('iva');

  const subtotal = detalles.reduce((acc, item) => acc + (item.cantidad * item.precioUnit || 0), 0);
  const impuestos = ivaActivo ? subtotal * 0.16 : 0;
  const total = subtotal + impuestos;
  const saldoPendiente = total - (watch('montoPagado') || 0);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Verificar stock
  useEffect(() => {
    const nuevosErrores = {};
    detalles.forEach((det, index) => {
      if (det.productoId && det.cantidad) {
        const producto = productos.find(p => p.id === det.productoId);
        if (producto && det.cantidad > producto.stock) {
          nuevosErrores[index] = `Stock disponible: ${producto.stock}`;
        }
      }
    });
    setErroresStock(nuevosErrores);
  }, [detalles, productos]);

  const cargarDatosIniciales = async () => {
    try {
      const [
        cliRes,
        prodRes,
        tiposProdRes,
        estRes,
        opRes,
        estetRes,
        catEstudioRes,
        catOperacionRes,
        catEsteticaRes,
        paramRes
      ] = await Promise.all([
        getClientes(),
        getProductos(),
        getTiposProducto().catch(() => ({ data: [] })),
        getTiposEstudio(),
        getTiposOperacion(),
        getTiposEstetica(),
        getCategorias({ tipo: 'estudio' }),
getCategorias({ tipo: 'operacion' }),
getCategorias({ tipo: 'estetica' }),
        getParametrosFactura().catch(() => ({ data: {} })),
      ]);
      setClientes(cliRes.data);
      setProductos(prodRes.data);
      setTiposProducto(tiposProdRes.data || []);
      setEstudios(estRes.data);
      setOperaciones(opRes.data);
      setServiciosEstetica(estetRes.data);
      setCategoriasEstudio(catEstudioRes.data);
      setCategoriasOperacion(catOperacionRes.data);
      setCategoriasEstetica(catEsteticaRes.data);
      const factor = paramRes.data?.factor_cambio;
      if (factor) setFactorCambio(parseFloat(factor));
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const buscarClientePorCedula = async () => {
    if (!cedulaBusqueda.trim()) {
      toast.error('Ingrese una cédula');
      return;
    }
    setBuscandoCliente(true);
    try {
      const res = await getClientes({ search: cedulaBusqueda });
      const encontrados = res.data;
      if (encontrados.length === 0) {
        toast.error('Cliente no encontrado');
        setClienteEncontrado(null);
        setValue('clienteId', undefined);
      } else {
        const cliente = encontrados[0];
        setClienteEncontrado(cliente);
        setValue('clienteId', cliente.id);
        toast.success(`Cliente: ${cliente.nombre}`);
      }
    } catch (error) {
      toast.error('Error al buscar cliente');
    } finally {
      setBuscandoCliente(false);
    }
  };

  const limpiarCliente = () => {
    setClienteEncontrado(null);
    setCedulaBusqueda('');
    setValue('clienteId', undefined);
  };

  const handleAgregarItem = (tipo) => {
    append({ tipo, descripcion: '', cantidad: 1, precioUnit: 0 });
  };

  const handleProductoChange = (index, selectedOption) => {
    if (selectedOption) {
      const producto = productos.find(p => p.id === selectedOption.value);
      setValue(`detalles.${index}.descripcion`, producto.nombre);
      setValue(`detalles.${index}.precioUnit`, parseFloat(producto.precioVenta));
      setValue(`detalles.${index}.productoId`, producto.id);
      setValue(`detalles.${index}.tipoProductoId`, producto.tipoProductoId);
    } else {
      setValue(`detalles.${index}.descripcion`, '');
      setValue(`detalles.${index}.precioUnit`, 0);
      setValue(`detalles.${index}.productoId`, undefined);
      setValue(`detalles.${index}.tipoProductoId`, undefined);
    }
  };

  const handleServicioChange = (index, tipo, servicioId) => {
    if (!servicioId) {
      setValue(`detalles.${index}.descripcion`, '');
      setValue(`detalles.${index}.precioUnit`, 0);
      setValue(`detalles.${index}.id`, undefined);
      return;
    }
    let servicio;
    if (tipo === 'estudio') servicio = estudios.find(e => e.id === parseInt(servicioId));
    else if (tipo === 'operacion') servicio = operaciones.find(o => o.id === parseInt(servicioId));
    else servicio = serviciosEstetica.find(s => s.id === parseInt(servicioId));

    if (servicio) {
      setValue(`detalles.${index}.descripcion`, servicio.nombre);
      setValue(`detalles.${index}.precioUnit`, parseFloat(servicio.precioVenta || 0));
      setValue(`detalles.${index}.id`, servicio.id);
    }
  };

  const handleCategoriaChange = (index, tipo, catId) => {
    setValue(`detalles.${index}.categoriaId`, catId ? parseInt(catId) : null);
    // Al cambiar categoría, limpiamos el servicio seleccionado
    setValue(`detalles.${index}.id`, undefined);
    setValue(`detalles.${index}.descripcion`, '');
    setValue(`detalles.${index}.precioUnit`, 0);
  };

  const handleTipoProductoChange = (index, tipoProdId) => {
    setValue(`detalles.${index}.tipoProductoId`, tipoProdId ? parseInt(tipoProdId) : null);
  };

  const getServiciosFiltrados = (tipo, categoriaId) => {
    let lista = [];
    if (tipo === 'estudio') lista = estudios;
    else if (tipo === 'operacion') lista = operaciones;
    else if (tipo === 'estetica') lista = serviciosEstetica;

    if (!categoriaId) return lista;
    return lista.filter(s => s.categoriaId === parseInt(categoriaId));
  };

  const getProductosFiltrados = (tipoProductoId) => {
    if (!tipoProductoId) return productos;
    return productos.filter(p => p.tipoProductoId === parseInt(tipoProductoId));
  };

  const productoOptions = useMemo(() => {
    return productos.map(p => ({
      value: p.id,
      label: `${p.nombre} - $${p.precioVenta}`,
    }));
  }, [productos]);

  const onSubmit = async (data) => {
    try {
      const response = await createFactura(data);
      const factura = response.data;
      toast.success('Factura creada');

      const detalles = factura.detalles || [];

      const sections = [
        {
          title: 'Información de la Factura',
          type: 'keyValue',
          content: [
            ['Número', factura.numero],
            ['Fecha', new Date(factura.fecha).toLocaleString()],
            ['Cliente', factura.cliente?.nombre],
            ['Cédula', factura.cliente?.cedula],
            ['Vendedor', factura.vendedor?.nombre],
          ],
        },
        {
          title: 'Detalle',
          type: 'table',
          headers: ['Descripción', 'Cantidad', 'Precio Unit.'],
          data: detalles.map(d => [
            d.descripcion,
            d.cantidad,
            `$${d.precioUnit}`,
          ]),
        },
        {
          title: 'Totales',
          type: 'keyValue',
          content: [
            ['Subtotal', `$${factura.subtotal}`],
            ['Impuestos', `$${factura.impuestos}`],
            ['Total', `$${factura.total}`],
            ['Monto Pagado', `$${factura.montoPagado}`],
            ['Saldo Pendiente', `$${factura.saldoPendiente}`],
            ['Estado', factura.estadoPago],
          ],
        },
      ];

      await generateFacturaPDF('Factura', sections);
      navigate('/facturacion');
    } catch (error) {
      console.error('Error al crear factura:', error);
      if (error.response?.data?.detalles) {
        toast.error(error.response.data.error);
        error.response.data.detalles.forEach(err => {
          toast.error(`${err.nombre}: disponible ${err.disponible}, solicitado ${err.solicitado}`);
        });
      } else {
        toast.error('Error al crear factura');
      }
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nueva Factura</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Cliente</h2>
          {!clienteEncontrado ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Cédula del cliente"
                value={cedulaBusqueda}
                onChange={(e) => setCedulaBusqueda(e.target.value)}
                className="flex-1 border rounded p-2"
              />
              <button
                type="button"
                onClick={buscarClientePorCedula}
                disabled={buscandoCliente}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {buscandoCliente ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="font-semibold">{clienteEncontrado.nombre} - {clienteEncontrado.cedula}</span>
              <button
                type="button"
                onClick={limpiarCliente}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}
          <input type="hidden" {...register('clienteId')} />
        </div>

        {/* Detalles de factura */}
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <div className="flex flex-wrap justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Detalles</h2>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => handleAgregarItem('producto')} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">+ Producto</button>
              <button type="button" onClick={() => handleAgregarItem('estudio')} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">+ Estudio</button>
              <button type="button" onClick={() => handleAgregarItem('operacion')} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">+ Operación</button>
              <button type="button" onClick={() => handleAgregarItem('estetica')} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">+ Estética</button>
            </div>
          </div>

          {/* Encabezados de la tabla */}
          <div className="hidden sm:grid grid-cols-12 gap-2 mb-2 px-2 font-semibold text-gray-700">
            <div className="col-span-3">Producto/Servicio</div>
            <div className="col-span-3">Descripción</div>
            <div className="col-span-1">Cant.</div>
            <div className="col-span-2">Precio Unit.</div>
            <div className="col-span-2">Subtotal</div>
            <div className="col-span-1">Acción</div>
          </div>

          {fields.map((field, index) => {
            const tipo = field.tipo;
            const categoriaSeleccionada = watch(`detalles.${index}.categoriaId`);
            const tipoProductoSeleccionado = watch(`detalles.${index}.tipoProductoId`);
            const serviciosFiltrados = getServiciosFiltrados(tipo, categoriaSeleccionada);
            const productosFiltrados = getProductosFiltrados(tipoProductoSeleccionado);
            const productoId = watch(`detalles.${index}.productoId`);

            // Para servicios, preparamos opciones para react-select
            const serviciosOptions = serviciosFiltrados.map(s => ({
              value: s.id,
              label: s.nombre,
              precio: s.precioVenta || 0
            }));
            const selectedServicio = serviciosFiltrados.find(s => s.id === watch(`detalles.${index}.id`));

            return (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 p-2 border rounded items-center">
                {/* Producto/Servicio */}
                <div className="sm:col-span-3">
                  {tipo === 'producto' ? (
                    <div className="space-y-1">
                      <select
                        className="w-full border rounded p-2 text-sm"
                        onChange={(e) => handleTipoProductoChange(index, e.target.value)}
                        value={tipoProductoSeleccionado || ''}
                      >
                        <option value="">Todos los tipos</option>
                        {tiposProducto.map(tp => (
                          <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                        ))}
                      </select>
                      <Select
                        options={productosFiltrados.map(p => ({
                          value: p.id,
                          label: `${p.nombre} - $${p.precioVenta}`,
                        }))}
                        value={productoId ? { value: productoId, label: watch(`detalles.${index}.descripcion`) } : null}
                        onChange={(selected) => handleProductoChange(index, selected)}
                        isClearable
                        placeholder="Buscar o seleccionar producto..."
                        noOptionsMessage={() => "No hay productos"}
                        className="text-sm"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        maxMenuHeight={200}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* Select de categoría */}
                      <select
                        className="w-full border rounded p-2 text-sm"
                        onChange={(e) => handleCategoriaChange(index, tipo, e.target.value)}
                        value={categoriaSeleccionada || ''}
                      >
                        <option value="">Todas las categorías</option>
                        {tipo === 'estudio' && categoriasEstudio.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                        {tipo === 'operacion' && categoriasOperacion.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                        {tipo === 'estetica' && categoriasEstetica.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                      {/* Select de servicio con búsqueda */}
                      <Select
                        options={serviciosOptions}
                        value={selectedServicio ? { value: selectedServicio.id, label: selectedServicio.nombre } : null}
                        onChange={(selected) => handleServicioChange(index, tipo, selected ? selected.value : null)}
                        isClearable
                        placeholder="Seleccionar o buscar servicio..."
                        noOptionsMessage={() => "No hay servicios"}
                        className="text-sm"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        maxMenuHeight={200}
                      />
                    </div>
                  )}
                </div>

                {/* Descripción */}
                <div className="sm:col-span-3">
                  <input
                    {...register(`detalles.${index}.descripcion`)}
                    placeholder="Descripción"
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>

                {/* Cantidad */}
                <div className="sm:col-span-1">
                  <input
                    {...register(`detalles.${index}.cantidad`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="Cant."
                    className="w-full border rounded p-2 text-sm"
                  />
                  {erroresStock[index] && (
                    <p className="text-red-600 text-xs mt-1">{erroresStock[index]}</p>
                  )}
                </div>

                {/* Precio Unitario */}
                <div className="sm:col-span-2">
                  <input
                    {...register(`detalles.${index}.precioUnit`, { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>

                {/* Subtotal */}
                <div className="sm:col-span-2 text-right font-medium">
                  ${(watch(`detalles.${index}.cantidad`) * watch(`detalles.${index}.precioUnit`) || 0).toFixed(2)}
                </div>

                {/* Acción */}
                <div className="sm:col-span-1 text-right">
                  <button type="button" onClick={() => remove(index)} className="text-red-600 hover:text-red-800">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          {errors.detalles && <p className="text-red-600 mt-2">{errors.detalles.message}</p>}
        </div>

        {/* Totales y pago */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex flex-col items-end">
            <div className="w-full sm:w-64 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal (USD):</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>IVA (16%):</span>
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register('iva')} id="iva" />
                  <label htmlFor="iva" className="text-sm">Aplicar IVA</label>
                </div>
              </div>
              {ivaActivo && (
                <div className="flex justify-between text-gray-600">
                  <span>Impuestos:</span>
                  <span>${impuestos.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total (USD):</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total (Bs):</span>
                <span>Bs. {(total * factorCambio).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <label className="block text-sm font-medium">Monto pagado hoy (USD)</label>
            <input
              {...register('montoPagado', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="mt-1 block w-full sm:w-64 border rounded p-2"
            />
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium">Método de pago</label>
            <select {...register('metodoPago')} className="mt-1 block w-full sm:w-64 border rounded p-2">
              <option value="">Seleccione</option>
              {METODOS_PAGO.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-right">
            <span className="font-semibold">Saldo pendiente: ${saldoPendiente.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/facturacion')} className="px-4 py-2 bg-gray-300 rounded">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={Object.keys(erroresStock).length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Generar Factura
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaFacturaPage;