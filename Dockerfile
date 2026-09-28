FROM node:22-slim

# Install system dependencies required by node-pty and better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    bash \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build client and server
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV MSPC_PORT=3000
ENV MSPC_DATA_DIR=/data

CMD ["node", "dist/server/index.js"]
