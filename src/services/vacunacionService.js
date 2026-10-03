import api from './api'

export const getVacunaciones = (mascotaId) => api.get('/vacunaciones', { params: { mascotaId } })
export const getVacunacion = (id) => api.get(`/vacunaciones/${id}`)
export const createVacunacion = (data) => api.post('/vacunaciones', data)
export const updateVacunacion = (id, data) => api.put(`/vacunaciones/${id}`, data)
export const deleteVacunacion = (id) => api.delete(`/vacunaciones/${id}`)