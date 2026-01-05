# Backend V2 Dockerfile - NestJS + Prisma

# Stage 1: Base
FROM node:22-alpine AS base
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client \
    openssl

# Stage 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 3: Development
FROM base AS development
ENV PORT=3011
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3011
CMD ["npm", "run", "start:dev"]

# Stage 4: Builder (para produção)
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 5: Production
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3011
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./
COPY prisma ./prisma
EXPOSE 3011
CMD ["node", "dist/main.js"]

# Default: development
FROM development
