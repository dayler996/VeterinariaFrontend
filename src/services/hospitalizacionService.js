import api from './api'

export const getHospitalizaciones = () => api.get('/hospitalizaciones')
export const getHospitalizacion = (id) => api.get(`/hospitalizaciones/${id}`)
export const createHospitalizacion = (data) => api.post('/hospitalizaciones', data)
export const updateHospitalizacion = (id, data) => api.put(`/hospitalizaciones/${id}`, data)
export const deleteHospitalizacion = (id) => api.delete(`/hospitalizaciones/${id}`)
export const deleteHospitalizacionCascade = (id) => api.delete(`/hospitalizaciones/${id}/cascade`)