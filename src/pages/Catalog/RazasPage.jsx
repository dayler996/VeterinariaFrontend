import { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getRazas, createRaza, updateRaza, deleteRaza } from '../../services/razaService';
import { getEspecies } from '../../services/especieService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  especieId: z.number({ required_error: 'Especie requerida' }),
});

const RazasPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const [items, setItems] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Especie', accessorKey: 'especie.nombre' },
    {
      header: 'Activo',
      accessorKey: 'activo',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(row.original)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            Editar
          </button>
          {isAdmin && (
            <button
              onClick={() => handleToggleActivo(row.original)}
              className={row.original.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
            >
              {row.original.activo ? 'Desactivar' : 'Activar'}
            </button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadData();
  }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const [razasRes, especiesRes] = await Promise.all([
        getRazas(params),
        getEspecies() // especies siempre activas en el select
      ]);
      setItems(razasRes.data);
      setEspecies(especiesRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '', especieId: '' });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({ nombre: item.nombre, especieId: item.especieId });
    setModalOpen(true);
  };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} esta raza?`)) return;
    try {
      await updateRaza(item.id, { ...item, activo: !item.activo });
      toast.success(`Raza ${accion === 'desactivar' ? 'desactivada' : 'activada'}`);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error(`Error al ${accion} raza`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) {
        await updateRaza(selectedItem.id, data);
        toast.success('Raza actualizada');
      } else {
        await createRaza(data);
        toast.success('Raza creada');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Razas</h1>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
              />
              Mostrar inactivos
            </label>
          )}
          <button onClick={handleNew} className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm hover:bg-blue-700">
            Nueva Raza
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        onRowClick={handleEdit}
        rowClassName={(row) => !row.activo ? 'opacity-50 line-through' : ''}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Editar Raza' : 'Nueva Raza'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
            {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Especie</label>
            <select {...register('especieId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
              <option value="">Seleccione</option>
              {especies.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
            {errors.especieId && <p className="text-red-600 text-sm">{errors.especieId.message}</p>}
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

export default RazasPage;