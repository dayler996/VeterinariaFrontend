import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './routes/PrivateRoute'
import PublicRoute from './routes/PublicRoute'
import Layout from './components/common/Layout'
import ErrorBoundary from './components/common/ErrorBoundary';
import { ConfirmProvider } from './context/ConfirmContext';
// Auth
import LoginPage from './pages/Auth/LoginPage'

// Dashboard
import DashboardPage from './pages/Dashboard/DashboardPage'

// Clientes y Mascotas
import ClientesPage from './pages/Clients/ClientesPage'
import NuevoClientePage from './pages/Clients/NuevoClientePage'   // <-- NUEVA IMPORTACIÓN
import ClienteDetailPage from './pages/Clients/ClienteDetailPage'
import MascotaDetailPage from './pages/Clients/MascotaDetailPage'
import NuevaMascotaPage from './pages/Clients/NuevaMascotaPage'
import EditarMascotaPage from './pages/Clients/EditarMascotaPage'
import EditarClientePage from './pages/Clients/EditarClientePage';
import HistorialMedicoPage from './pages/Medical/HistorialMedicoPage';
import FacturasClientePage from './pages/Billing/FacturasClientePage';

// Citas
import AppointmentsPage from './pages/Appointments/AppointmentsPage'
import NuevaCitaPage from './pages/Appointments/NuevaCitaPage'

// Facturación
import InvoicesPage from './pages/Billing/InvoicesPage'
import NuevaFacturaPage from './pages/Billing/NuevaFacturaPage'
import InvoiceDetailPage from './pages/Billing/InvoiceDetailPage'

// Inventario
import ProductosPage from './pages/Inventory/ProductosPage'

// Módulo Médico
import ConsultasPage from './pages/Medical/ConsultasPage'
import NuevaConsultaPage from './pages/Medical/NuevaConsultaPage'
import ConsultaDetailPage from './pages/Medical/ConsultaDetailPage'
import EditarConsultaPage from './pages/Medical/EditarConsultaPage'

import VacunacionesPage from './pages/Medical/VacunacionesPage'
import NuevaVacunacionPage from './pages/Medical/NuevaVacunacionPage'
import VacunacionDetailPage from './pages/Medical/VacunacionDetailPage'
import EditarVacunacionPage from './pages/Medical/EditarVacunacionPage'

// Estudios
import EstudiosPage from './pages/Medical/EstudiosPage'
import NuevoEstudioPage from './pages/Medical/NuevoEstudioPage'
import EstudioDetailPage from './pages/Medical/EstudioDetailPage'
import EditarEstudioPage from './pages/Medical/EditarEstudioPage'

// Operaciones
import OperacionesPage from './pages/Medical/OperacionesPage'
import NuevaOperacionPage from './pages/Medical/NuevaOperacionPage'
import OperacionDetailPage from './pages/Medical/OperacionDetailPage'
import EditarOperacionPage from './pages/Medical/EditarOperacionPage'

// Estética
import ServiciosEsteticaPage from './pages/Medical/ServiciosEsteticaPage'
import NuevoServicioEsteticaPage from './pages/Medical/NuevoServicioEsteticaPage'
import ServicioEsteticaDetailPage from './pages/Medical/ServicioEsteticaDetailPage'
import EditarServicioEsteticaPage from './pages/Medical/EditarServicioEsteticaPage'

// Hospitalizaciones
import HospitalizacionesPage from './pages/Medical/HospitalizacionesPage'
import NuevaHospitalizacionPage from './pages/Medical/NuevaHospitalizacionPage'
import HospitalizacionDetailPage from './pages/Medical/HospitalizacionDetailPage'
import EditarHospitalizacionPage from './pages/Medical/EditarHospitalizacionPage'
import NuevoMonitoreoPage from './pages/Medical/NuevoMonitoreoPage'
import MonitoreoDetailPage from './pages/Medical/MonitoreoDetailPage'
import EditarMonitoreoPage from './pages/Medical/EditarMonitoreoPage'

// Catálogos
import TiposEstudioPage from './pages/Catalog/TiposEstudioPage'
import TiposOperacionPage from './pages/Catalog/TiposOperacionPage'
import TiposEsteticaPage from './pages/Catalog/TiposEsteticaPage'
import EspeciesPage from './pages/Catalog/EspeciesPage'
import RazasPage from './pages/Catalog/RazasPage'
import VacunasPage from './pages/Catalog/VacunasPage'
import EstadosCitaPage from './pages/Catalog/EstadosCitaPage'
import CategoriasPage from './pages/Catalog/CategoriasPage'
import TiposProductoPage from './pages/Catalog/TiposProductoPage';

// Configuración de Factura y Empresa
import FacturaConfigPage from './pages/Settings/FacturaConfigPage'
import CompanySettingsPage from './pages/Settings/CompanySettingsPage'

// Personal y Seguridad
import UsuariosPage from './pages/Security/UsuariosPage'
import RolesPage from './pages/Security/RolesPage'
import TrabajadoresPage from './pages/Staff/TrabajadoresPage'
import TrabajadorDetailPage from './pages/Staff/TrabajadorDetailPage'
import EditarTrabajadorPage from './pages/Staff/EditarTrabajadorPage'
import CargosPage from './pages/Catalog/CargosPage'; 
import LogsPage from './pages/Logs/LogsPage';

// Reportes
import IncomeReportPage from './pages/Reports/IncomeReportPage';

