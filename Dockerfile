FROM node:18-slim AS base

# Install dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 make g++ gcc sqlite3 libsqlite3-dev \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm rebuild better-sqlite3 --build-from-source

# Copy application code
COPY . .

# Ensure public directory exists
RUN mkdir -p public

# Build application
RUN npm run build

FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Create user
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create data directory
RUN mkdir -p data && chown -R nextjs:nodejs data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
