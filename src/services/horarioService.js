import api from './api'

export const getHorarios = (trabajadorId) => api.get('/horarios', { params: { trabajadorId } })
export const getHorario = (id) => api.get(`/horarios/${id}`)
export const createHorario = (data) => api.post('/horarios', data)
export const updateHorario = (id, data) => api.put(`/horarios/${id}`, data)
export const deleteHorario = (id) => api.delete(`/horarios/${id}`)