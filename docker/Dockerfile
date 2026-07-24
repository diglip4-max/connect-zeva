# ============ Stage 1: Build client ============
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build
# Output: /app/client/dist

# ============ Stage 2: Build server ============
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build
# Output: /app/server/dist

# ============ Stage 3: Production ============
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# server ka production deps + build
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server-build /app/server/dist ./dist

# client ka build output, server ke andar static-serve karne ke liye
COPY --from=client-build /app/client/dist ./client-dist

EXPOSE 5000
CMD ["node", "dist/server.js"]