import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const client = axios.create({ baseURL: BASE_URL });

// GET /search?q=QUERY → { success, results: [{ title, thumbnail, url, id }] }
export const searchVideos = (q) =>
  client.get('/search', { params: { q } }).then(r => r.data.results);

// GET /api/video?url=VIDEO_URL → { success, title, thumbnail, formats }
export const getVideoData = (url) =>
  client.get('/api/video', { params: { url } }).then(r => r.data);

export default client;
