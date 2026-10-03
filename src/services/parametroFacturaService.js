import api from './api';

export const getParametrosFactura = () => api.get('/parametros-factura');
export const getParametroFactura = (clave) => api.get(`/parametros-factura/${clave}`);
export const createParametroFactura = (data) => api.post('/parametros-factura', data);
export const updateParametroFactura = (clave, data) => api.put(`/parametros-factura/${clave}`, data);
export const deleteParametroFactura = (clave) => api.delete(`/parametros-factura/${clave}`);