import api from './api'

export const getEstadosCita = () => api.get('/estados-cita')
export const getEstadoCita = (id) => api.get(`/estados-cita/${id}`)
export const createEstadoCita = (data) => api.post('/estados-cita', data)
export const updateEstadoCita = (id, data) => api.put(`/estados-cita/${id}`, data)
export const deleteEstadoCita = (id) => api.delete(`/estados-cita/${id}`)