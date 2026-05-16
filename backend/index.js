require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const searchRoutes   = require('./routes/search');
const videoInfoRoutes = require('./routes/videoInfo');
const downloadRoutes  = require('./routes/download');
const formatsRoutes   = require('./routes/formats');
const contactRoutes   = require('./routes/contact');
const { apiKeyAuth }  = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const TEMP_DIR     = process.env.TEMP_DIR || './temp';

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// CORS — only allow configured frontend origin
const cors = require("cors");

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  methods: ["GET", "POST"],
  credentials: true
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

app.use(express.json());

// Contact route — public, no API key needed
app.use('/api/contact', contactRoutes);

// API key auth on all routes below
app.use(apiKeyAuth);

// Routes
app.use('/search',     searchRoutes);
app.use('/video-info', videoInfoRoutes);
app.use('/download',   downloadRoutes);
app.use('/formats',    formatsRoutes);

// Health check (no auth needed — add before apiKeyAuth if desired)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(PORT, () => console.log(`GoTube backend running on port ${PORT}`));
// Allow up to 30 minutes for large downloads
server.timeout = 30 * 60 * 1000;
