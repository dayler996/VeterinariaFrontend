import api from './api';

export const getConsultas = (params) => api.get('/consultas', { params });
export const getConsulta = (id) => api.get(`/consultas/${id}`);
export const createConsulta = (data) => api.post('/consultas', data);
export const updateConsulta = (id, data) => api.put(`/consultas/${id}`, data);
export const deleteConsulta = (id) => api.delete(`/consultas/${id}`);