require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const fs         = require('fs');
const { exec }   = require('child_process');

const searchRoutes    = require('./routes/search');
const videoInfoRoutes = require('./routes/videoInfo');
const downloadRoutes  = require('./routes/download');
const formatsRoutes   = require('./routes/formats');
const contactRoutes   = require('./routes/contact');
const { apiKeyAuth }  = require('./middleware/auth');

const app      = express();
const PORT     = process.env.PORT || 5000;
const TEMP_DIR = process.env.TEMP_DIR || './temp';

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://gotube-omega.vercel.app',
  ],
  methods:     ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
}));

app.use(express.json());

// ── Public routes (no API key required) ──────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/debug', (_req, res) => {
  const { exec } = require('child_process');
  const ytdlp  = process.env.YTDLP_PATH  ? require('path').resolve(process.env.YTDLP_PATH)  : 'yt-dlp';
  const ffmpeg = process.env.FFMPEG_PATH ? require('path').resolve(process.env.FFMPEG_PATH) : 'ffmpeg';
  const results = {
    ytdlp_path_env:  process.env.YTDLP_PATH  || 'not set',
    ffmpeg_path_env: process.env.FFMPEG_PATH || 'not set',
    ytdlp_resolved:  ytdlp,
    ffmpeg_resolved: ffmpeg,
  };
  let pending = 4;
  const done = () => { if (--pending === 0) res.json(results); };

  exec(`"${ytdlp}" --version`,  (e, o) => { results.ytdlp_version  = e ? `ERROR: ${e.message}` : o.trim(); done(); });
  exec(`"${ffmpeg}" -version`,  (e, o) => { results.ffmpeg_version = e ? `ERROR: ${e.message}` : o.split('\n')[0]; done(); });
  exec('which yt-dlp',          (e, o) => { results.ytdlp_which    = e ? 'NOT FOUND' : o.trim(); done(); });
  exec('which ffmpeg',          (e, o) => { results.ffmpeg_which   = e ? 'NOT FOUND' : o.trim(); done(); });
});

app.use('/api/contact', contactRoutes);

// ── Protected routes (API key required) ──────────────────────────────────────
app.use(apiKeyAuth);

app.use('/search',     searchRoutes);
app.use('/video-info', videoInfoRoutes);
app.use('/download',   downloadRoutes);
app.use('/formats',    formatsRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(PORT, () =>
  console.log(`GoTube backend running on port ${PORT}`)
);
server.timeout = 30 * 60 * 1000;
