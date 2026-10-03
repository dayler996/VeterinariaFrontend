// // Claves para localStorage
// const COMPANY_NAME_KEY = 'company_name';
// const COMPANY_LOGO_KEY = 'company_logo';

// export const getCompanyName = () => {
//   return localStorage.getItem(COMPANY_NAME_KEY) || 'Mi Veterinaria';
// };

// export const setCompanyName = (name) => {
//   localStorage.setItem(COMPANY_NAME_KEY, name);
// };

// export const getCompanyLogo = () => {
//   return localStorage.getItem(COMPANY_LOGO_KEY) || null;
// };

// export const setCompanyLogo = (logoUrl) => {
//   if (logoUrl) {
//     localStorage.setItem(COMPANY_LOGO_KEY, logoUrl);
//   } else {
//     localStorage.removeItem(COMPANY_LOGO_KEY);
//   }
// };

// export const getCompanySettings = () => {
//   return {
//     name: getCompanyName(),
//     logo: getCompanyLogo(),
//   };
// };
import api from './api';

// Obtener configuración de la empresa
export const getCompanySettings = async () => {
  try {
    const res = await api.get('/configuracion');
    return {
      name: res.data.nombre || 'Mi Veterinaria',
      logo: res.data.logo || null
    };
  } catch (error) {
    console.error('Error al cargar configuración', error);
    return { name: 'Mi Veterinaria', logo: null };
  }
};

// Guardar configuración (envía nombre y logo juntos)
export const updateCompanySettings = async (nombre, logo) => {
  try {
    const res = await api.put('/configuracion', { nombre, logo });
    return res.data;
  } catch (error) {
    console.error('Error al guardar configuración', error);
    throw error;
  }
};

// Funciones específicas (para compatibilidad con otros componentes)
export const getCompanyName = async () => {
  const settings = await getCompanySettings();
  return settings.name;
};

export const getCompanyLogo = async () => {
  const settings = await getCompanySettings();
  return settings.logo;
};

export const setCompanyName = async (name) => {
  const settings = await getCompanySettings();
  await updateCompanySettings(name, settings.logo);
};

export const setCompanyLogo = async (logoUrl) => {
  const settings = await getCompanySettings();
  await updateCompanySettings(settings.name, logoUrl);
};