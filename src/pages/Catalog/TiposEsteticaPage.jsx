import { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getTiposEstetica,
  createTipoEstetica,
  updateTipoEstetica,
  deleteTipoEstetica
} from '../../services/crudCatalogoService';
import { getCategorias } from '../../services/crudCatalogoService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  categoriaId: z.number().optional().nullable(),
  precioVenta: z.number().positive().optional().nullable(),
});

const TiposEsteticaPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
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
    { header: 'Categoría', accessorKey: 'categoria.nombre' },
    {
      header: 'Precio Venta ($)',
      accessorKey: 'precioVenta',
      cell: ({ getValue }) => getValue() ? `$${getValue()}` : '-'
    },
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
      const [tiposRes, catsRes] = await Promise.all([
        getTiposEstetica(params),
        getCategorias({ tipo: 'estetica' })
      ]);
      setItems(tiposRes.data);
      setCategorias(catsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '', categoriaId: '', precioVenta: '' });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({
      nombre: item.nombre,
      categoriaId: item.categoriaId || '',
      precioVenta: item.precioVenta || '',
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este servicio de estética?`)) return;
    try {
      await updateTipoEstetica(item.id, { ...item, activo: !item.activo });
      toast.success(`Servicio de estética ${accion === 'desactivar' ? 'desactivado' : 'activado'}`);
      loadData();
    } catch (error) {
      toast.error(`Error al ${accion} servicio de estética`);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null,
        precioVenta: data.precioVenta || null
      };
      if (selectedItem) {
        await updateTipoEstetica(selectedItem.id, payload);
        toast.success('Servicio de estética actualizado');
      } else {
        await createTipoEstetica(payload);
        toast.success('Servicio de estética creado');
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
        <h1 className="text-xl sm:text-2xl font-bold">Servicios de Estética</h1>
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
            Nuevo Servicio
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Categoría</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Precio Venta ($)</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleEdit(item)}
                className={`cursor-pointer hover:bg-gray-50 ${!item.activo ? 'opacity-50 line-through' : ''}`}
              >
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.nombre}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{item.categoria?.nombre || '-'}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{item.precioVenta ? `$${item.precioVenta}` : '-'}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      Editar
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleActivo(item)}
                        className={item.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                      >
                        {item.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Editar Servicio de Estética' : 'Nuevo Servicio de Estética'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
            {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Categoría (opcional)</label>
            <select {...register('categoriaId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
              <option value="">Sin categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Precio Venta ($)</label>
            <input
              type="number"
              step="0.01"
              {...register('precioVenta', { valueAsNumber: true })}
              className="mt-1 block w-full border rounded p-2"
            />
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

export default TiposEsteticaPage;