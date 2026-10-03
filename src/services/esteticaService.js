import api from './api';

export const getServiciosEstetica = (mascotaId) => api.get('/estetica', { params: { mascotaId } });
export const getServicioEstetica = (id) => api.get(`/estetica/${id}`);
export const createServicioEstetica = (data) => api.post('/estetica', data);
export const updateServicioEstetica = (id, data) => api.put(`/estetica/${id}`, data);
export const deleteServicioEstetica = (id) => api.delete(`/estetica/${id}`);