import api from './api';

export const getCitas = (params) => api.get('/citas', { params });
export const getCita = (id) => api.get(`/citas/${id}`);
export const createCita = (data) => api.post('/citas', data);
export const updateCita = (id, data) => api.put(`/citas/${id}`, data);
export const deleteCita = (id) => api.delete(`/citas/${id}`);
export const updateCitaEstado = (id, estadoCitaId) => api.patch(`/citas/${id}/estado`, { estadoCitaId });