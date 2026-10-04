import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: API_URL, withCredentials: true, timeout: 30000 });

// Access cookies are short-lived; on a 401 we try one silent refresh, then retry.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status = err.response?.status;
    const isAuthCall = /\/auth\/(refresh|login|otp|logout)/.test(original.url || '');
    if (status === 401 && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh').finally(() => {
          refreshing = null;
        });
        const r = await refreshing;
        if (r?.data?.data?.user) return api(original);
      } catch {
        // fall through to the original error
      }
    }
    const message = err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'The server took too long to respond' : err.message) || 'Something went wrong';
    const e = new Error(message);
    e.status = status;
    e.errors = err.response?.data?.errors;
    return Promise.reject(e);
  }
);

// Download a protected file (PDF/CSV/ICS) with the auth cookie.
export async function download(path, filename) {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function uploadPhotos(files, folder = 'pickups') {
  const form = new FormData();
  [...files].slice(0, 6).forEach((f) => form.append('photos', f));
  const res = await api.post(`/uploads?folder=${folder}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.data.urls;
}

export default api;
