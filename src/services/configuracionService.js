import api from './api';

export const getConfiguraciones = () => api.get('/configuraciones');
export const getConfiguracion = (clave) => api.get(`/configuraciones/${clave}`);
export const createConfiguracion = (data) => api.post('/configuraciones', data);
export const updateConfiguracion = (clave, data) => api.put(`/configuraciones/${clave}`, data);
export const deleteConfiguracion = (clave) => api.delete(`/configuraciones/${clave}`);