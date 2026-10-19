import axios from 'axios';

const RENDER_BASE  = (import.meta.env.VITE_RENDER_URL  || '').trim();
const RAILWAY_BASE = (import.meta.env.VITE_RAILWAY_URL || '').trim();

/* ─── Axios instances with timeout ─── */
const renderClient = axios.create({
  baseURL: RENDER_BASE,
  timeout: 15_000,
});

const railwayClient = axios.create({
  baseURL: RAILWAY_BASE,
  timeout: 90_000, // downloads can take longer
});

/* Simple retry: 1 extra attempt on network errors */
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

/* ─── Search Videos (Render) ─── */
export const searchVideos = (q) =>
  renderClient.get('/api/search', { params: { q } }).then(r => r.data.items || []);

/* ─── Trending Feed (Render) ─── */
export const getTrending = () =>
  renderClient.get('/api/trending').then(r => r.data.items || []);

/* ─── Contact Form (Vercel Serverless) ─── */
export const sendContactMessage = (name, email, message) =>
  axios.post('/api/contact', { name, email, message }).then(r => r.data);

/* ─── Get dynamic formats for a video ─── */
export const getVideoFormats = (id) =>
  axios.get(`${RAILWAY_BASE}/api/formats`, { params: { id }, timeout: 20_000 }).then(r => r.data.formats || []);

/* ─── Download URL builder (Railway/Render download service) ─── */
export const getDownloadUrl = (id, format, title) => {
  const params = new URLSearchParams({ id, format });
  if (title) params.set('title', title);
  return `${RAILWAY_BASE}/api/download?${params.toString()}`;
};

/**
 * Download video as blob with real XHR progress tracking.
 * onProgress(percent: number) is called as bytes arrive.
 * Returns a Promise<Blob>.
 */
export const downloadVideoBlob = (id, format, title, onProgress) =>
  new Promise((resolve, reject) => {
    const url = getDownloadUrl(id, format, title);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.timeout = 180_000;

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
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
