import api from './api';

export const getMonitoreos = (hospitalizacionId) => api.get('/monitoreos', { params: { hospitalizacionId } });
export const getMonitoreo = (id) => api.get(`/monitoreos/${id}`);
export const createMonitoreo = (data) => api.post('/monitoreos', data);
export const updateMonitoreo = (id, data) => api.put(`/monitoreos/${id}`, data);
export const deleteMonitoreo = (id) => api.delete(`/monitoreos/${id}`);