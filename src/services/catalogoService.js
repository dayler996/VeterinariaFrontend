import api from './api'

export const getAllCatalogos = () => api.get('/catalogos/all')
export const getRoles = () => api.get('/catalogos/roles')
export const getCargos = () => api.get('/catalogos/cargos')
export const getEspecies = () => api.get('/catalogos/especies')
export const getEstadosCita = () => api.get('/catalogos/estados-cita')
export const getTiposEstudio = () => api.get('/catalogos/tipos-estudio')
export const getTiposOperacion = () => api.get('/catalogos/tipos-operacion')
export const getTiposEstetica = () => api.get('/catalogos/tipos-estetica')
export const getVacunas = () => api.get('/catalogos/vacunas')