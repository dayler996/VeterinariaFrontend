import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getClientes } from '../../services/clienteService'
import { getProductos } from '../../services/productoService'
import { createFactura } from '../../services/facturaService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { METODOS_PAGO } from '../../constants/metodosPago';

const invoiceSchema = z.object({
  clienteId: z.number({ required_error: 'Cliente requerido' }),
  vendedorId: z.number(),
  detalles: z.array(z.object({
    descripcion: z.string().min(1, 'Descripción requerida'),
    cantidad: z.number().min(1),
    precioUnit: z.number().positive(),
    productoId: z.number().optional(),
    mascotaId: z.number().optional(),
  })).min(1, 'Agregue al menos un detalle'),
  montoPagado: z.number().min(0).default(0),
  metodoPago: z.string().optional(),
})

const CreateInvoicePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const vendedorId = user?.trabajador?.id || 1

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      detalles: [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
      montoPagado: 0,
      vendedorId
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' })

  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])

  const detalles = watch('detalles')
  const subtotal = detalles.reduce((acc, item) => acc + (item.cantidad * item.precioUnit || 0), 0)
  const impuestos = subtotal * 0.16
  const total = subtotal + impuestos
  const saldoPendiente = total - (watch('montoPagado') || 0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cliRes, prodRes] = await Promise.all([getClientes(), getProductos()])
        setClientes(cliRes.data)
        setProductos(prodRes.data)
      } catch (error) {
        toast.error('Error al cargar datos')
      }
    }
    fetchData()
  }, [])

  const handleProductSelect = (index, productoId) => {
    const producto = productos.find(p => p.id === parseInt(productoId))
    if (producto) {
      setValue(`detalles.${index}.descripcion`, producto.nombre)
      setValue(`detalles.${index}.precioUnit`, parseFloat(producto.precioVenta))
      setValue(`detalles.${index}.productoId`, producto.id)
    }
  }

  const onSubmit = async (data) => {
    try {
      await createFactura(data)
      toast.success('Factura creada exitosamente')
      navigate('/facturacion')
    } catch (error) {
      toast.error('Error al crear factura')
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Nueva Factura</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Cliente</label>
            <select {...register('clienteId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
              <option value="">Seleccione...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} - {c.cedula}</option>
              ))}
            </select>
            {errors.clienteId && <p className="text-red-600">{errors.clienteId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Vendedor</label>
            <input type="text" value={user?.trabajador?.nombre || 'Vendedor'} disabled className="mt-1 block w-full border rounded p-2 bg-gray-100" />
            <input type="hidden" {...register('vendedorId')} value={vendedorId} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Detalles</h2>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 p-2 border rounded">
                <select
                  className="w-full sm:w-1/4 border rounded p-2"
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                  value={watch(`detalles.${index}.productoId`) || ''}
                >
                  <option value="">Producto (opcional)</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <input
                  {...register(`detalles.${index}.descripcion`)}
                  placeholder="Descripción"
                  className="w-full sm:flex-1 border rounded p-2"
                />
                <input
                  {...register(`detalles.${index}.cantidad`, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  placeholder="Cant."
                  className="w-full sm:w-20 border rounded p-2"
                />
                <input
                  {...register(`detalles.${index}.precioUnit`, { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="P.Unit"
                  className="w-full sm:w-24 border rounded p-2"
                />
                <span className="w-full sm:w-20 text-right">
                  {(watch(`detalles.${index}.cantidad`) * watch(`detalles.${index}.precioUnit`) || 0).toFixed(2)}
                </span>
                <button type="button" onClick={() => remove(index)} className="text-red-600 w-full sm:w-auto">✕ Eliminar</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => append({ descripcion: '', cantidad: 1, precioUnit: 0 })} className="mt-2 px-4 py-2 bg-green-600 text-white rounded w-full sm:w-auto">
            + Agregar ítem
          </button>
          {errors.detalles && <p className="text-red-600">{errors.detalles.message}</p>}
        </div>

        <div className="border-t pt-4">
          <div className="flex flex-col items-end">
            <div className="w-full sm:w-64 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos (16%):</span>
                <span>${impuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium">Monto pagado hoy</label>
            <input {...register('montoPagado', { valueAsNumber: true })} type="number" step="0.01" className="mt-1 block w-full sm:w-64 border rounded p-2" />
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

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => navigate('/facturacion')} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
            Generar Factura
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateInvoicePage