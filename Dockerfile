# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


# --- Runtime stage ---
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -S bot && adduser -S bot -G bot \
    && mkdir -p /app/data /app/logs \
    && chown -R bot:bot /app

USER bot

CMD ["node", "dist/bot.js"]
