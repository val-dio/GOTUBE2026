FROM node:20-slim

# Install ffmpeg and Python (needed for yt-dlp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      python3 \
      python3-pip \
      curl \
      ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip (most reliable method)
RUN pip3 install --break-system-packages yt-dlp || pip3 install yt-dlp

# Verify installations
RUN ffmpeg -version | head -1 && yt-dlp --version

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy all backend source files
COPY . .

# Create temp directory
RUN mkdir -p /app/temp

# Expose port
EXPOSE 5000

CMD ["node", "index.js"]
