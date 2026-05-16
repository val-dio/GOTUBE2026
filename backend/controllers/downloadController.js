const fs   = require('fs');
const path = require('path');
const { downloadMedia, safeDelete } = require('../utils/ytdlp');

/**
 * POST /download
 * Uses Server-Sent Events to stream real yt-dlp progress to the client,
 * then sends the file as a base64 data URL in the final SSE event.
 * Temp file is deleted immediately after.
 */
const download = async (req, res) => {
  const { url, format } = req.body;

  if (!url || !format)
    return res.status(400).json({ error: '"url" and "format" are required' });

  // ── SSE headers ────────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  const send = (data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let tempFile = null;

  try {
    const { filePath, filename } = await downloadMedia(url, format, (patch) => {
      send({ type: 'progress', ...patch });
    });

    tempFile = filePath;

    send({ type: 'progress', status: 'Completed', percent: 100, speed: '', eta: '' });

    // Read file and send as base64 so the browser can save it
    const buffer   = fs.readFileSync(filePath);
    const b64      = buffer.toString('base64');
    const ext      = path.extname(filename).slice(1);
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';

    send({ type: 'file', filename, mimeType, data: b64 });

  } catch (err) {
    send({ type: 'error', message: err.message || 'Download failed' });
  } finally {
    safeDelete(tempFile);
    if (!res.writableEnded) res.end();
  }
};

module.exports = { download };
