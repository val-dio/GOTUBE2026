const axios        = require('axios');
const { searchYtDlp } = require('../utils/ytdlp');

// ── In-memory cache ──────────────────────────────────────────────────────────
// key: "query|maxResults"  value: { results, source, expiresAt }
const cache  = new Map();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

// Track whether the YouTube API is currently usable.
// If it fails with a quota/auth error we skip it for the rest of the process lifetime
// (resets on backend restart, which is fine for a local app).
let ytApiDisabled = false;

// ── YouTube Data API search ──────────────────────────────────────────────────
const searchYouTubeApi = async (q, maxResults) => {
  const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part:       'snippet',
      q,
      maxResults,
      type:       'video',
      key:        process.env.YOUTUBE_API_KEY,
    },
    headers: {
      Referer: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    },
    timeout: 8000,
  });

  return data.items.map(item => ({
    videoId:     item.id.videoId,
    title:       item.snippet.title,
    channel:     item.snippet.channelTitle,
    thumbnail:   item.snippet.thumbnails.medium.url,
    publishedAt: item.snippet.publishedAt,
  }));
};

// ── Controller ───────────────────────────────────────────────────────────────
const search = async (req, res) => {
  const { q, maxResults = 16 } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const query    = q.trim();
  const limit    = Math.min(parseInt(maxResults, 10) || 16, 25);
  const cacheKey = `${query.toLowerCase()}|${limit}`;

  // ── 1. Cache hit ────────────────────────────────────────────────────────
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[search] cache hit — "${query}"`);
    return res.json({ results: cached.results, source: cached.source, cached: true });
  }

  // ── 2. Try YouTube Data API (unless already known to be down) ───────────
  if (!ytApiDisabled && process.env.YOUTUBE_API_KEY) {
    try {
      const results = await searchYouTubeApi(query, limit);
      cache.set(cacheKey, { results, source: 'youtube_api', expiresAt: Date.now() + TTL_MS });
      console.log(`[search] youtube_api — "${query}" (${results.length} results)`);
      return res.json({ results, source: 'youtube_api' });
    } catch (err) {
      const status = err.response?.status;
      const reason = err.response?.data?.error?.message || err.message;

      // 403 = quota exceeded or key invalid → disable API for this session
      // 400 = bad request → also fall through
      if (status === 403 || status === 400 || status === 429) {
        console.warn(`[search] YouTube API unavailable (${status}): ${reason} — switching to yt-dlp`);
        ytApiDisabled = true;
      } else {
        // Network error, timeout, etc. — try yt-dlp this time but don't disable API permanently
        console.warn(`[search] YouTube API error: ${reason} — falling back to yt-dlp`);
      }
    }
  }

  // ── 3. Fallback: yt-dlp ytsearch ────────────────────────────────────────
  try {
    const results = await searchYtDlp(query, limit);
    if (!results.length) {
      return res.status(404).json({ error: 'No results found, try again later.' });
    }
    cache.set(cacheKey, { results, source: 'yt-dlp', expiresAt: Date.now() + TTL_MS });
    console.log(`[search] yt-dlp — "${query}" (${results.length} results)`);
    return res.json({ results, source: 'yt-dlp' });
  } catch (err) {
    console.error(`[search] yt-dlp fallback failed: ${err.message}`);
    return res.status(500).json({ error: 'No results found, try again later.' });
  }
};

module.exports = { search };
