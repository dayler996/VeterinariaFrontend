import api from './api';

export const getTiposProducto = () => api.get('/tipos-producto');
export const getTipoProducto = (id) => api.get(`/tipos-producto/${id}`);
export const createTipoProducto = (data) => api.post('/tipos-producto', data);
export const updateTipoProducto = (id, data) => api.put(`/tipos-producto/${id}`, data);
export const deleteTipoProducto = (id) => api.delete(`/tipos-producto/${id}`);