#!/usr/bin/env bash
set -e

echo "==> Installing Node dependencies"
npm install

echo "==> Creating local bin directory"
mkdir -p ./bin

# ── Install yt-dlp ────────────────────────────────────────────────────────────
echo "==> Downloading yt-dlp"
curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o ./bin/yt-dlp
chmod +x ./bin/yt-dlp
echo "yt-dlp version: $(./bin/yt-dlp --version)"

# ── Install FFmpeg ────────────────────────────────────────────────────────────
echo "==> Downloading FFmpeg static build"
curl -L "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffmpeg.tar.xz
tar -xf /tmp/ffmpeg.tar.xz -C /tmp/
# Find the extracted ffmpeg binary and copy it
FFMPEG_BIN=$(find /tmp -name "ffmpeg" -type f | head -1)
cp "$FFMPEG_BIN" ./bin/ffmpeg
chmod +x ./bin/ffmpeg
echo "ffmpeg version: $(./bin/ffmpeg -version 2>&1 | head -1)"

echo "==> Build complete"
echo "yt-dlp: $(./bin/yt-dlp --version)"
echo "ffmpeg: $(./bin/ffmpeg -version 2>&1 | head -1)"
