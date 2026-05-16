import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_KEY  = import.meta.env.VITE_API_KEY      || 'gotube-secret-api-key-change-in-production';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-api-key': API_KEY },
});

export const searchVideos = (q, maxResults = 16) =>
  client.get('/search', { params: { q, maxResults } }).then(r => r.data.results);

export const getVideoInfo = (id) =>
  client.get('/video-info', { params: { id } }).then(r => r.data);

/** Fetch real available formats for a video */
export const getFormats = (id) =>
  client.get('/formats', { params: { id } }).then(r => r.data);

export const sendContactMessage = (name, email, message) =>
  fetch(`${BASE_URL}/api/contact`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, message }),
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw { response: { data } };
    return data;
  });

/**
 * Download via SSE — receives real yt-dlp progress events then a base64 file event.
 * onProgress({ percent, status, speed, eta })
 */
export const downloadFile = (url, format, onProgress) =>
  new Promise((resolve, reject) => {
    fetch(`${BASE_URL}/download`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body:    JSON.stringify({ url, format }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Download failed' }));
        return reject(new Error(err.error || 'Download failed'));
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      const processEvents = (chunk) => {
        buffer += chunk;
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete last part

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const msg = JSON.parse(line.slice(5).trim());

            if (msg.type === 'progress') {
              onProgress({
                percent: msg.percent ?? 0,
                status:  msg.status  ?? '',
                speed:   msg.speed   ?? '',
                eta:     msg.eta     ?? '',
              });
            }

            if (msg.type === 'file') {
              // Decode base64 and trigger browser download
              const binary = atob(msg.data);
              const bytes  = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const blob    = new Blob([bytes], { type: msg.mimeType });
              const blobUrl = URL.createObjectURL(blob);
              const a       = document.createElement('a');
              a.href        = blobUrl;
              a.download    = msg.filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(blobUrl);
              resolve();
            }

            if (msg.type === 'error') {
              reject(new Error(msg.message || 'Download failed'));
            }
          } catch (_) {}
        }
      };

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          processEvents(decoder.decode(value, { stream: true }));
        }
      };

      pump().catch(reject);
    }).catch(reject);
  });

export { BASE_URL, API_KEY };
export default client;
