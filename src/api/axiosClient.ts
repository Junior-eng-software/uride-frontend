import axios from 'axios';

// [CAMBIO CLAVE] Regresamos a la versión estable en local. 
// Apuntamos al puerto 5019 que Visual Studio asignó por defecto.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5019/api';

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patrón Interceptor: Mantiene la sesión activa enviando el token en cada llamada
axiosClient.interceptors.request.use(
  (config) => {
    // Mantenemos 'accessToken' tal como lo leemos en tu ProtectedRoute
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Exportación por defecto obligatoria para que los servicios lo importen correctamente
export default axiosClient;

export const api = axiosClient;