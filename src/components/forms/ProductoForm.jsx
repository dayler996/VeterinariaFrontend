import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  stock: z.number().min(0, 'Stock no puede ser negativo'),
  stockMinimo: z.number().min(0),
  precioCosto: z.number().min(0, 'Precio costo requerido'),
  precioVenta: z.number().min(0, 'Precio venta requerido'),
  vacunaId: z.number().optional().nullable(),
});

const ProductoForm = ({ initialData, onSave, onCancel, vacunas }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || { stock: 0, stockMinimo: 5 }
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
        <label className="block text-sm font-medium">Nombre</label>
        <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
        {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea {...register('descripcion')} rows="2" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Stock</label>
        <input type="number" {...register('stock', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
        {errors.stock && <p className="text-red-600 text-sm">{errors.stock.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Stock Mínimo</label>
        <input type="number" {...register('stockMinimo', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
        {errors.stockMinimo && <p className="text-red-600 text-sm">{errors.stockMinimo.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Precio Costo</label>
        <input type="number" step="0.01" {...register('precioCosto', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
        {errors.precioCosto && <p className="text-red-600 text-sm">{errors.precioCosto.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Precio Venta</label>
        <input type="number" step="0.01" {...register('precioVenta', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2" />
        {errors.precioVenta && <p className="text-red-600 text-sm">{errors.precioVenta.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Vacuna asociada (opcional)</label>
        <select {...register('vacunaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
          <option value="">Ninguna</option>
          {vacunas.map(v => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      </div>
    </form>
  );
};

export default ProductoForm;