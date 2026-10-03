import { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCargos, createCargo, updateCargo, deleteCargo } from '../../services/cargoService';
import toast from 'react-hot-toast';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
});

const CargosPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre' },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
            className="text-yellow-600 hover:text-yellow-800"
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original.id);
            }}
            className="text-red-600 hover:text-red-800"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await getCargos();
      setItems(res.data);
    } catch (error) {
      toast.error('Error al cargar cargos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '' });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset(item);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cargo? Se eliminarán también los trabajadores asociados.')) return;
    try {
      await deleteCargo(id);
      toast.success('Cargo eliminado');
      loadItems();
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al eliminar';
      toast.error(mensaje);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) {
        await updateCargo(selectedItem.id, data);
        toast.success('Cargo actualizado');
      } else {
        await createCargo(data);
        toast.success('Cargo creado');
      }
      setModalOpen(false);
      loadItems();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Cargos</h1>
        <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto">
          Nuevo Cargo
        </button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        onRowClick={handleEdit}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Editar Cargo' : 'Nuevo Cargo'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
            {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CargosPage;