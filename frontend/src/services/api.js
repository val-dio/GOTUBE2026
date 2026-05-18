import axios from 'axios';

const RENDER_BASE = (import.meta.env.VITE_RENDER_URL || '').trim();
const RAILWAY_BASE = (import.meta.env.VITE_RAILWAY_URL || '').trim();

const renderClient = axios.create({ baseURL: RENDER_BASE });
const railwayClient = axios.create({ baseURL: RAILWAY_BASE });

// 1. Search Videos (Render Backend)
export const searchVideos = (q) =>
  renderClient.get('/api/search', { params: { q } }).then(r => r.data.items || []);

// 2. Trending Feed (Render Backend)
export const getTrending = () =>
  renderClient.get('/api/trending').then(r => r.data.items || []);

// 3. Contact Form (Vercel Serverless Function)
export const sendContactMessage = (name, email, message) =>
  axios.post('/api/contact', { name, email, message }).then(r => r.data);

// 4. Get Railway download URL (Railway Backend)
export const getDownloadUrl = (id, format) =>
  `${RAILWAY_BASE}/api/download?id=${encodeURIComponent(id)}&format=${encodeURIComponent(format)}`;

/**
 * 5. Download video as blob with real XHR progress (Railway Backend).
 *    onProgress(percent: number) is called as bytes arrive.
 *    Returns a Promise<Blob>.
 */
export const downloadVideoBlob = (id, format, onProgress) =>
  new Promise((resolve, reject) => {
    const url = getDownloadUrl(id, format);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';

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

    xhr.onerror = () => reject(new Error('Network error — connection failed'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));
    xhr.send();
  });

export { renderClient, railwayClient };
export default renderClient;
