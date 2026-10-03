import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientes, deleteCliente, updateCliente } from '../../services/clienteService' // Asumo que tienes updateCliente
import { DataTable } from '../../components/common/DataTable'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ClientesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.rol?.nombre === 'ADMIN'
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Cédula', accessorKey: 'cedula' },
    { header: 'Teléfono', accessorKey: 'telefono' },
    { header: 'Sexo', accessorKey: 'sexo' },
    { header: 'Activo', accessorKey: 'activo', cell: ({ getValue }) => (getValue() ? 'Sí' : 'No') },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/clientes/${row.original.id}/editar`)}
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
  ]

  useEffect(() => {
    loadClientes()
  }, [mostrarInactivos])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const params = mostrarInactivos ? { incluirInactivos: true } : {}
      const res = await getClientes(params)
      setClientes(res.data)
    } catch (error) {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (cliente) => {
    const accion = cliente.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} este cliente?`)) return
    try {
      await updateCliente(cliente.id, { ...cliente, activo: !cliente.activo })
      toast.success(`Cliente ${accion}do`)
      loadClientes()
    } catch (error) {
      toast.error(`Error al ${accion} cliente`)
    }
  }

  const handleRowClick = (cliente) => {
    navigate(`/clientes/${cliente.id}`)
  }

  const handleNew = () => {
    navigate('/clientes/nuevo')
  }

  if (loading) return <div className="text-center">Cargando...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
              />
              Mostrar inactivos
            </label>
          )}
          <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nuevo Cliente
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={clientes}
        onRowClick={handleRowClick}
        rowClassName={(row) => !row.activo ? 'opacity-50 line-through' : ''}
      />
    </div>
  )
}

export default ClientesPage