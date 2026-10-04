import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import {
  Package, Microscope, Stethoscope, Scissors,
  Search as SearchIcon, Plus, Minus, Trash2,
  ShoppingCart, UserPlus, UserCheck, AlertTriangle,
  Layers, Tag,
} from 'lucide-react';
import { getClientes, createCliente, reactivarCliente } from '../../services/clienteService';
import { getProductos } from '../../services/productoService';
import {
  getTiposEstudio, getTiposOperacion, getTiposEstetica,
  getCategorias, getTiposProducto,
} from '../../services/crudCatalogoService';
import { getParametrosFactura } from '../../services/parametroFacturaService';
import { createFactura } from '../../services/facturaService';
import { useAuth } from '../../context/AuthContext';
import { generateFacturaPDF } from '../../services/pdfService';
import ClienteForm from '../../components/forms/ClienteForm';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { METODOS_PAGO } from '../../constants/metodosPago';

/* ── Schemas ── */
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

/* ── Config visual por tipo ── */
const tipoConfig = {
  producto: {
    label: 'Producto',
    pluralLabel: 'Productos',
    icon: Package,
    color: 'bg-blue-100 text-blue-700',
    activeColor: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25',
  },
  estudio: {
    label: 'Estudio',
    pluralLabel: 'Estudios',
    icon: Microscope,
    color: 'bg-purple-100 text-purple-700',
    activeColor: 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/25',
  },
  operacion: {
    label: 'Operación',
    pluralLabel: 'Operaciones',
    icon: Stethoscope,
    color: 'bg-orange-100 text-orange-700',
    activeColor: 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/25',
  },
  estetica: {
    label: 'Estética',
    pluralLabel: 'Estética',
    icon: Scissors,
    color: 'bg-pink-100 text-pink-700',
    activeColor: 'bg-pink-600 text-white border-pink-600 shadow-sm shadow-pink-600/25',
  },
};

/* ── estilos comunes react-select ── */
const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '46px',
    fontSize: '14px',
    borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
    '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#94a3b8' },
    borderRadius: '10px',
    backgroundColor: 'white',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({
    ...base,
    fontSize: '13px',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px -10px rgba(15,23,42,0.25)',
    border: '1px solid #e2e8f0',
  }),
  menuList: (base) => ({ ...base, padding: '4px' }),
  group: (base) => ({ ...base, paddingTop: 6, paddingBottom: 6 }),
  groupHeading: (base) => ({
    ...base,
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#64748b',
    paddingLeft: 8,
    paddingBottom: 4,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#eff6ff' : 'transparent',
    color: state.isFocused ? '#1e40af' : '#334155',
    cursor: 'pointer',
    borderRadius: '8px',
    padding: '8px 10px',
  }),
  placeholder: (base) => ({ ...base, color: '#94a3b8' }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: '#e2e8f0' }),
};

/* Compacto para los sub-filtros */
const compactSelectStyles = {
  ...selectStyles,
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    fontSize: '13px',
    borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
    '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#94a3b8' },
    borderRadius: '10px',
    backgroundColor: 'white',
  }),
};

