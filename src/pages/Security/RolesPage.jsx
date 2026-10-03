import { useState, useEffect } from 'react'
import { getRoles, createRol, updateRol, deleteRol } from '../../services/rolService'
import { DataTable } from '../../components/common/DataTable'
import { Modal } from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const roleSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
})

const RolesPage = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRol, setSelectedRol] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roleSchema),
  })

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre' },
  ]

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const res = await getRoles()
      setRoles(res.data)
    } catch (error) {
      toast.error('Error al cargar roles')
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setSelectedRol(null)
    reset({ nombre: '' })
    setModalOpen(true)
  }

  const handleEdit = (rol) => {
    setSelectedRol(rol)
    reset(rol)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar rol?')) return
    try {
      await deleteRol(id)
      toast.success('Rol eliminado')
      loadRoles()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const onSubmit = async (data) => {
    try {
      if (selectedRol) {
        await updateRol(selectedRol.id, data)
        toast.success('Rol actualizado')
      } else {
        await createRol(data)
        toast.success('Rol creado')
      }
      setModalOpen(false)
      loadRoles()
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  if (loading) return <div className="text-center">Cargando...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Roles</h1>
        <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto">
          Nuevo Rol
        </button>
      </div>

      <DataTable columns={columns} data={roles} onRowClick={handleEdit} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedRol ? 'Editar Rol' : 'Nuevo Rol'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
            {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default RolesPage