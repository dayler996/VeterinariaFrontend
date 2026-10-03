import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PrivateRoute = ({ roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.rol?.nombre)) {
    return <Navigate to="/dashboard" />
  }
  return <Outlet />
}

export default PrivateRoute