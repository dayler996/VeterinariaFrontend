import api from './api';

/* ── Configuraciones generales (CRUD existente) ── */
export const getConfiguraciones = () => api.get('/configuracion');
export const getConfiguracion = (clave) => api.get(`/configuracion/${clave}`);
export const createConfiguracion = (data) => api.post('/configuracion', data);
export const updateConfiguracion = (clave, data) => api.put(`/configuracion/${clave}`, data);
export const deleteConfiguracion = (clave) => api.delete(`/configuracion/${clave}`);

/* ── Tasa BCV automática ── */
export const getBCVRate = async () => {
  const res = await api.get('/configuracion/bcv-rate');
  return res.data;
};

/* ── Configuración PÚBLICA (sin auth) — para el login ── */
/**
 * Devuelve nombre y logo del tenant SIN requerir token.
 * Se usa en la pantalla de login para mostrar el branding.
 *
 * @returns {Promise<{data:{nombre:string, logo:string|null}}>}
 */
export const getConfiguracionPublica = () => api.get('/configuracion/publica');