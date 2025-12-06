# Development stage
FROM node:22-alpine AS development

RUN apk add --no-cache \
    ca-certificates \
    curl \
    wget \
    unzip \
    python3 \
    make \
    g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000
CMD ["npm", "run", "dev"]

# Build stage
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache \
    ca-certificates \
    curl \
    wget \
    tini

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Try npm ci first, fallback to npm install
RUN npm ci --omit=dev || npm install --omit=dev --production

COPY --from=build /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8000/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]