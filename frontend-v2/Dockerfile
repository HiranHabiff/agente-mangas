# Frontend V2 Dockerfile - Next.js

# Stage 1: Base
FROM node:22-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 3: Development
FROM base AS development
ENV PORT=3013
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3013
CMD ["npm", "run", "dev"]

# Stage 4: Builder (para produção)
FROM base AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 5: Production (standalone)
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3013
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3013
CMD ["node", "server.js"]

# Default: development
FROM development
