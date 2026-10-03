import api from './api';

export const getMascotas = (params) => api.get('/mascotas', { params });
export const getMascota = (id) => api.get(`/mascotas/${id}`);
export const createMascota = (data) => api.post('/mascotas', data);
export const updateMascota = (id, data) => api.put(`/mascotas/${id}`, data);
export const deleteMascota = (id) => api.delete(`/mascotas/${id}`);

// ======================
// Funciones para listados paginados por mascota
// ======================
export const getConsultasByMascota = (id, page = 1, limit = 10) =>
  api.get(`/mascotas/${id}/consultas`, { params: { page, limit } });

export const getVacunacionesByMascota = (id, page = 1, limit = 10) =>
  api.get(`/mascotas/${id}/vacunaciones`, { params: { page, limit } });

export const getEstudiosByMascota = (id, page = 1, limit = 10) =>
  api.get(`/mascotas/${id}/estudios`, { params: { page, limit } });

export const getOperacionesByMascota = (id, page = 1, limit = 10) =>
  api.get(`/mascotas/${id}/operaciones`, { params: { page, limit } });

export const getEsteticaByMascota = (id, page = 1, limit = 10) =>
  api.get(`/mascotas/${id}/estetica`, { params: { page, limit } });

export const getHospitalizacionesByMascota = (id, page = 1, limit = 10) =>
  api.get(`/mascotas/${id}/hospitalizaciones`, { params: { page, limit } });

export const getHistorialMedico = (id, params = {}) =>
  api.get(`/mascotas/${id}/historial`, { params });