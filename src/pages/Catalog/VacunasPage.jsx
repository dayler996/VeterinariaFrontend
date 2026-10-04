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
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { loadData(); }, [mostrarInactivos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = mostrarInactivos ? { incluirInactivos: true } : {};
      const [vacRes, espRes] = await Promise.all([getVacunas(params), getEspecies()]);
      setItems(vacRes.data);
      setEspecies(espRes.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const handleNew = () => { setSelectedItem(null); reset({ nombre: '', descripcion: '', especieId: '' }); setModalOpen(true); };
  const handleEdit = (item) => { setSelectedItem(item); reset({ nombre: item.nombre, descripcion: item.descripcion, especieId: item.especieId }); setModalOpen(true); };

  const handleToggleActivo = async (item) => {
    const accion = item.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} esta vacuna?`)) return;
    try {
      await updateVacuna(item.id, { ...item, activo: !item.activo });
      toast.success(`Vacuna ${accion === 'desactivar' ? 'desactivada' : 'activada'}`);
      loadData();
    } catch { toast.error(`Error al ${accion} vacuna`); }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedItem) await updateVacuna(selectedItem.id, data);
      else await createVacuna(data);
      toast.success(selectedItem ? 'Vacuna actualizada' : 'Vacuna creada');
      setModalOpen(false); loadData();
    } catch { toast.error('Error al guardar'); }
  };

  const itemsFiltrados = items
    .filter(v => !filtroEspecie || v.especieId === parseInt(filtroEspecie))
    .filter(v => !busqueda || v.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando...</div>;

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Vacunas</h1>
          <p className="text-xs sm:text-sm text-gray-500">{itemsFiltrados.length} de {items.length} vacunas</p>
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
            Nueva Vacuna
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
            <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <select value={filtroEspecie} onChange={(e) => setFiltroEspecie(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Todas las especies</option>
            {especies.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>

      {itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-2xl">💉</div>
          <p className="text-gray-500 text-sm">{busqueda || filtroEspecie ? 'No hay vacunas que coincidan' : 'No hay vacunas registradas'}</p>
          {!busqueda && !filtroEspecie && <button onClick={handleNew} className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">+ Crear la primera</button>}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Especie</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemsFiltrados.map(item => (
                  <tr key={item.id} onClick={() => handleEdit(item)} className={`cursor-pointer hover:bg-blue-50/50 transition ${!item.activo ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.descripcion || ''}>{item.descripcion || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.especie?.nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(item)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Editar">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleToggleActivo(item)} className={`p-2 rounded-lg ${item.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={item.activo ? 'Desactivar' : 'Activar'}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64A9 9 0 11 5.64 6.64M12 2v10" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {itemsFiltrados.map(item => (
              <div key={item.id} onClick={() => handleEdit(item)} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition ${!item.activo ? 'opacity-60' : ''}`}>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-800">{item.nombre}</p>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${item.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.activo ? 'On' : 'Off'}
                    </span>
                  </div>
                  {item.especie?.nombre && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-medium mb-2">
                      {item.especie.nombre}
                    </span>
                  )}
                  {item.descripcion && <p className="text-xs text-gray-600 line-clamp-2">{item.descripcion}</p>}
                </div>
                <div className="flex border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEdit(item)} className="flex-1 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50">Editar</button>
                  {isAdmin && (
                    <>
                      <div className="w-px bg-gray-100" />
                      <button onClick={() => handleToggleActivo(item)} className={`flex-1 py-2.5 text-xs font-medium ${item.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {item.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Editar Vacuna' : 'Nueva Vacuna'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input {...register('nombre')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea {...register('descripcion')} rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
            <select {...register('especieId', { valueAsNumber: true })} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.especieId ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">Seleccione</option>
              {especies.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            {errors.especieId && <p className="text-red-600 text-xs mt-1">{errors.especieId.message}</p>}
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

export default VacunasPage;