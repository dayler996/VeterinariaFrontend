export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-ES')
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('es-ES')
}

export const formatCurrency = (value) => {
  return `$${Number(value).toFixed(2)}`
}