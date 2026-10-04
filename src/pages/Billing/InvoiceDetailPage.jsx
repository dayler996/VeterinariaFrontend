import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFactura, registrarPago, anularFactura, deleteFactura } from '../../services/facturaService';
import { deletePago, updatePago } from '../../services/pagoService';
import { getParametrosFactura } from '../../services/parametroFacturaService';
import { generateFacturaPDF } from '../../services/pdfService';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useConfirm } from '../../context/ConfirmContext';
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

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const estadoConfig = {
  PENDIENTE: { label: 'Pendiente', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  ABONADA:   { label: 'Abonada',   badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  PAGADA:    { label: 'Pagada',    badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  ANULADA:   { label: 'Anulada',   badge: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
};

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const confirm = useConfirm();

  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalPago, setModalPago] = useState(false);
  const [modalEditarPago, setModalEditarPago] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(pagoSchema),
    defaultValues: { metodoPago: 'EFECTIVO' },
  });

  const montoIngresado = watch('monto') || 0;
  const saldoPendiente = factura?.saldoPendiente || 0;

  useEffect(() => { loadFactura(); }, [id]);

  const loadFactura = async () => {
    try {
      setLoading(true);
      const res = await getFactura(id);
      setFactura(res.data);
    } catch { toast.error('Error al cargar factura'); }
    finally { setLoading(false); }
  };

  const obtenerFactorCambioActual = async () => {
    try {
      const res = await getParametrosFactura();
      return parseFloat(res.data?.factor_cambio) || 2;
    } catch { return 1; }
  };

  const handleRegistrarPago = async (data) => {
    if (data.monto > saldoPendiente) {
      toast.error(`El monto no puede ser mayor al saldo pendiente (${fmt(saldoPendiente)})`);
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
      toast.error(error.response?.data?.error || 'Error al registrar pago');
    }
  };

  const handleEditarPago = (pago) => {
    setPagoSeleccionado(pago);
    reset({
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      referencia: pago.referencia || '',
      factorCambio: pago.factorCambio,
    });
    setModalEditarPago(true);
  };

  const handleActualizarPago = async (data) => {
    try {
      await updatePago(pagoSeleccionado.id, data);
      toast.success('Pago actualizado');
      setModalEditarPago(false);
      loadFactura();
    } catch { toast.error('Error al actualizar pago'); }
  };

  const handleAnularPago = async (pagoId) => {
    if (!isAdmin) { toast.error('No tienes permiso'); return; }
    const ok = await confirm({
      title: 'Anular pago',
      message: 'Se revertirá el saldo de la factura.',
      confirmText: 'Anular',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await deletePago(pagoId);
      toast.success('Pago anulado');
      loadFactura();
    } catch { toast.error('Error al anular pago'); }
  };

  const handleEliminarFactura = async () => {
    if (!isAdmin) { toast.error('No tienes permiso'); return; }
    const ok = await confirm({
      title: 'Eliminar factura',
      message: 'Se eliminará permanentemente. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteFactura(id);
      toast.success('Factura eliminada');
      navigate('/facturacion');
    } catch { toast.error('Error al eliminar factura'); }
  };

  const handleAnularFactura = async () => {
    if (!isAdmin) { toast.error('No tienes permiso'); return; }
    const ok = await confirm({
      title: 'Anular factura',
      message: 'Se marcará como anulada pero se conservará.',
      confirmText: 'Anular',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await anularFactura(id);
      toast.success('Factura anulada');
      loadFactura();
    } catch { toast.error('Error al anular'); }
  };

  const handleGenerarPDF = async () => {
    if (!factura) return;
    setPdfLoading(true);
    try {
      const detallesFactura = factura.detalles || [];
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
          data: detallesFactura.map(d => [d.descripcion, d.cantidad, `$${d.precioUnit}`, `$${d.subtotal}`]),
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
    } catch { toast.error('Error al generar PDF'); }
    finally { setPdfLoading(false); }
  };

  const detallesColumns = [
    { header: 'Descripción', accessorKey: 'descripcion' },
    { header: 'Cantidad', accessorKey: 'cantidad', cell: ({ getValue }) => <span className="block text-center tabular-nums">{getValue()}</span> },
    { header: 'Precio Unit.', accessorKey: 'precioUnit', cell: ({ getValue }) => <span className="block text-right tabular-nums">{fmt(getValue())}</span> },
    { header: 'Subtotal', accessorKey: 'subtotal', cell: ({ getValue }) => <span className="block text-right tabular-nums font-semibold">{fmt(getValue())}</span> },
  ];

  const pagosColumns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{new Date(getValue()).toLocaleString()}</span> },
    { header: 'Monto $', accessorKey: 'monto', cell: ({ getValue }) => <span className="block text-right tabular-nums font-semibold text-green-700">{fmt(getValue())}</span> },
    {
      id: 'monto_bs', header: 'Monto Bs', accessorKey: 'monto',
      cell: ({ row }) => {
        const monto = row.original.monto;
        const factor = row.original.factorCambio || 1;
        return <span className="block text-right tabular-nums text-gray-600">Bs. {(monto * factor).toFixed(2)}</span>;
      },
    },
    { header: 'Método', accessorKey: 'metodoPago', cell: ({ getValue }) => <span className="text-xs font-medium">{getValue()}</span> },
    { header: 'Ref.', accessorKey: 'referencia', cell: ({ getValue }) => <span className="text-xs text-gray-500">{getValue() || '—'}</span> },
    {
      id: 'acciones', header: 'Acciones',
      cell: ({ row }) => (
        isAdmin ? (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => handleEditarPago(row.original)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition" title="Editar">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onClick={() => handleAnularPago(row.original.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition" title="Anular pago">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-3 sm:p-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="animate-spin w-8 h-8 mx-auto text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 mt-3">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="p-3 sm:p-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">Factura no encontrada</p>
          <button onClick={() => navigate('/facturacion')} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">← Volver a facturación</button>
        </div>
      </div>
    );
  }

  const puedePagar = factura.estadoPago !== 'ANULADA' && saldoPendiente > 0;
  const cfgEstado = estadoConfig[factura.estadoPago] || { label: factura.estadoPago, badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };

  return (
    <div className="p-3 sm:p-4 max-w-5xl mx-auto">
      <PageHeader
        icon="🧾"
        breadcrumbs={[
          { label: 'Facturación', to: '/facturacion' },
          { label: `Factura ${factura.numero}` },
        ]}
        title={
          <span className="flex items-center gap-2 flex-wrap">
            Factura {factura.numero}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfgEstado.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfgEstado.dot}`} />
              {cfgEstado.label}
            </span>
          </span>
        }
        subtitle={new Date(factura.fecha).toLocaleString()}
        actions={
          <>
            <button onClick={handleGenerarPDF} disabled={pdfLoading} className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              {pdfLoading ? 'Generando...' : 'PDF'}
            </button>
            {puedePagar && (
              <button
                onClick={() => { reset({ metodoPago: 'EFECTIVO', monto: '', referencia: '' }); setModalPago(true); }}
                className="inline-flex items-center justify-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition col-span-2 sm:col-span-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Registrar Pago
              </button>
            )}
            {isAdmin && factura.estadoPago !== 'ANULADA' && (
              <button onClick={handleAnularFactura} className="inline-flex items-center justify-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                Anular
              </button>
            )}
            {isAdmin && (
              <button onClick={handleEliminarFactura} className="inline-flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                Eliminar
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Cliente" value={factura.cliente?.nombre} />
            <InfoItem label="Cédula" value={factura.cliente?.cedula} />
            <InfoItem label="Vendedor" value={factura.vendedor?.nombre} />
            <InfoItem label="Fecha" value={new Date(factura.fecha).toLocaleDateString()} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Total a pagar</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums">{fmt(factura.total)}</p>
          <div className="mt-3 pt-3 border-t border-white/20 space-y-1.5">
            <div className="flex justify-between text-xs"><span className="opacity-80">Subtotal</span><span className="tabular-nums">{fmt(factura.subtotal)}</span></div>
            {Number(factura.impuestos) > 0 && (
              <div className="flex justify-between text-xs"><span className="opacity-80">Impuestos</span><span className="tabular-nums">{fmt(factura.impuestos)}</span></div>
            )}
            <div className="flex justify-between text-xs"><span className="opacity-80">Pagado</span><span className="tabular-nums">{fmt(factura.montoPagado)}</span></div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-white/20">
              <span>Saldo</span>
              <span className={`tabular-nums ${saldoPendiente > 0 ? 'text-yellow-200' : 'text-green-200'}`}>{fmt(saldoPendiente)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
          <h2 className="text-base font-semibold text-gray-800">
            Detalles
            <span className="text-xs text-gray-400 font-normal ml-2">({(factura.detalles || []).length} {(factura.detalles || []).length === 1 ? 'item' : 'items'})</span>
          </h2>
        </div>
        <div className="p-3 sm:p-4">
          {(factura.detalles || []).length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">Sin detalles</p>
          ) : (
            <DataTable columns={detallesColumns} data={factura.detalles || []} showGlobalFilter={false} hidePagination />
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-green-600 rounded-full"></span>
            <h2 className="text-base font-semibold text-gray-800">
              Pagos realizados
              <span className="text-xs text-gray-400 font-normal ml-2">({(factura.pagos || []).length})</span>
            </h2>
          </div>
          {puedePagar && (
            <button
              onClick={() => { reset({ metodoPago: 'EFECTIVO' }); setModalPago(true); }}
              className="text-xs sm:text-sm text-green-600 hover:text-green-800 font-medium inline-flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Registrar pago
            </button>
          )}
        </div>
        <div className="p-3 sm:p-4">
          {(factura.pagos || []).length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center text-xl">💳</div>
              <p className="text-sm text-gray-500">Aún no hay pagos registrados</p>
            </div>
          ) : (
            <DataTable columns={pagosColumns} data={factura.pagos || []} showGlobalFilter={false} hidePagination />
          )}
        </div>
      </div>

      <Modal isOpen={modalPago} onClose={() => setModalPago(false)} title="Registrar Pago" size="sm">
        <form onSubmit={handleSubmit(handleRegistrarPago)} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex justify-between text-xs text-gray-600 mb-0.5"><span>Factura</span><span className="font-medium text-gray-800">{factura.numero}</span></div>
            <div className="flex justify-between text-xs text-gray-600 mb-0.5"><span>Total</span><span className="font-medium text-gray-800 tabular-nums">{fmt(factura.total)}</span></div>
            <div className="flex justify-between text-sm font-semibold pt-1.5 mt-1.5 border-t border-blue-200">
              <span className="text-gray-700">Saldo pendiente</span>
              <span className="text-red-600 tabular-nums">{fmt(saldoPendiente)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto a pagar <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                autoFocus
                {...register('monto', { valueAsNumber: true })}
                className={`w-full pl-7 pr-3 py-3 border rounded-lg text-lg font-semibold text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.monto || montoIngresado > saldoPendiente ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="0.00"
              />
            </div>
            {errors.monto && <p className="text-red-600 text-xs mt-1">{errors.monto.message}</p>}
            {montoIngresado > saldoPendiente && <p className="text-red-600 text-xs mt-1">El monto no puede superar el saldo ({fmt(saldoPendiente)})</p>}
            {saldoPendiente > 0 && (
              <button type="button" onClick={() => reset(v => ({ ...v, monto: saldoPendiente }))} className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                Pagar el total ({fmt(saldoPendiente)})
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago <span className="text-red-500">*</span></label>
            <select {...register('metodoPago')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.metodoPago ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">Seleccione</option>
              {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {errors.metodoPago && <p className="text-red-600 text-xs mt-1">{errors.metodoPago.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input {...register('referencia')} placeholder="Nº de transferencia, factura, etc." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalPago(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting || montoIngresado > saldoPendiente || saldoPendiente <= 0} className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 order-1 sm:order-2">
              {isSubmitting ? 'Registrando...' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalEditarPago} onClose={() => setModalEditarPago(false)} title="Editar Pago" size="sm">
        <form onSubmit={handleSubmit(handleActualizarPago)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input type="number" step="0.01" {...register('monto', { valueAsNumber: true })} className={`w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.monto ? 'border-red-400' : 'border-gray-300'}`} />
            </div>
            {errors.monto && <p className="text-red-600 text-xs mt-1">{errors.monto.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
            <select {...register('metodoPago')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.metodoPago ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">Seleccione</option>
              {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input {...register('referencia')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factor de cambio</label>
            <input type="number" step="0.01" {...register('factorCambio', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-[11px] text-gray-500 mt-1">Dejar en blanco para mantener el original</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalEditarPago(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 order-1 sm:order-2">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-800 truncate" title={value}>{value || '—'}</p>
  </div>
);

export default InvoiceDetailPage;