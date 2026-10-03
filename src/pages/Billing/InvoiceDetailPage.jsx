import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFactura, registrarPago, anularFactura, deleteFactura } from '../../services/facturaService';
import { deletePago, updatePago } from '../../services/pagoService';
import { getParametrosFactura } from '../../services/parametroFacturaService';
import { generateFacturaPDF } from '../../services/pdfService';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { METODOS_PAGO } from '../../constants/metodosPago';

const pagoSchema = z.object({
  monto: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  metodoPago: z.string().min(1, 'Método de pago requerido'),
  referencia: z.string().optional(),
  factorCambio: z.number().optional().nullable(),
});

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalPago, setModalPago] = useState(false);
  const [modalEditarPago, setModalEditarPago] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(pagoSchema),
    defaultValues: { metodoPago: 'EFECTIVO' }
  });

  const montoIngresado = watch('monto') || 0;
  const saldoPendiente = factura?.saldoPendiente || 0;

  useEffect(() => {
    loadFactura();
  }, [id]);

  const loadFactura = async () => {
    try {
      setLoading(true);
      const res = await getFactura(id);
      setFactura(res.data);
    } catch (error) {
      toast.error('Error al cargar factura');
    } finally {
      setLoading(false);
    }
  };

  const obtenerFactorCambioActual = async () => {
    try {
      const res = await getParametrosFactura();
      console.log('Factor de cambio actual:', res.data?.factor_cambio);
      return parseFloat(res.data?.factor_cambio) || 2;
    } catch {
      return 1;
    }
  };

  const handleRegistrarPago = async (data) => {
    if (data.monto > saldoPendiente) {
      toast.error(`El monto no puede ser mayor al saldo pendiente ($${saldoPendiente})`);
      return;
    }
    try {
      const factor = await obtenerFactorCambioActual();
      await registrarPago(id, { ...data, factorCambio: factor });
      toast.success('Pago registrado');
      setModalPago(false);
      reset();
      loadFactura();
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al registrar pago';
      toast.error(mensaje);
    }
  };

  const handleEditarPago = (pago) => {
    setPagoSeleccionado(pago);
    reset({
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      referencia: pago.referencia || '',
      factorCambio: pago.factorCambio
    });
    setModalEditarPago(true);
  };

  const handleActualizarPago = async (data) => {
    try {
      await updatePago(pagoSeleccionado.id, data);
      toast.success('Pago actualizado');
      setModalEditarPago(false);
      loadFactura();
    } catch (error) {
      toast.error('Error al actualizar pago');
    }
  };

  const handleAnularPago = async (pagoId, montoPago) => {
    if (!isAdmin) {
      toast.error('No tienes permiso para anular pagos');
      return;
    }
    if (!confirm('¿Anular este pago? Se revertirá el saldo de la factura.')) return;
    try {
      await deletePago(pagoId);
      toast.success('Pago anulado');
      loadFactura();
    } catch (error) {
      toast.error('Error al anular pago');
    }
  };

  const handleEliminarFactura = async () => {
    if (!isAdmin) {
      toast.error('No tienes permiso para eliminar facturas');
      return;
    }
    if (!confirm('¿Eliminar permanentemente esta factura? Esta acción no se puede deshacer.')) return;
    try {
      await deleteFactura(id);
      toast.success('Factura eliminada');
      navigate('/facturacion');
    } catch (error) {
      toast.error('Error al eliminar factura');
    }
  };

  const handleAnularFactura = async () => {
    if (!isAdmin) {
      toast.error('No tienes permiso para anular facturas');
      return;
    }
    if (!confirm('¿Anular esta factura? Se marcará como anulada pero se conservará.')) return;
    try {
      await anularFactura(id);
      toast.success('Factura anulada');
      loadFactura();
    } catch (error) {
      toast.error('Error al anular');
    }
  };

  const handleGenerarPDF = async () => {
    if (!factura) return;
    setPdfLoading(true);
    try {
      const detalles = factura.detalles || [];
      const pagos = factura.pagos || [];

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
          headers: ['Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal'],
          data: detalles.map(d => [
            d.descripcion,
            d.cantidad,
            `$${d.precioUnit}`,
            `$${d.subtotal}`,
          ]),
        },
        {
          title: 'Pagos Realizados',
          type: 'table',
          headers: ['Fecha', 'Monto ($)', 'Monto (Bs)', 'Método', 'Referencia', 'Factor'],
          data: pagos.map(p => [
            new Date(p.fecha).toLocaleString(),
            `$${p.monto}`,
            p.factorCambio ? `Bs. ${(p.monto * p.factorCambio).toFixed(2)}` : '-',
            p.metodoPago,
            p.referencia || '-',
            p.factorCambio || '-',
          ]),
        },
        {
          title: 'Resumen',
          type: 'keyValue',
          content: [
            ['Subtotal', `$${factura.subtotal}`],
            ['Impuestos', `$${factura.impuestos}`],
            ['Total', `$${factura.total}`],
            ['Total Pagado', `$${factura.montoPagado}`],
            ['Saldo Pendiente', `$${factura.saldoPendiente}`],
            ['Estado', factura.estadoPago],
          ],
        },
      ];

      await generateFacturaPDF(`Factura ${factura.numero}`, sections);
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const detallesColumns = [
    { header: 'Descripción', accessorKey: 'descripcion' },
    { header: 'Cantidad', accessorKey: 'cantidad' },
    { header: 'Precio Unit.', accessorKey: 'precioUnit', cell: ({ getValue }) => `$${getValue()}` },
    { header: 'Subtotal', accessorKey: 'subtotal', cell: ({ getValue }) => `$${getValue()}` },
  ];

  const pagosColumns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => new Date(getValue()).toLocaleString() },
    {id: 'monto_usd', header: 'Monto ($)', accessorKey: 'monto', cell: ({ getValue }) => `$${getValue()}` },
    { id: 'monto_bs',
      header: 'Monto (Bs)',
      accessorKey: 'monto',
      cell: ({ row }) => {
        const monto = row.original.monto;
        const factor = row.original.factorCambio || 1;
        return `Bs. ${(monto * factor).toFixed(2)}`;
      }
    },
    { header: 'Método', accessorKey: 'metodoPago' },
    { header: 'Referencia', accessorKey: 'referencia' },
    { header: 'Factor', accessorKey: 'factorCambio', cell: ({ getValue }) => getValue() || '-' },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditarPago(row.original);
              }}
              className="text-yellow-600 hover:text-yellow-800"
              title="Editar pago"
            >
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAnularPago(row.original.id, row.original.monto);
              }}
              className="text-red-600 hover:text-red-800"
              title="Anular pago"
            >
              Anular
            </button>
          </div>
        )
      ),
    },
  ];

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (!factura) return <div className="text-center p-4">Factura no encontrada</div>;

  const puedePagar = factura.estadoPago !== 'ANULADA' && saldoPendiente > 0;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">Factura {factura.numero}</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleGenerarPDF}
            disabled={pdfLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            {pdfLoading ? 'Generando...' : 'Generar PDF'}
          </button>
          {puedePagar && (
            <button
              onClick={() => setModalPago(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
            >
              Registrar Pago
            </button>
          )}
          {isAdmin && factura.estadoPago !== 'ANULADA' && (
            <button
              onClick={handleAnularFactura}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 w-full sm:w-auto"
            >
              Anular
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleEliminarFactura}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={() => navigate('/facturacion')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-semibold">{factura.cliente?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vendedor</p>
            <p className="font-semibold">{factura.vendedor?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="font-semibold">{new Date(factura.fecha).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <p className={`font-semibold ${factura.estadoPago === 'PAGADA' ? 'text-green-600' : factura.estadoPago === 'ANULADA' ? 'text-red-600' : 'text-yellow-600'}`}>
              {factura.estadoPago}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="font-semibold">${factura.subtotal}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Impuestos</p>
            <p className="font-semibold">${factura.impuestos}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="font-semibold text-lg">${factura.total}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Pagado</p>
            <p className="font-semibold">${factura.montoPagado}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Saldo Pendiente</p>
            <p className={`font-semibold ${saldoPendiente < 0 ? 'text-red-600' : ''}`}>
              ${saldoPendiente}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Detalles</h2>
        <DataTable columns={detallesColumns} data={factura.detalles || []} />
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Pagos Realizados</h2>
        <DataTable columns={pagosColumns} data={factura.pagos || []} />
      </div>

      {/* Modal Registrar Pago */}
      <Modal isOpen={modalPago} onClose={() => setModalPago(false)} title="Registrar Pago">
        <form onSubmit={handleSubmit(handleRegistrarPago)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Monto</label>
            <input
              type="number"
              step="0.01"
              {...register('monto', { valueAsNumber: true })}
              className="mt-1 block w-full border rounded p-2"
            />
            {errors.monto && <p className="text-red-600 text-sm">{errors.monto.message}</p>}
            {montoIngresado > saldoPendiente && (
              <p className="text-red-600 text-sm">El monto no puede ser mayor al saldo pendiente (${saldoPendiente})</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Método de Pago</label>
            <select {...register('metodoPago')} className="mt-1 block w-full border rounded p-2">
              <option value="">Seleccione</option>
  {METODOS_PAGO.map(m => (
    <option key={m.value} value={m.value}>{m.label}</option>
  ))}
            </select>
            {errors.metodoPago && <p className="text-red-600 text-sm">{errors.metodoPago.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Referencia (opcional)</label>
            <input {...register('referencia')} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => setModalPago(false)} className="px-4 py-2 bg-gray-300 rounded">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={montoIngresado > saldoPendiente || saldoPendiente <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Registrar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Pago */}
      <Modal isOpen={modalEditarPago} onClose={() => setModalEditarPago(false)} title="Editar Pago">
        <form onSubmit={handleSubmit(handleActualizarPago)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              {...register('monto', { valueAsNumber: true })}
              className="mt-1 block w-full border rounded p-2"
            />
            {errors.monto && <p className="text-red-600 text-sm">{errors.monto.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Método de Pago</label>
            <select {...register('metodoPago')} className="mt-1 block w-full border rounded p-2">
              <option value="">Seleccione</option>
  {METODOS_PAGO.map(m => (
    <option key={m.value} value={m.value}>{m.label}</option>
  ))}
            </select>
            {errors.metodoPago && <p className="text-red-600 text-sm">{errors.metodoPago.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Referencia (opcional)</label>
            <input {...register('referencia')} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Factor de cambio</label>
            <input
              type="number"
              step="0.01"
              {...register('factorCambio', { valueAsNumber: true })}
              className="mt-1 block w-full border rounded p-2"
            />
            <p className="text-xs text-gray-500">Dejar en blanco para mantener el original</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => setModalEditarPago(false)} className="px-4 py-2 bg-gray-300 rounded">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceDetailPage;