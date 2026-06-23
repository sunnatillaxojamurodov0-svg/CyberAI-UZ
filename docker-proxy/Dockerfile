FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY server.js ./

RUN addgroup -g 1001 -S cyberai && \
    adduser -S cyberai -u 1001 -G cyberai

USER cyberai

EXPOSE 2377

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:2377/api/health || exit 1

CMD ["node", "server.js"]
