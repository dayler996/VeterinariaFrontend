import { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getEstadosCita, createEstadoCita, updateEstadoCita, deleteEstadoCita } from '../../services/crudCatalogoService';
import toast from 'react-hot-toast';

const schema = z.object({ nombre: z.string().min(1, 'Nombre requerido') });

const EstadosCitaPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await getEstadosCita();
      setItems(res.data);
    } catch { toast.error('Error al cargar estados'); }
    finally { setLoading(false); }
  };

  const handleNew = () => { setSelectedItem(null); reset({ nombre: '' }); setModalOpen(true); };
  const handleEdit = (item) => { setSelectedItem(item); reset(item); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este estado de cita? Se eliminarán también las citas asociadas.')) return;
    try {
      await deleteEstadoCita(id);
      toast.success('Estado eliminado');
      loadItems();
    } catch (error) { toast.error(error.response?.data?.error || 'Error al eliminar'); }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateEstadoCita(selectedItem.id, data);
      else await createEstadoCita(data);
      toast.success(selectedItem ? 'Estado actualizado' : 'Estado creado');
      setModalOpen(false); loadItems();
    } catch { toast.error('Error al guardar'); }
  };

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre', cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue()}</span> },
    {
      id: 'acciones', header: 'Acciones', cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleEdit(row.original)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Editar">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => handleDelete(row.original.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Eliminar">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Estados de Cita</h1>
          <p className="text-xs sm:text-sm text-gray-500">{items.length} {items.length === 1 ? 'estado' : 'estados'}</p>
        </div>
        <button onClick={handleNew} className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo Estado
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-2xl">📌</div>
          <p className="text-gray-500 text-sm">No hay estados registrados</p>
          <button onClick={handleNew} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">+ Crear el primero</button>
        </div>
      ) : (
        <DataTable columns={columns} data={items} onRowClick={handleEdit} showGlobalFilter={false} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Editar Estado' : 'Nuevo Estado'} size="sm">
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

export default EstadosCitaPage;