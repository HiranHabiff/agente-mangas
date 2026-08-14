# Frontend V3 Dockerfile - React + Vite (SPA, sem Next.js)

# Stage 1: Base
FROM node:22-alpine AS base
WORKDIR /app

# Stage 2: Development (Vite dev server com HMR)
FROM base AS development
ENV PORT=3013
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3013
CMD ["npm", "run", "dev", "--", "--host"]

# Stage 3: Builder (gera os estaticos em /app/dist)
FROM base AS builder
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 4: Production (nginx servindo os estaticos)
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3013
CMD ["nginx", "-g", "daemon off;"]

# Default: development
FROM development
