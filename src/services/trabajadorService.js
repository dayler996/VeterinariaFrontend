import api from './api';

export const getTrabajadores = (cargo = null, incluirInactivos = false) => 
  api.get('/trabajadores', { params: { cargo, incluirInactivos } });

export const getTrabajador = (id) => api.get(`/trabajadores/${id}`);

export const getTrabajadorByCedula = (cedula) => 
  api.get(`/trabajadores/buscar/cedula/${cedula}`);

export const createTrabajador = (data) => api.post('/trabajadores', data);

export const updateTrabajador = (id, data) => api.put(`/trabajadores/${id}`, data);

export const deleteTrabajador = (id) => api.delete(`/trabajadores/${id}`);

// ======================
// Funciones para listados paginados por trabajador
// ======================
export const getConsultasByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/consultas`, { params: { page, limit } });

export const getOperacionesByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/operaciones`, { params: { page, limit } });

export const getVacunasByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/vacunas`, { params: { page, limit } });

export const getEstudiosByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/estudios`, { params: { page, limit } });

export const getMonitoreosByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/monitoreos`, { params: { page, limit } });

export const getEsteticaByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/estetica`, { params: { page, limit } });

export const getFacturasByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/facturas`, { params: { page, limit } });

export const getCitasByTrabajador = (id, page = 1, limit = 10) => 
  api.get(`/trabajadores/${id}/citas`, { params: { page, limit } });