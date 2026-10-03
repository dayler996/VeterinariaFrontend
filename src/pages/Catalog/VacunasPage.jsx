import { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getVacunas, createVacuna, updateVacuna, deleteVacuna } from '../../services/crudCatalogoService';
import { getEspecies } from '../../services/especieService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  especieId: z.number({ required_error: 'Especie requerida' }),
});

const VacunasPage = () => {
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

  useEffect(() => {
    loadData();
  }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const [vacRes, espRes] = await Promise.all([
        getVacunas(params),
        getEspecies()
      ]);
      setItems(vacRes.data);
      setEspecies(espRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    reset({ nombre: '', descripcion: '', especieId: '' });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    reset({ nombre: item.nombre, descripcion: item.descripcion, especieId: item.especieId });
    setModalOpen(true);
  };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} esta vacuna?`)) return;
    try {
      await updateVacuna(item.id, { ...item, activo: !item.activo });
      toast.success(`Vacuna ${accion === 'desactivar' ? 'desactivada' : 'activada'}`);
      loadData();
    } catch (error) {
      toast.error(`Error al ${accion} vacuna`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) {
        await updateVacuna(selectedItem.id, data);
        toast.success('Vacuna actualizada');
      } else {
        await createVacuna(data);
        toast.success('Vacuna creada');
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
        <h1 className="text-xl sm:text-2xl font-bold">Vacunas</h1>
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
            Nueva Vacuna
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">ID</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Nombre</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5 hidden md:table-cell">Descripción</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Especie</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Activo</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Acciones</th>
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
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell max-w-xs truncate" title={item.descripcion || ''}>
                  {item.descripcion || '-'}
                </td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.especie?.nombre}</td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Editar Vacuna' : 'Nueva Vacuna'}>
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

export default VacunasPage;