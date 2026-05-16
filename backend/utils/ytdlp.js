const { execSync, spawnSync, spawn } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const https = require('https');
const http  = require('http');

// ── Self-install yt-dlp if not present ───────────────────────────────────────
const YTDLP_LOCAL = path.resolve(__dirname, '../yt-dlp');

const ensureYtDlp = () => {
  // Already installed locally
  if (fs.existsSync(YTDLP_LOCAL)) {
    console.log('[yt-dlp] found at', YTDLP_LOCAL);
    return YTDLP_LOCAL;
  }
  // Available on system PATH
  const check = spawnSync('yt-dlp', ['--version'], { encoding: 'utf8' });
  if (check.status === 0) {
    console.log('[yt-dlp] found on PATH, version:', check.stdout.trim());
    return 'yt-dlp';
  }
  // Download it
  console.log('[yt-dlp] not found — downloading binary...');
  try {
    execSync(
      `curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "${YTDLP_LOCAL}" && chmod +x "${YTDLP_LOCAL}"`,
      { stdio: 'inherit' }
    );
    const ver = spawnSync(YTDLP_LOCAL, ['--version'], { encoding: 'utf8' });
    console.log('[yt-dlp] installed, version:', ver.stdout.trim());
    return YTDLP_LOCAL;
  } catch (e) {
    console.error('[yt-dlp] install failed:', e.message);
    return 'yt-dlp'; // fallback, will fail gracefully later
  }
};

const YTDLP    = ensureYtDlp();
const FFMPEG   = 'ffmpeg';
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || '/tmp/gotube');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

console.log('[debug] YTDLP:', YTDLP);
console.log('[debug] TEMP_DIR:', TEMP_DIR);

const cookiesFlag = () => {
  const exists = fs.existsSync(COOKIES_PATH);

  if (!exists) {
    console.warn('[cookies] NOT FOUND at runtime:', COOKIES_PATH);
    return [];
  }

  return [
    '--cookies', COOKIES_PATH,

    // 🔥 IMPORTANT BYPASS FLAGS
    '--extractor-args', 'youtube:player_client=android',
    '--user-agent', 'com.google.android.youtube/19.09.37',

    '--force-ipv4',
    '--geo-bypass',
    '--no-check-certificate'
  ];
};

// ── Browser headers + flags ───────────────────────────────────────────────────
const COMMON_FLAGS = [
  '--no-playlist',
  '--no-warnings',
  '--force-ipv4',
  '--no-check-certificates',
  '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  '--add-header', 'Accept-Language:en-US,en;q=0.9',
  '--add-header', 'Referer:https://www.youtube.com/',
  '--extractor-args', 'youtube:player_client=tv,web,android',
];

const flags = () => [...COMMON_FLAGS, ...cookiesFlag()];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const getFfmpegDir = () => {
  try { return path.dirname(execSync('which ffmpeg', { encoding: 'utf8' }).trim()); }
  catch { return '/usr/bin'; }
};

const sanitizeFilename = (name) =>
  name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);

const safeDelete = (filePath) => {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
};

