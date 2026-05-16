import axios from 'axios';

const BASE_URL    = import.meta.env.VITE_API_BASE_URL || 'https://ytdlp-worker-production.up.railway.app';
const API_KEY     = import.meta.env.VITE_API_KEY      || 'gotube-secret-api-key-change-in-production';
const RAILWAY_URL = 'https://ytdlp-worker-production.up.railway.app';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'x-api-key': API_KEY },
});

export const searchVideos = (q, maxResults = 16) =>
  client.get('/search', { params: { q, maxResults } }).then(r => r.data.results);

export const getVideoInfo = (id) =>
  client.get('/video-info', { params: { id } }).then(r => r.data);

/** Fetch video data + direct download formats from Railway worker */
export const getVideoData = (videoUrl) =>
  fetch(`${RAILWAY_URL}/api/video?url=${encodeURIComponent(videoUrl)}`)
    .then(r => { if (!r.ok) throw new Error('Failed to fetch video data'); return r.json(); });

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

export { BASE_URL, API_KEY };
export default client;