function App() {
  return (
    <BrowserRouter>
    <ErrorBoundary>
      <ConfirmProvider>
      <AuthProvider>
        <Routes>
          {/* Ruta pública: login */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Rutas privadas (requieren autenticación) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Clientes y Mascotas - ORDEN IMPORTANTE */}
              <Route path="/clientes/nuevo" element={<NuevoClientePage />} />
              <Route path="/clientes/:id/facturas" element={<FacturasClientePage />} />
              <Route path="/clientes/:id/editar" element={<EditarClientePage />} />
              <Route path="/clientes/:id/nueva-mascota" element={<NuevaMascotaPage />} />
              <Route path="/clientes/:id" element={<ClienteDetailPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/mascotas/:id" element={<MascotaDetailPage />} />
              <Route path="/mascotas/:id/editar" element={<EditarMascotaPage />} />
              { <Route path="/mascotas/:id/historial" element={<HistorialMedicoPage />} /> }
              

              {/* Citas */}
              <Route path="/citas" element={<AppointmentsPage />} />
              <Route path="/citas/nueva" element={<NuevaCitaPage />} />

              {/* Facturación */}
              <Route path="/facturacion" element={<InvoicesPage />} />
              <Route path="/facturacion/nueva" element={<NuevaFacturaPage />} />
              <Route path="/facturacion/:id" element={<InvoiceDetailPage />} />

              {/* Inventario */}
              <Route path="/inventario" element={<ProductosPage />} />

              {/* Consultas */}
              <Route path="/consultas" element={<ConsultasPage />} />
              <Route path="/consultas/nueva" element={<NuevaConsultaPage />} />
              <Route path="/consultas/:id" element={<ConsultaDetailPage />} />
              <Route path="/consultas/:id/editar" element={<EditarConsultaPage />} />

              {/* Vacunaciones */}
              <Route path="/vacunaciones" element={<VacunacionesPage />} />
              <Route path="/vacunaciones/nueva" element={<NuevaVacunacionPage />} />
              <Route path="/vacunaciones/:id" element={<VacunacionDetailPage />} />
              <Route path="/vacunaciones/:id/editar" element={<EditarVacunacionPage />} />

              {/* Estudios */}
              <Route path="/estudios" element={<EstudiosPage />} />
              <Route path="/estudios/nueva" element={<NuevoEstudioPage />} />
              <Route path="/estudios/:id" element={<EstudioDetailPage />} />
              <Route path="/estudios/:id/editar" element={<EditarEstudioPage />} />

              {/* Operaciones */}
              <Route path="/operaciones" element={<OperacionesPage />} />
              <Route path="/operaciones/nueva" element={<NuevaOperacionPage />} />
              <Route path="/operaciones/:id" element={<OperacionDetailPage />} />
              <Route path="/operaciones/:id/editar" element={<EditarOperacionPage />} />

              {/* Estética */}
              <Route path="/estetica" element={<ServiciosEsteticaPage />} />
              <Route path="/estetica/nueva" element={<NuevoServicioEsteticaPage />} />
              <Route path="/estetica/:id" element={<ServicioEsteticaDetailPage />} />
              <Route path="/estetica/:id/editar" element={<EditarServicioEsteticaPage />} />

              {/* Hospitalizaciones */}
              <Route path="/hospitalizaciones" element={<HospitalizacionesPage />} />
              <Route path="/hospitalizaciones/nueva" element={<NuevaHospitalizacionPage />} />
              <Route path="/hospitalizaciones/:id" element={<HospitalizacionDetailPage />} />
              <Route path="/hospitalizaciones/:id/editar" element={<EditarHospitalizacionPage />} />
              <Route path="/hospitalizaciones/:id/monitoreos/nuevo" element={<NuevoMonitoreoPage />} />

              {/* Monitoreos */}
              <Route path="/monitoreos/:id" element={<MonitoreoDetailPage />} />
              <Route path="/monitoreos/:id/editar" element={<EditarMonitoreoPage />} />

              {/* Catálogos (accesibles para todos) */}
              <Route path="/catalogos/tipos-estudio" element={<TiposEstudioPage />} />
              <Route path="/catalogos/tipos-operacion" element={<TiposOperacionPage />} />
              <Route path="/catalogos/tipos-estetica" element={<TiposEsteticaPage />} />
              <Route path="/catalogos/especies" element={<EspeciesPage />} />
              <Route path="/catalogos/razas" element={<RazasPage />} />
              <Route path="/catalogos/vacunas" element={<VacunasPage />} />
              <Route path="/catalogos/estados-cita" element={<EstadosCitaPage />} />
              <Route path="/catalogos/categorias" element={<CategoriasPage />} />
              <Route path="/catalogos/tipos-producto" element={<TiposProductoPage />} />

              {/* Configuración de Factura (accesible para todos) */}
              <Route path="/configuracion/factura" element={<FacturaConfigPage />} />

              {/* Perfil de trabajador (accesible para todos) */}
              <Route path="/trabajadores/:id" element={<TrabajadorDetailPage />} />

              {/* Rutas de administración (solo ADMIN) */}
              <Route element={<PrivateRoute roles={['ADMIN']} />}>
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/reportes/ingresos" element={<IncomeReportPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/trabajadores" element={<TrabajadoresPage />} />
                <Route path="/trabajadores/:id/editar" element={<EditarTrabajadorPage />} />
                <Route path="/cargos" element={<CargosPage />} />
                <Route path="/configuracion/empresa" element={<CompanySettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
      </ConfirmProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App