/* ═══════════════════════════════════════════════════════════════════ */
const NuevaFacturaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendedorId = user?.trabajador?.id || 1;
  const isAdmin = user?.rol?.nombre === 'ADMIN';

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

  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [cedulaNoEncontrada, setCedulaNoEncontrada] = useState(null);
  const [clienteInactivo, setClienteInactivo] = useState(null);
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  /* Buscador carrito */
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');   // guardamos el value (id string)
  const [tipoProdFiltro, setTipoProdFiltro] = useState('');     // idem
  const [busqueda, setBusqueda] = useState(null);
  const [inputValue, setInputValue] = useState('');             // texto escrito en el buscador
  const buscadorRef = useRef(null);

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      detalles: [],
      montoPagado: 0,
      vendedorId,
      iva: false,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });

  const detalles = watch('detalles') || [];
  const ivaActivo = watch('iva');
  const montoPagado = watch('montoPagado') || 0;

  const subtotal = detalles.reduce((acc, item) => acc + (item.cantidad * item.precioUnit || 0), 0);
  const impuestos = ivaActivo ? subtotal * 0.16 : 0;
  const total = subtotal + impuestos;
  const saldoPendiente = total - montoPagado;
  const excedeTotal = montoPagado > total;

  useEffect(() => {
    if (!isAdmin && total > 0) {
      setValue('montoPagado', parseFloat(total.toFixed(2)));
    }
  }, [total, isAdmin, setValue]);

  useEffect(() => { cargarDatosIniciales(); }, []);

  useEffect(() => {
    const nuevosErrores = {};
    detalles.forEach((det, index) => {
      if (det.productoId && det.cantidad) {
        const producto = productos.find((p) => p.id === det.productoId);
        if (producto && det.cantidad > producto.stock) {
          nuevosErrores[index] = `Stock: ${producto.stock}`;
        }
      }
    });
    setErroresStock(nuevosErrores);
  }, [detalles, productos]);

  const cargarDatosIniciales = async () => {
    try {
      const [
        , prodRes, tiposProdRes, estRes, opRes, estetRes,
        catEstudioRes, catOperacionRes, catEsteticaRes, paramRes,
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

  /* ═══════════════════════════════════════════════════════════
     OPCIONES DEL BUSCADOR — agrupadas por tipo
     ═══════════════════════════════════════════════════════════ */
  const opcionesAgrupadas = useMemo(() => {
    const groups = [];

    const incluirProducto = tipoFiltro === 'todos' || tipoFiltro === 'producto';
    const incluirEstudio = tipoFiltro === 'todos' || tipoFiltro === 'estudio';
    const incluirOperacion = tipoFiltro === 'todos' || tipoFiltro === 'operacion';
    const incluirEstetica = tipoFiltro === 'todos' || tipoFiltro === 'estetica';

    // ── Productos ──
    if (incluirProducto) {
      let lista = productos;
      if (tipoProdFiltro) lista = lista.filter((p) => p.tipoProductoId === parseInt(tipoProdFiltro));
      if (lista.length > 0) {
        groups.push({
          label: `Productos (${lista.length})`,
          options: lista.map((p) => ({
            value: `producto-${p.id}`,
            label: p.nombre,
            tipo: 'producto',
            data: p,
            _search: `${p.nombre} ${p.tipoProducto?.nombre || ''}`.toLowerCase(),
          })),
        });
      }
    }

    // ── Estudios ──
    if (incluirEstudio) {
      let lista = estudios;
      if (categoriaFiltro && tipoFiltro === 'estudio') {
        lista = lista.filter((s) => s.categoriaId === parseInt(categoriaFiltro));
      }
      if (lista.length > 0) {
        groups.push({
          label: `Estudios (${lista.length})`,
          options: lista.map((s) => ({
            value: `estudio-${s.id}`,
            label: s.nombre,
            tipo: 'estudio',
            data: s,
            _search: `${s.nombre} ${s.categoria?.nombre || ''}`.toLowerCase(),
          })),
        });
      }
    }

    // ── Operaciones ──
    if (incluirOperacion) {
      let lista = operaciones;
      if (categoriaFiltro && tipoFiltro === 'operacion') {
        lista = lista.filter((o) => o.categoriaId === parseInt(categoriaFiltro));
      }
      if (lista.length > 0) {
        groups.push({
          label: `Operaciones (${lista.length})`,
          options: lista.map((o) => ({
            value: `operacion-${o.id}`,
            label: o.nombre,
            tipo: 'operacion',
            data: o,
            _search: `${o.nombre} ${o.categoria?.nombre || ''}`.toLowerCase(),
          })),
        });
      }
    }

    // ── Estética ──
    if (incluirEstetica) {
      let lista = serviciosEstetica;
      if (categoriaFiltro && tipoFiltro === 'estetica') {
        lista = lista.filter((s) => s.categoriaId === parseInt(categoriaFiltro));
      }
      if (lista.length > 0) {
        groups.push({
          label: `Estética (${lista.length})`,
          options: lista.map((s) => ({
            value: `estetica-${s.id}`,
            label: s.nombre,
            tipo: 'estetica',
            data: s,
            _search: `${s.nombre} ${s.categoria?.nombre || ''}`.toLowerCase(),
          })),
        });
      }
    }

    return groups;
  }, [productos, estudios, operaciones, serviciosEstetica, tipoFiltro, tipoProdFiltro, categoriaFiltro]);

  /* Total de opciones (para hint) */
  const totalOpciones = useMemo(
    () => opcionesAgrupadas.reduce((acc, g) => acc + g.options.length, 0),
    [opcionesAgrupadas]
  );

  /* ── Opciones de sub-filtros (con icono) ── */
  const opcionesTiposProducto = useMemo(
    () => [
      { value: '', label: 'Todos los tipos', icon: Layers },
      ...tiposProducto.map((tp) => ({ value: String(tp.id), label: tp.nombre, icon: Tag })),
    ],
    [tiposProducto]
  );

  const categoriasDisponibles =
    tipoFiltro === 'estudio' ? categoriasEstudio :
    tipoFiltro === 'operacion' ? categoriasOperacion :
    tipoFiltro === 'estetica' ? categoriasEstetica : [];

  const opcionesCategorias = useMemo(
    () => [
      { value: '', label: 'Todas las categorías', icon: Layers },
      ...categoriasDisponibles.map((c) => ({ value: String(c.id), label: c.nombre, icon: Tag })),
    ],
    [categoriasDisponibles]
  );

  const tipoProdSeleccionado = opcionesTiposProducto.find((o) => o.value === tipoProdFiltro) || opcionesTiposProducto[0];
  const categoriaSeleccionada = opcionesCategorias.find((o) => o.value === categoriaFiltro) || opcionesCategorias[0];

  /* ── Agregar item ── */
  const handleAgregarDesdeBuscador = (option) => {
    if (!option) return;
    const { tipo, data } = option;

    const nuevoItem = {
      tipo,
      descripcion: data.nombre,
      cantidad: 1,
      precioUnit: parseFloat(data.precioVenta || 0),
    };

    if (tipo === 'producto') {
      nuevoItem.productoId = data.id;
      nuevoItem.tipoProductoId = data.tipoProductoId;
    } else {
      nuevoItem.id = data.id;
      nuevoItem.categoriaId = data.categoriaId;
    }

    append(nuevoItem);
    setBusqueda(null);
    setInputValue('');
    setTimeout(() => buscadorRef.current?.focus(), 50);
    toast.success(`${data.nombre} agregado`, { duration: 1200 });
  };

  const cambiarCantidad = (index, delta) => {
    const actual = detalles[index]?.cantidad || 1;
    const nueva = Math.max(1, actual + delta);
    setValue(`detalles.${index}.cantidad`, nueva);
  };

  /* ── Cliente ── */
  const buscarClientePorCedula = async () => {
    if (!cedulaBusqueda.trim()) { toast.error('Ingrese una cédula'); return; }
    setBuscandoCliente(true);
    setCedulaNoEncontrada(null);
    setClienteInactivo(null);
    try {
      const res = await getClientes({ search: cedulaBusqueda });
      const encontrados = res.data;
      if (encontrados.length === 0) {
        setClienteEncontrado(null);
        setCedulaNoEncontrada(cedulaBusqueda.trim());
        setValue('clienteId', undefined);
      } else {
        const cliente = encontrados[0];
        setClienteEncontrado(cliente);
        setValue('clienteId', cliente.id);
        toast.success(`Cliente: ${cliente.nombre}`);
      }
    } catch { toast.error('Error al buscar cliente'); }
    finally { setBuscandoCliente(false); }
  };

  const limpiarCliente = () => {
    setClienteEncontrado(null);
    setCedulaBusqueda('');
    setCedulaNoEncontrada(null);
    setClienteInactivo(null);
    setValue('clienteId', undefined);
  };

  const handleCrearCliente = async (data) => {
    setGuardandoCliente(true);
    try {
      const res = await createCliente(data);
      const nuevoCliente = res.data;
      setModalClienteOpen(false);
      setClienteEncontrado(nuevoCliente);
      setCedulaNoEncontrada(null);
      setValue('clienteId', nuevoCliente.id);
      setCedulaBusqueda('');
      toast.success(`Cliente ${nuevoCliente.nombre} registrado y seleccionado`);
    } catch (error) {
      if (error.response?.status === 409 && error.response.data?.clienteExistente) {
        setClienteInactivo(error.response.data.clienteExistente);
        return;
      }
      toast.error(error.response?.data?.error || 'Error al crear cliente');
    } finally { setGuardandoCliente(false); }
  };

  const handleReactivarCliente = async () => {
    if (!clienteInactivo) return;
    setGuardandoCliente(true);
    try {
      const res = await reactivarCliente(clienteInactivo.id);
      const reactivado = res.data || clienteInactivo;
      setModalClienteOpen(false);
      setClienteInactivo(null);
      setCedulaNoEncontrada(null);
      setClienteEncontrado(reactivado);
      setValue('clienteId', reactivado.id);
      setCedulaBusqueda('');
      toast.success(`Cliente ${reactivado.nombre} reactivado y seleccionado`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al reactivar cliente');
    } finally { setGuardandoCliente(false); }
  };

  /* ── Submit ── */
  const onSubmit = async (data) => {
    if (!isAdmin) data.montoPagado = parseFloat(total.toFixed(2));
    if (data.montoPagado > total) {
      toast.error(`El monto no puede superar el total ($${total.toFixed(2)})`);
      return;
    }

    try {
      const response = await createFactura(data);
      const factura = response.data;
      toast.success('Factura creada');

      const detallesFactura = factura.detalles || [];
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
          data: detallesFactura.map((d) => [d.descripcion, d.cantidad, `$${d.precioUnit}`]),
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
        error.response.data.detalles.forEach((err) => {
          toast.error(`${err.nombre}: disponible ${err.disponible}, solicitado ${err.solicitado}`);
        });
      } else {
        toast.error('Error al crear factura');
      }
    }
  };

  if (loading) return <div className="text-center p-4 text-slate-500">Cargando...</div>;

  const bloqueado =
    Object.keys(erroresStock).length > 0 ||
    excedeTotal ||
    (!isAdmin && saldoPendiente > 0.01);

  /* Render de opción con ícono (para sub-filtros compactos) */
  const renderIconOption = (opt) => {
    const Icon = opt.icon || Tag;
    return (
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={2.2} />
        <span className="truncate text-sm">{opt.label}</span>
      </div>
    );
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 pb-28 sm:pb-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Nueva Factura</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Completa los datos para generar la factura
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ═══════ Cliente ═══════ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <h2 className="text-base font-semibold text-slate-800">Cliente</h2>
          </div>

          {clienteEncontrado ? (
            <div className="flex items-start justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">
                  {clienteEncontrado.nombre}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  CI: {clienteEncontrado.cedula}
                </p>
              </div>
              <button
                type="button"
                onClick={limpiarCliente}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition shrink-0"
                title="Cambiar cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Cédula del cliente"
                  value={cedulaBusqueda}
                  onChange={(e) => setCedulaBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarClientePorCedula())}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={buscarClientePorCedula}
                  disabled={buscandoCliente}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                             hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
                >
                  {buscandoCliente ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-4 h-4" strokeWidth={2.5} />
                      Buscar
                    </>
                  )}
                </button>
              </div>

              {cedulaNoEncontrada && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-900">
                        No se encontró cliente con la cédula {cedulaNoEncontrada}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Puedes registrarlo aquí mismo sin salir de la factura.
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalClienteOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold
                                   bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800
                                   transition shadow-sm shadow-blue-600/25"
                      >
                        <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Registrar cliente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <input type="hidden" {...register('clienteId')} />
          {errors.clienteId && (
            <p className="text-red-600 text-xs mt-2">{errors.clienteId.message}</p>
          )}
        </section>

        {/* ═══════ Detalles (carrito) ═══════ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              <h2 className="text-base font-semibold text-slate-800">Detalles</h2>
              {fields.length > 0 && (
                <span className="text-xs text-slate-400 font-normal">
                  ({fields.length} {fields.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </div>
          </div>

          {/* Agregador sticky móvil */}
          <div className="sticky top-0 z-20 bg-white border-b border-slate-100 lg:static lg:border-0">
            <div className="p-3 sm:p-4 space-y-3">
              {/* Tabs */}
              <div
                className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1
                           lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  type="button"
                  onClick={() => { setTipoFiltro('todos'); setCategoriaFiltro(''); setTipoProdFiltro(''); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition border shrink-0
                    ${tipoFiltro === 'todos'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Todos</span>
                </button>
                {Object.entries(tipoConfig).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const activo = tipoFiltro === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setTipoFiltro(key); setCategoriaFiltro(''); setTipoProdFiltro(''); }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition border shrink-0
                        ${activo ? cfg.activeColor : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-filtros react-select con iconos */}
              {tipoFiltro === 'producto' && tiposProducto.length > 0 && (
                <Select
                  options={opcionesTiposProducto}
                  value={tipoProdSeleccionado}
                  onChange={(opt) => setTipoProdFiltro(opt ? opt.value : '')}
                  isSearchable={false}
                  formatOptionLabel={renderIconOption}
                  styles={compactSelectStyles}
                  menuPortalTarget={document.body}
                  placeholder="Todos los tipos"
                />
              )}

              {['estudio', 'operacion', 'estetica'].includes(tipoFiltro) && categoriasDisponibles.length > 0 && (
                <Select
                  options={opcionesCategorias}
                  value={categoriaSeleccionada}
                  onChange={(opt) => setCategoriaFiltro(opt ? opt.value : '')}
                  isSearchable={false}
                  formatOptionLabel={renderIconOption}
                  styles={compactSelectStyles}
                  menuPortalTarget={document.body}
                  placeholder="Todas las categorías"
                />
              )}

              {/* Buscador principal */}
              <div className="relative">
                <Select
                  ref={buscadorRef}
                  options={opcionesAgrupadas}
                  value={busqueda}
                  inputValue={inputValue}
                  onInputChange={(v, action) => {
                    if (action === 'input-change' || action === 'set-value' || action === 'input-blur') {
                      setInputValue(v);
                    }
                    if (action === 'menu-close') setInputValue('');
                  }}
                  onChange={handleAgregarDesdeBuscador}
                  isClearable
                  isSearchable
                  placeholder={
                    tipoFiltro === 'todos'
                      ? 'Buscar producto o servicio...'
                      : `Buscar ${tipoConfig[tipoFiltro].label.toLowerCase()}...`
                  }
                  noOptionsMessage={() => 'Sin resultados'}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  maxMenuHeight={340}
                  filterOption={(option, input) =>
                    option.data._search.includes(input.toLowerCase().trim())
                  }
                  isOptionDisabled={(opt) => {
                    if (opt.tipo !== 'producto') return false;
                    return detalles.some((d) => d.productoId === opt.data.id);
                  }}
                  formatOptionLabel={(opt, { context }) => {
                    const cfg = tipoConfig[opt.tipo];
                    const Icon = cfg.icon;
                    const precio = parseFloat(opt.data.precioVenta || 0).toFixed(2);

                    if (context === 'value') {
                      return (
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={2.5} />
                          <span className="truncate">{opt.data.nombre}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${cfg.color}`}>
                            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-slate-700 font-medium">
                              {opt.data.nombre}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                              {cfg.label}
                              {opt.tipo === 'producto' && opt.data.stock !== undefined && (
                                <span className="ml-1.5 normal-case tracking-normal">
                                  · Stock {opt.data.stock}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 shrink-0 tabular-nums">
                          ${precio}
                        </span>
                      </div>
                    );
                  }}
                />

                {/* Hint contador (solo cuando no está buscando) */}
                {!inputValue && totalOpciones > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <Layers className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                    <span>
                      {totalOpciones} {totalOpciones === 1 ? 'item disponible' : 'items disponibles'} —{' '}
                      <span className="text-slate-400">escribe para filtrar</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista de items */}
          <div className="p-3 sm:p-4">
            {fields.length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {/* Header desktop */}
                <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-3 text-center">Cantidad</div>
                  <div className="col-span-2 text-right">P. Unit.</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {fields.map((field, index) => {
                    const det = detalles[index] || {};
                    const cfg = tipoConfig[field.tipo];
                    const Icon = cfg.icon;
                    const subtotalItem = (det.cantidad || 0) * (det.precioUnit || 0);
                    const precioUnit = parseFloat(det.precioUnit || 0);
                    const stockErr = erroresStock[index];

                    return (
                      <div
                        key={field.id}
                        className={`group hover:bg-slate-50/60 transition ${stockErr ? 'bg-red-50/40' : ''}`}
                      >
                        {/* MÓVIL */}
                        <div className="lg:hidden p-3">
                          <div className="flex items-start gap-3 mb-2.5">
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${cfg.color}`}>
                              <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 leading-tight">
                                {det.descripcion || '—'}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {cfg.label}
                                {stockErr && <span className="text-red-600 ml-1.5 font-medium">· ⚠ {stockErr}</span>}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2 pl-12">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(index, -1)}
                                disabled={(det.cantidad || 1) <= 1}
                                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center
                                           text-slate-600 hover:bg-slate-50 active:bg-slate-100
                                           disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >
                                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </button>
                              <input
                                {...register(`detalles.${index}.cantidad`, { valueAsNumber: true })}
                                type="number"
                                min="1"
                                inputMode="numeric"
                                className={`w-12 text-center text-sm font-semibold tabular-nums py-1.5
                                           border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                           ${stockErr ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300 text-slate-800'}`}
                              />
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(index, 1)}
                                className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center
                                           text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition"
                              >
                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 tabular-nums">${precioUnit.toFixed(2)} c/u</p>
                              <p className="text-sm font-bold text-slate-800 tabular-nums">${subtotalItem.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        {/* DESKTOP */}
                        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                          <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${cfg.color}`}>
                              <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{det.descripcion || '—'}</p>
                              <p className="text-[11px] text-slate-500">
                                {cfg.label}
                                {stockErr && <span className="text-red-600 ml-2 font-medium">⚠ {stockErr}</span>}
                              </p>
                            </div>
                          </div>

                          <div className="col-span-3 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(index, -1)}
                              disabled={(det.cantidad || 1) <= 1}
                              className="w-7 h-7 rounded-md border border-slate-300 flex items-center justify-center
                                         text-slate-500 hover:bg-slate-100
                                         disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <Minus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                            <input
                              {...register(`detalles.${index}.cantidad`, { valueAsNumber: true })}
                              type="number"
                              min="1"
                              className={`w-14 text-center text-sm tabular-nums py-1
                                         border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                         ${stockErr ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300 text-slate-800'}`}
                            />
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(index, 1)}
                              className="w-7 h-7 rounded-md border border-slate-300 flex items-center justify-center
                                         text-slate-500 hover:bg-slate-100 transition"
                            >
                              <Plus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          </div>

                          <div className="col-span-2 text-right text-sm text-slate-600 tabular-nums pr-2">
                            ${precioUnit.toFixed(2)}
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                            <span className="text-sm font-semibold text-slate-800 tabular-nums">
                              ${subtotalItem.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500">
                    {fields.length} {fields.length === 1 ? 'item' : 'items'}
                  </span>
                  <span className="font-semibold text-slate-700 tabular-nums">
                    Subtotal: ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                <p className="font-medium text-slate-500">Aún no hay items</p>
                <p className="text-xs mt-0.5">Busca arriba y selecciona para agregar</p>
              </div>
            )}

            {errors.detalles && (
              <p className="text-red-600 text-sm mt-2">{errors.detalles.message}</p>
            )}
          </div>
        </section>

        {/* ═══════ Totales y pago ═══════ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <h2 className="text-base font-semibold text-slate-800">Resumen</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Monto pagado hoy (USD)
                  {!isAdmin && <span className="ml-1 text-[10px] text-slate-400 font-normal">· Auto</span>}
                </label>
                <input
                  {...register('montoPagado', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  max={total}
                  readOnly={!isAdmin}
                  tabIndex={isAdmin ? 0 : -1}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${excedeTotal ? 'border-red-400 bg-red-50' :
                      !isAdmin ? 'bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200' :
                      'border-slate-300'}`}
                />
                {excedeTotal && (
                  <p className="text-red-600 text-xs mt-1">
                    El monto no puede superar el total (${total.toFixed(2)})
                  </p>
                )}
                {isAdmin && total > 0 && !excedeTotal && (
                  <button
                    type="button"
                    onClick={() => setValue('montoPagado', parseFloat(total.toFixed(2)))}
                    className="mt-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Pagar el total (${total.toFixed(2)})
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Método de pago
                </label>
                <select
                  {...register('metodoPago')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione</option>
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  {...register('iva')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">Aplicar IVA (16%)</span>
              </label>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-800 tabular-nums">${subtotal.toFixed(2)}</span>
              </div>

              {ivaActivo && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IVA (16%)</span>
                  <span className="font-medium text-slate-800 tabular-nums">${impuestos.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 my-2"></div>

              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-700">Total USD</span>
                <span className="text-2xl font-bold text-blue-600 tabular-nums">${total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Total Bs.</span>
                <span className="tabular-nums">Bs. {(total * factorCambio).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-200 mt-2">
                <span>Pagado</span>
                <span className="tabular-nums">${montoPagado.toFixed(2)}</span>
              </div>

              <div className={`flex justify-between text-sm font-semibold ${
                excedeTotal ? 'text-blue-600' : saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                <span>{excedeTotal ? 'Vuelto' : 'Saldo pendiente'}</span>
                <span className="tabular-nums">
                  {excedeTotal ? `$${Math.abs(saldoPendiente).toFixed(2)}` : `$${saldoPendiente.toFixed(2)}`}
                </span>
              </div>

              {!isAdmin && saldoPendiente > 0.01 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    <strong>Debes cobrar el total</strong> para poder emitir la factura.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════ Botones ═══════ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate('/facturacion')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium
                       hover:bg-slate-300 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={bloqueado || isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                       hover:bg-blue-700 active:bg-blue-800 transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>Generar Factura</>
            )}
          </button>
        </div>
      </form>

      {/* ═══════ MODAL cliente ═══════ */}
      <Modal
        isOpen={modalClienteOpen}
        onClose={() => {
          if (guardandoCliente) return;
          setModalClienteOpen(false);
          setClienteInactivo(null);
        }}
        title="Registrar nuevo cliente"
        size="lg"
      >
        {clienteInactivo ? (
          <div>
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900">
                Ya existe un cliente con esta cédula pero está desactivado
              </p>
              <p className="text-xs text-amber-700 mt-1">
                ¿Deseas reactivarlo para usarlo en esta factura?
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
              <p className="text-sm"><strong>Nombre:</strong> {clienteInactivo.nombre}</p>
              <p className="text-sm"><strong>Cédula:</strong> {clienteInactivo.cedula}</p>
              {clienteInactivo.telefono && (
                <p className="text-sm"><strong>Teléfono:</strong> {clienteInactivo.telefono}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setClienteInactivo(null)}
                disabled={guardandoCliente}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                           hover:bg-slate-200 transition order-2 sm:order-1 disabled:opacity-50"
              >
                Volver al formulario
              </button>
              <button
                type="button"
                onClick={handleReactivarCliente}
                disabled={guardandoCliente}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium
                           hover:bg-green-700 transition order-1 sm:order-2 disabled:opacity-50
                           inline-flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {guardandoCliente ? 'Reactivando...' : 'Reactivar y usar'}
              </button>
            </div>
          </div>
        ) : (
          <ClienteForm
            onSave={handleCrearCliente}
            onCancel={() => {
              if (guardandoCliente) return;
              setModalClienteOpen(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default NuevaFacturaPage;