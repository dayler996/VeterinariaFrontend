import api from './api'

export const getFacturas = (params) => api.get('/facturas', { params })
export const getFactura = (id) => api.get(`/facturas/${id}`)
export const createFactura = (data) => api.post('/facturas', data)
export const updateFactura = (id, data) => api.put(`/facturas/${id}`, data)
export const deleteFactura = (id) => api.delete(`/facturas/${id}`)
export const registrarPago = (facturaId, data) => api.post(`/facturas/${facturaId}/pagos`, data)
export const anularFactura = (id) => api.patch(`/facturas/${id}/anular`)