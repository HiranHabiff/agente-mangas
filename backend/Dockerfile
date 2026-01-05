# Backend Dockerfile - Multi-stage para produção otimizada

# Stage 1: Base
FROM node:22-alpine AS base
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Stage 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 3: Development
FROM base AS development
ENV PORT=3010
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3010
CMD ["npm", "run", "dev"]

# Stage 4: Builder (para produção)
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 5: Production
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3010
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 3010
CMD ["node", "dist/api/server.js"]

# Default: development
FROM development
