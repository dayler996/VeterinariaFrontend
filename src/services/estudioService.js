import api from './api'

export const getEstudios = (mascotaId) => api.get('/estudios', { params: { mascotaId } })
export const getEstudio = (id) => api.get(`/estudios/${id}`)
export const createEstudio = (data) => api.post('/estudios', data)
export const updateEstudio = (id, data) => api.put(`/estudios/${id}`, data)
export const deleteEstudio = (id) => api.delete(`/estudios/${id}`)