import api from './api';

// Tipos de Estudio
export const getTiposEstudio = (params) => api.get('/tipos-estudio', { params });
export const getTipoEstudio = (id) => api.get(`/tipos-estudio/${id}`);
export const createTipoEstudio = (data) => api.post('/tipos-estudio', data);
export const updateTipoEstudio = (id, data) => api.put(`/tipos-estudio/${id}`, data);
export const deleteTipoEstudio = (id) => api.delete(`/tipos-estudio/${id}`);

// Tipos de Operación
export const getTiposOperacion = (params) => api.get('/tipos-operacion', { params });
export const getTipoOperacion = (id) => api.get(`/tipos-operacion/${id}`);
export const createTipoOperacion = (data) => api.post('/tipos-operacion', data);
export const updateTipoOperacion = (id, data) => api.put(`/tipos-operacion/${id}`, data);
export const deleteTipoOperacion = (id) => api.delete(`/tipos-operacion/${id}`);

// Tipos de Estética
export const getTiposEstetica = (params) => api.get('/tipos-estetica', { params });
export const getTipoEstetica = (id) => api.get(`/tipos-estetica/${id}`);
export const createTipoEstetica = (data) => api.post('/tipos-estetica', data);
export const updateTipoEstetica = (id, data) => api.put(`/tipos-estetica/${id}`, data);
export const deleteTipoEstetica = (id) => api.delete(`/tipos-estetica/${id}`);

// Estados de Cita
export const getEstadosCita = (params) => api.get('/estados-cita', { params });
export const getEstadoCita = (id) => api.get(`/estados-cita/${id}`);
export const createEstadoCita = (data) => api.post('/estados-cita', data);
export const updateEstadoCita = (id, data) => api.put(`/estados-cita/${id}`, data);
export const deleteEstadoCita = (id) => api.delete(`/estados-cita/${id}`);

// Especies
export const getEspecies = (params) => api.get('/especies', { params });
export const getEspecie = (id) => api.get(`/especies/${id}`);
export const createEspecie = (data) => api.post('/especies', data);
export const updateEspecie = (id, data) => api.put(`/especies/${id}`, data);
export const deleteEspecie = (id) => api.delete(`/especies/${id}`);

// Razas
export const getRazas = (params) => api.get('/razas', { params });
export const getRaza = (id) => api.get(`/razas/${id}`);
export const createRaza = (data) => api.post('/razas', data);
export const updateRaza = (id, data) => api.put(`/razas/${id}`, data);
export const deleteRaza = (id) => api.delete(`/razas/${id}`);

// Vacunas
export const getVacunas = (params) => api.get('/vacunas', { params });
export const getVacuna = (id) => api.get(`/vacunas/${id}`);
export const createVacuna = (data) => api.post('/vacunas', data);
export const updateVacuna = (id, data) => api.put(`/vacunas/${id}`, data);
export const deleteVacuna = (id) => api.delete(`/vacunas/${id}`);

// Categorías
export const getCategorias = (params) => api.get('/categorias', { params });
export const getCategoria = (id) => api.get(`/categorias/${id}`);
export const createCategoria = (data) => api.post('/categorias', data);
export const updateCategoria = (id, data) => api.put(`/categorias/${id}`, data);
export const deleteCategoria = (id) => api.delete(`/categorias/${id}`);

// Tipos de Producto
export const getTiposProducto = (params) => api.get('/tipos-producto', { params });
export const getTipoProducto = (id) => api.get(`/tipos-producto/${id}`);
export const createTipoProducto = (data) => api.post('/tipos-producto', data);
export const updateTipoProducto = (id, data) => api.put(`/tipos-producto/${id}`, data);
export const deleteTipoProducto = (id) => api.delete(`/tipos-producto/${id}`);