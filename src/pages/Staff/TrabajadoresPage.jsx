import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrabajadores, createTrabajador, updateTrabajador } from '../../services/trabajadorService';
import { getCargos } from '../../services/cargoService';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImageUploader from '../../components/common/ImageUploader';
import toast from 'react-hot-toast';

const trabajadorSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .max(10, 'Máximo 10 dígitos'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  cargoId: z.number({ required_error: 'Cargo requerido' }),
  foto: z.string().optional(),
  activo: z.boolean().default(true),
});

const TrabajadoresPage = () => {
  const navigate = useNavigate();
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [cedulaDisplay, setCedulaDisplay] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: { sexo: 'M', activo: true }
  });

  const foto = watch('foto');

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Cédula', accessorKey: 'cedula' },
    { header: 'Cargo', accessorKey: 'cargo.nombre' },
    { header: 'Activo', accessorKey: 'activo', cell: ({ getValue }) => getValue() ? 'Sí' : 'No' },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/trabajadores/${row.original.id}/editar`)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            Editar
          </button>
          <button
            onClick={() => handleToggleActivo(row.original)}
            className={row.original.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
          >
            {row.original.activo ? 'Desactivar' : 'Activar'}
          </button>
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
      const [trabRes, carRes] = await Promise.all([
        getTrabajadores(null, mostrarInactivos),
        getCargos(),
      ]);
      setTrabajadores(trabRes.data);
      setCargos(carRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedTrabajador(null);
    setCedulaDisplay('');
    reset({
      sexo: 'M',
      foto: '',
      activo: true
    });
    setModalOpen(true);
  };

  const handleEdit = (trabajador) => {
    setSelectedTrabajador(trabajador);
    setCedulaDisplay(trabajador.cedula || '');
    reset({
      nombre: trabajador.nombre,
      cedula: trabajador.cedula,
      sexo: trabajador.sexo,
      fechaNacimiento: trabajador.fechaNacimiento ? new Date(trabajador.fechaNacimiento).toISOString().split('T')[0] : '',
      cargoId: trabajador.cargoId,
      foto: trabajador.foto || '',
      activo: trabajador.activo,
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (trabajador) => {
    const accion = trabajador.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este trabajador?`)) return;
    try {
      await updateTrabajador(trabajador.id, { ...trabajador, activo: !trabajador.activo });
      toast.success(`Trabajador ${accion}do`);
      loadData();
    } catch (error) {
      toast.error(`Error al ${accion} trabajador`);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (selectedTrabajador) {
        await updateTrabajador(selectedTrabajador.id, data);
        toast.success('Trabajador actualizado');
      } else {
        await createTrabajador(data);
        toast.success('Trabajador creado');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Personal</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar inactivos
          </label>
          <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto">
            Nuevo Trabajador
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={trabajadores}
        onRowClick={(row) => navigate(`/trabajadores/${row.id}`)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
            {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Cédula</label>
            <input
              type="text"
              value={cedulaDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                if (raw.length <= 10) {
                  setCedulaDisplay(raw);
                  setValue('cedula', raw, { shouldValidate: true });
                }
              }}
              className="mt-1 block w-full border rounded p-2"
              placeholder=""
            />
            <input type="hidden" {...register('cedula')} />
            {errors.cedula && <p className="text-red-600 text-sm">{errors.cedula.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Sexo</label>
            <select {...register('sexo')} className="mt-1 block w-full border rounded p-2">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            {errors.sexo && <p className="text-red-600 text-sm">{errors.sexo.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Fecha de Nacimiento</label>
            <input type="date" {...register('fechaNacimiento')} className="mt-1 block w-full border rounded p-2" />
            {errors.fechaNacimiento && <p className="text-red-600 text-sm">{errors.fechaNacimiento.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Cargo</label>
            <select {...register('cargoId', { valueAsNumber: true })} className="mt-1 block w-full border rounded p-2">
              <option value="">Seleccione</option>
              {cargos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.cargoId && <p className="text-red-600 text-sm">{errors.cargoId.message}</p>}
          </div>
          <div>
            <ImageUploader
              value={foto}
              onChange={(url) => setValue('foto', url)}
              folder="trabajador"
              label="Foto del trabajador"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('activo')} id="activoTrabajador" />
            <label htmlFor="activoTrabajador" className="text-sm font-medium">Activo</label>
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

export default TrabajadoresPage;