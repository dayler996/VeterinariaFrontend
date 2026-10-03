import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrabajadores, createTrabajador, updateTrabajador, deleteTrabajador } from '../../services/trabajadorService';
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
  cedula: z.string().min(1, 'Cédula requerida'),
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/trabajadores/${row.original.id}/editar`);
          }}
          className="text-yellow-600 hover:text-yellow-800"
        >
          Editar
        </button>
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
    reset({
      sexo: 'M',
      foto: '',
      activo: true
    });
    setModalOpen(true);
  };

  const handleEdit = (trabajador) => {
    setSelectedTrabajador(trabajador);
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

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este trabajador?')) return;
    try {
      await deleteTrabajador(id);
      toast.success('Trabajador desactivado');
      loadData();
    } catch (error) {
      toast.error('Error al desactivar');
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
        onRowClick={(row) => navigate(`/trabajadores/${row.id}`)} // ← Navega al detalle
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ... resto del formulario (igual) */}
        </form>
      </Modal>
    </div>
  );
};

export default TrabajadoresPage;