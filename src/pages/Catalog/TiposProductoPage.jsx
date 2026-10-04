import { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTiposProducto, createTipoProducto, updateTipoProducto, deleteTipoProducto } from '../../services/crudCatalogoService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({ nombre: z.string().min(1, 'Nombre requerido') });

const TiposProductoPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { loadItems(); }, [mostrarInactivos]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const res = await getTiposProducto(params);
      setItems(res.data);
    } catch { toast.error('Error al cargar tipos de producto'); }
    finally { setLoading(false); }
  };

  const handleNew = () => { setSelectedItem(null); reset({ nombre: '' }); setModalOpen(true); };
  const handleEdit = (item) => { setSelectedItem(item); reset(item); setModalOpen(true); };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este tipo de producto?`)) return;
    try {
      await updateTipoProducto(item.id, { ...item, activo: !item.activo });
      toast.success(`Tipo de producto ${accion === 'desactivar' ? 'desactivado' : 'activado'}`);
      loadItems();
    } catch { toast.error(`Error al ${accion} tipo`); }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateTipoProducto(selectedItem.id, data);
      else await createTipoProducto(data);
      toast.success(selectedItem ? 'Tipo actualizado' : 'Tipo creado');
      setModalOpen(false); loadItems();
    } catch { toast.error('Error al guardar'); }
  };

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre', cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue()}</span> },
    {
      header: 'Estado', accessorKey: 'activo',
      cell: ({ getValue }) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      id: 'acciones', header: 'Acciones', cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleEdit(row.original)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Editar">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          {isAdmin && (
            <button onClick={() => handleToggleActivo(row.original)} className={`p-2 rounded-lg ${row.original.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={row.original.activo ? 'Desactivar' : 'Activar'}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64A9 9 0 11 5.64 6.64M12 2v10" /></svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tipos de Producto</h1>
          <p className="text-xs sm:text-sm text-gray-500">{items.length} {items.length === 1 ? 'tipo' : 'tipos'}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && (
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              Inactivos
            </label>
          )}
          <button onClick={handleNew} className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nuevo Tipo
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-2xl">🏷️</div>
          <p className="text-gray-500 text-sm">No hay tipos de producto</p>
          <button onClick={handleNew} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">+ Crear el primero</button>
        </div>
      ) : (
        <DataTable columns={columns} data={items} onRowClick={handleEdit} showGlobalFilter={false} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input {...register('nombre')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition order-2 sm:order-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 order-1 sm:order-2">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TiposProductoPage;