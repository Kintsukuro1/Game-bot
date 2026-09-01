import axios from 'axios';

/**
 * Dentro del iframe de Discord Activity, todas las peticiones HTTP pasan
 * por el proxy de Discord. Las rutas deben usar el prefijo `/.proxy`
 * para que Discord las reenvíe correctamente según los URL Mappings
 * configurados en el Developer Portal.
 *
 * Fuera de Discord (desarrollo en navegador), las peticiones van directo
 * al Vite dev server que las redirige al backend local.
 */
function getApiBaseURL(): string {
  const isInsideDiscord = typeof window !== 'undefined' && window.self !== window.top;
  return isInsideDiscord ? '/.proxy/api' : '/api';
}

/** Instancia de Axios preconfigurada con el base URL correcto según el entorno */
export const api = axios.create({
  baseURL: getApiBaseURL(),
});

export default api;
