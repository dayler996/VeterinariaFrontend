import api from './api';

export const getParametrosFactura = () => api.get('/parametros-factura');
export const getParametroFactura = (clave) => api.get(`/parametros-factura/${clave}`);
export const createParametroFactura = (data) => api.post('/parametros-factura', data);
export const updateParametroFactura = (clave, data) => api.put(`/parametros-factura/${clave}`, data);
export const deleteParametroFactura = (clave) => api.delete(`/parametros-factura/${clave}`);

/**
 * Crea o actualiza un parámetro en una sola llamada.
 * El backend hace upsert por clave, así evitamos el ping-pong
 * update → create cuando el parámetro no existe.
 *
 * @param {{clave:string, valor:string, descripcion?:string}} data
 */
export const upsertParametroFactura = (data) => api.post('/parametros-factura/upsert', data);