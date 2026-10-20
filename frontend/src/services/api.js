import axios from 'axios';

// Strip trailing slash to prevent //api/download double-slash bug
const RENDER_BASE  = (import.meta.env.VITE_RENDER_URL  || '').trim().replace(/\/$/, '');
const RAILWAY_BASE = (import.meta.env.VITE_RAILWAY_URL || '').trim().replace(/\/$/, '');

/* ─── Axios instances ─── */
const renderClient = axios.create({ baseURL: RENDER_BASE, timeout: 15_000 });
const railwayClient = axios.create({ baseURL: RAILWAY_BASE, timeout: 90_000 });

/* Simple retry on network errors */
const withRetry = (client) => {
  client.interceptors.response.use(null, async (error) => {
    const config = error.config;
    if (!config || config._retried) return Promise.reject(error);
    if (!error.response) {
      config._retried = true;
      return client(config);
    }
    return Promise.reject(error);
  });
};
withRetry(renderClient);
withRetry(railwayClient);

/* ─── Search (Render) ─── */
export const searchVideos = (q) =>
  renderClient.get('/api/search', { params: { q } }).then(r => r.data.items || []);

/* ─── Trending (Render) ─── */
export const getTrending = () =>
  renderClient.get('/api/trending').then(r => r.data.items || []);

/* ─── Contact Form (Vercel Serverless) ─── */
export const sendContactMessage = (name, email, message) =>
  axios.post('/api/contact', { name, email, message }).then(r => r.data);

/* ─── Dynamic formats (Railway) ─── */
export const getVideoFormats = (id) =>
  railwayClient.get('/api/formats', { params: { id }, timeout: 60_000 }).then(r => r.data.formats || []);

/* ─── Download blob with XHR progress (Railway) ─── */
export const downloadVideoBlob = (id, format, title, onProgress) =>
  new Promise((resolve, reject) => {
    const params = new URLSearchParams({ id, format });
    if (title) params.set('title', title);
    const url = `${RAILWAY_BASE}/api/download?${params.toString()}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.timeout = 300_000; // 5 min for large files

    xhr.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Server returned HTTP ${xhr.status}`));
      }
    };

    xhr.onerror   = () => reject(new Error('Network error — connection failed'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));
    xhr.send();
  });

export { renderClient, railwayClient };
