import api from './api';

export const getCargos = () => api.get('/cargos');
export const getCargo = (id) => api.get(`/cargos/${id}`);
export const createCargo = (data) => api.post('/cargos', data);
export const updateCargo = (id, data) => api.put(`/cargos/${id}`, data);
export const deleteCargo = (id) => api.delete(`/cargos/${id}`);