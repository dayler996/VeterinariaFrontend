import api from './api'

export const getOperaciones = (mascotaId) => api.get('/operaciones', { params: { mascotaId } })
export const getOperacion = (id) => api.get(`/operaciones/${id}`)
export const createOperacion = (data) => api.post('/operaciones', data)
export const updateOperacion = (id, data) => api.put(`/operaciones/${id}`, data)
export const deleteOperacion = (id) => api.delete(`/operaciones/${id}`)