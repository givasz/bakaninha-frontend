import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const ADMIN_LOGIN = `/${(process.env.REACT_APP_ADMIN_PATH || 'painel-bk-2026').replace(/^\/+|\/+$/g, '')}/login`;

// Decodifica o JWT e confere a expiração. Token ausente/malformado/expirado = inválido.
export function isTokenValid(token) {
  if (!token) return false;
  try {
    const part = token.split('.')[1];
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function clearSession() {
  localStorage.removeItem('baka_token');
  localStorage.removeItem('baka_user');
}

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('baka_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expirado/inválido durante o uso: limpa a sessão e volta sempre pro login,
// pra ninguém ficar "dentro" do painel sem conseguir fazer nada.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = localStorage.getItem('baka_token');
      clearSession();
      if (hadToken && !window.location.pathname.endsWith('/login')) {
        window.location.assign(ADMIN_LOGIN);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL, clearSession };
