import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  monto: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  metodoPago: z.string().min(1, 'Método de pago requerido'),
  referencia: z.string().optional(),
  facturaId: z.number({ required_error: 'Factura requerida' }),
});

const PagoForm = ({ initialData, onSave, onCancel, facturas }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || { metodoPago: 'EFECTIVO' }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Factura</label>
        <select {...register('facturaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          {facturas.map(f => (
            <option key={f.id} value={f.id}>{f.numero} - {f.cliente?.nombre} (Saldo: ${f.saldoPendiente})</option>
          ))}
        </select>
        {errors.facturaId && <p className="text-red-600 text-sm">{errors.facturaId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Monto</label>
        <input type="number" step="0.01" {...register('monto', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
        {errors.monto && <p className="text-red-600 text-sm">{errors.monto.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Método de Pago</label>
        <select {...register('metodoPago')} className="mt-1 block w-full border rounded p-2">
          <option value="EFECTIVO">Efectivo</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="TRANSFERENCIA">Transferencia</option>
        </select>
        {errors.metodoPago && <p className="text-red-600 text-sm">{errors.metodoPago.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Referencia (opcional)</label>
        <input {...register('referencia')} className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default PagoForm;