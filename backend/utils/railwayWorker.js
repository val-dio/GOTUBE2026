const axios = require('axios');

const WORKER_URL = process.env.RAILWAY_WORKER_URL
  || 'https://ytdlp-worker-production.up.railway.app/download';

/**
 * Fetch video info + formats from Railway yt-dlp worker.
 * Returns { title, thumbnail, duration, formats }
 * where formats = [{ quality, url, type }]
 */
const getVideoFromWorker = async (videoUrl) => {
  const { data } = await axios.get(WORKER_URL, {
    params:  { url: videoUrl },
    timeout: 60000,
  });

  // Normalise formats into clean { quality, url, type } objects
  const rawFormats = Array.isArray(data.formats) ? data.formats : [];

  const mp4Formats = rawFormats
    .filter(f => f.url && (f.ext === 'mp4' || f.vcodec !== 'none'))
    .map(f => ({
      quality: f.format_note || f.height ? `${f.height || f.format_note}p` : f.format_id,
      url:     f.url,
      type:    'mp4',
    }))
    // Remove duplicates by quality label
    .filter((f, i, arr) => arr.findIndex(x => x.quality === f.quality) === i)
    .sort((a, b) => {
      const n = s => parseInt(s) || 0;
      return n(a.quality) - n(b.quality);
    });

  // Best audio stream for MP3
  const audioStream = rawFormats
    .filter(f => f.url && f.acodec !== 'none' && (f.vcodec === 'none' || !f.vcodec))
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

  const mp3Format = audioStream
    ? [{ quality: 'mp3', url: audioStream.url, type: 'mp3' }]
    : [];

  return {
    title:     data.title     || '',
    thumbnail: data.thumbnail || '',
    duration:  data.duration  || 0,
    formats:   [...mp4Formats, ...mp3Format],
  };
};

module.exports = { getVideoFromWorker };
