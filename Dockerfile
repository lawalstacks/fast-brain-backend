FROM node:22.17.0-alpine AS development

# Install Uplink CLI dependencies
RUN apk add --no-cache \
    ca-certificates \
    curl \
    unzip

# Install Uplink CLI
RUN curl -L https://github.com/storj/storj/releases/latest/download/uplink_linux_amd64.zip -o uplink.zip && \
    unzip uplink.zip -d /usr/local/bin && \
    rm uplink.zip && \
    chmod +x /usr/local/bin/uplink


WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "run", "dev"]


FROM node:18-alpine AS production

WORKDIR /usr/scr/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]