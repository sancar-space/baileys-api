FROM oven/bun:1.2-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN bun install --production

FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json package.json ./

VOLUME /app/storage
EXPOSE 3025

CMD ["bun", "start"]
