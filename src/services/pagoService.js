import api from './api';

export const getPagos = (facturaId) => api.get('/pagos', { params: { facturaId } });
export const getPago = (id) => api.get(`/pagos/${id}`);
export const createPago = (data) => api.post('/pagos', data);
export const updatePago = (id, data) => api.put(`/pagos/${id}`, data);
export const deletePago = (id) => api.delete(`/pagos/${id}`);