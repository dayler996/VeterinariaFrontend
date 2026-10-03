// frontend/src/utils/imageUtils.js
// export const getImageUrl = (url) => {
//   if (!url) return null;
  
//   // Si la URL ya es relativa (empieza con /), la construimos con la API base
//   if (url.startsWith('/')) {
//     const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '').replace(/\/$/, '');
//     return `${baseUrl}${url}`;
//   }
  
//   // Si es absoluta, intentamos reemplazar la IP si es necesario
//   try {
//     const urlObj = new URL(url);
//     const apiUrl = new URL(import.meta.env.VITE_API_URL);
    
//     // Si el hostname de la URL guardada no coincide con el actual, lo reemplazamos
//     if (urlObj.hostname !== apiUrl.hostname || urlObj.port !== apiUrl.port) {
//       // Reconstruir la URL con el nuevo host y puerto
//       return `${apiUrl.protocol}//${apiUrl.host}${urlObj.pathname}${urlObj.search}`;
//     }
//   } catch (e) {
//     // Si no es una URL válida, devolvemos la original
//     console.warn('URL inválida, se devuelve sin cambios:', url);
//   }
  
//   return url;
// };

// frontend/src/utils/imageUtils.js
export const getImageUrl = (url) => {
  if (!url) return null;
  // Si la URL es relativa (empieza con /) o absoluta, la devolvemos sin modificar.
  // El navegador resolverá las rutas relativas usando el origen actual (con subdominio).
  return url;
};