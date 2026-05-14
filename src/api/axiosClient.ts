import axios from 'axios';

// [CAMBIO CLAVE] Regresamos a la versión estable en local. 
// Apuntamos al puerto 5019 que Visual Studio asignó por defecto.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5019/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patrón Interceptor: Mantiene la sesión activa enviando el token en cada llamada
api.interceptors.request.use(
  (config) => {
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