// ── Retry ─────────────────────────────────────────────────────────────────────
const withRetry = async (fn, maxRetries = 3) => {
  let lastErr;
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      if (i < maxRetries) {
        const delay = Math.pow(2, i) * 1500;
        console.warn(`[yt-dlp] attempt ${i + 1} failed: ${err.message?.slice(0, 80)} — retry in ${delay}ms`);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
};

// ── Progress parsers ──────────────────────────────────────────────────────────
const PROGRESS_RE = /\[download\]\s+([\d.]+)%\s+of\s+[\d.]+\S+\s+at\s+([\d.]+\S+)\s+ETA\s+(\S+)/;

const parseProgress = (line) => {
  const m = line.match(PROGRESS_RE);
  return m ? { percent: parseFloat(m[1]), speed: m[2], eta: m[3] } : null;
};

const parseStage = (line) => {
  if (/\[download\].*Destination/i.test(line))   return 'Downloading';
  if (/\[Merger\]|Merging formats/i.test(line))  return 'Processing';
  if (/\[ffmpeg\]|\[ExtractAudio\]/i.test(line)) return 'Processing';
  return null;
};

// ── Video meta ────────────────────────────────────────────────────────────────
const getVideoMeta = (url) =>
  withRetry(() => new Promise((resolve, reject) => {
    const proc = spawn(YTDLP, [url, '--dump-single-json', '--skip-download', ...flags()], { shell: false });
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', () => {
      try {
        const info = JSON.parse(out.trim());
        if (info.title) return resolve({
          title:     info.title,
          thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${info.id}/mqdefault.jpg`,
        });
        reject(new Error('No title in metadata'));
      } catch (_) {
        reject(new Error(err.slice(0, 200) || 'Could not fetch metadata'));
      }
    });
    proc.on('error', reject);
    setTimeout(() => { proc.kill(); reject(new Error('getVideoMeta timeout')); }, 30000);
  }));

// ── Format detection ──────────────────────────────────────────────────────────
const HEIGHT_LABELS = {
  144: '144p', 240: '240p', 360: '360p', 480: '480p',
  720: '720p', 1080: '1080p', 1440: '1440p', 2160: '4K', 4320: '8K',
};

const getAvailableFormats = (url) =>
  withRetry(() => new Promise((resolve, reject) => {
    const proc = spawn(YTDLP, [url, '-F', ...flags()], { shell: false });
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      console.log('[debug] -F exit:', code, '\n', out.slice(0, 500));
      if (err) console.log('[debug] -F stderr:', err.slice(0, 200));
      if (code !== 0 && !out) return reject(new Error(err || 'yt-dlp -F failed'));

      const heights = new Set();
      for (const line of out.split('\n')) {
        const m1 = line.match(/\s(\d{2,4})x(\d{2,4})\s/);
        const m2 = line.match(/\b(\d{3,4})p\b/);
        const h  = m1 ? parseInt(m1[2], 10) : m2 ? parseInt(m2[1], 10) : 0;
        if (h > 0) {
          const std = Object.keys(HEIGHT_LABELS).map(Number).find(s => Math.abs(s - h) <= 30);
          if (std) heights.add(std);
        }
      }

      const formats = [...heights].sort((a, b) => a - b).map(h => ({
        quality: HEIGHT_LABELS[h], height: h, formatId: buildFormatSelector(h), ext: 'mp4',
      }));
      formats.push({ quality: 'MP3', height: 0, formatId: 'mp3', ext: 'mp3' });
      console.log('[debug] formats:', formats.map(f => f.quality).join(', '));
      resolve(formats);
    });
    proc.on('error', e => { console.error('[debug] spawn error:', e.message); reject(e); });
    setTimeout(() => { proc.kill(); reject(new Error('getAvailableFormats timeout')); }, 35000);
  }));

const buildFormatSelector = (h) => {
  if (h >= 4320) return 'bestvideo[height<=4320][ext=mp4]+bestaudio[ext=m4a]/best[height<=4320]';
  if (h >= 2160) return 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]';
  return `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${h}][ext=mp4]/best[height<=${h}]`;
};

// ── Download ──────────────────────────────────────────────────────────────────
const downloadMedia = async (url, formatId, onProgress) => {
  const isAudio = formatId === 'mp3';
  onProgress({ status: 'Fetching video info...', percent: 0 });

  let title = `video_${Date.now()}`;
  try { const m = await getVideoMeta(url); title = m.title; } catch (_) {}

  const safeName = sanitizeFilename(title);
  const ext      = isAudio ? 'mp3' : 'mp4';
  const outPath  = path.join(TEMP_DIR, `${safeName}_${Date.now()}.${ext}`);

  onProgress({ status: 'Downloading...', percent: 2 });

  await withRetry(() => new Promise((resolve, reject) => {
    const args = [
      url, '--ffmpeg-location', getFfmpegDir(),
      '-o', outPath, '--embed-thumbnail', '--add-metadata', '--newline', ...flags(),
    ];
    if (isAudio) args.push('-f', 'bestaudio/best', '-x', '--audio-format', 'mp3', '--audio-quality', '0');
    else         args.push('-f', formatId, '--merge-output-format', 'mp4');

    const proc = spawn(YTDLP, args, { shell: false });
    proc.stdout.on('data', chunk => {
      for (const line of chunk.toString().split('\n')) {
        const prog  = parseProgress(line);
        const stage = parseStage(line);
        if (prog)  onProgress({ percent: Math.min(prog.percent, 95), speed: prog.speed, eta: prog.eta });
        if (stage) onProgress({ status: stage, ...(stage === 'Processing' ? { speed: '', eta: '' } : {}) });
      }
    });
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => code !== 0 ? reject(new Error(stderr || `yt-dlp exited ${code}`)) : resolve());
    proc.on('error', e => reject(new Error(`spawn failed: ${e.message}`)));
  }), 2);

  onProgress({ status: 'Finalizing...', percent: 98 });
  return { filePath: findFile(outPath, ext), filename: `${safeName}.${ext}` };
};

const findFile = (expected, ext) => {
  if (fs.existsSync(expected)) return expected;
  const match = fs.readdirSync(TEMP_DIR)
    .filter(f => f.endsWith(`.${ext}`))
    .map(f => ({ f, t: fs.statSync(path.join(TEMP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (match) return path.join(TEMP_DIR, match.f);
  throw new Error('Downloaded file not found');
};

// ── Search ────────────────────────────────────────────────────────────────────
const searchYtDlp = (query, maxResults = 16) =>
  withRetry(() => new Promise((resolve, reject) => {
    const proc = spawn(YTDLP,
      [`ytsearch${maxResults}:${query}`, '--flat-playlist', '--dump-single-json', ...flags()],
      { shell: false }
    );
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      if (code !== 0 && !out.trim()) return reject(new Error(err || 'yt-dlp search failed'));
      try {
        const results = (JSON.parse(out).entries || []).map(v => ({
          videoId:     v.id,
          title:       v.title    || 'Unknown title',
          channel:     v.uploader || v.channel || v.uploader_id || 'Unknown',
          thumbnail:   v.thumbnails ? bestThumb(v.thumbnails) : `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
          publishedAt: v.upload_date ? fmtDate(v.upload_date) : null,
        })).filter(v => v.videoId);
        resolve(results);
      } catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
    });
    proc.on('error', reject);
  }));

const bestThumb = (thumbs) => {
  if (!Array.isArray(thumbs) || !thumbs.length) return null;
  return [...thumbs].sort((a, b) => Math.abs((a.width||0)-320) - Math.abs((b.width||0)-320))[0]?.url
    || thumbs[thumbs.length-1]?.url;
};

const fmtDate = (d) =>
  d?.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T00:00:00Z` : null;

module.exports = { downloadMedia, getAvailableFormats, getVideoMeta, safeDelete, TEMP_DIR, searchYtDlp };
