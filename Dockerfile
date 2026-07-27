FROM node:24-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1     PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /app
RUN corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build
RUN cp -a .next/standalone /app/runtime-standalone   && mkdir -p /app/runtime-standalone/.next/server/chunks   && if [ -d .next/server/chunks ]; then cp -a .next/server/chunks/. /app/runtime-standalone/.next/server/chunks/; fi   && rm -rf     /app/runtime-standalone/public     /app/runtime-standalone/data     /app/runtime-standalone/release     /app/runtime-standalone/scripts     /app/runtime-standalone/Dockerfile     /app/runtime-standalone/docker-compose.yml     /app/runtime-standalone/README.md     /app/runtime-standalone/AGENTS.md     /app/runtime-standalone/tsconfig.tsbuildinfo   && find /app/runtime-standalone/.next/server -type f \( -name "*.map" -o -name "*.nft.json" \) -delete   && mkdir -p /app/runtime-public   && cp -a public/. /app/runtime-public/   && rm -rf /app/runtime-public/uploads

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production     NEXT_TELEMETRY_DISABLED=1     HOSTNAME=0.0.0.0     PORT=3000

RUN chown -R node:node /app

COPY --from=builder --chown=node:node /app/runtime-standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/runtime-public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
