FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules node_modules
COPY --from=builder --chown=node:node /app/dist dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
