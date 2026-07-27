#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-auntie-chen-cn-showcase}"
BUILD_ID="${BUILD_ID:-$(date +%Y%m%d%H%M%S)}"
RELEASE_ROOT="${RELEASE_ROOT:-release}"
PACKAGE_DIR="${RELEASE_ROOT}/${APP_NAME}-${BUILD_ID}"
PACKAGE_ARCHIVE="${APP_NAME}-${BUILD_ID}.tar.gz"
DEFAULT_APP_PORT="${DEFAULT_APP_PORT:-4175}"

prune_standalone() {
  local standalone_dir="$1"

  rm -rf \
    "${standalone_dir}/public" \
    "${standalone_dir}/data" \
    "${standalone_dir}/release" \
    "${standalone_dir}/scripts" \
    "${standalone_dir}/Dockerfile" \
    "${standalone_dir}/docker-compose.yml" \
    "${standalone_dir}/README.md" \
    "${standalone_dir}/AGENTS.md" \
    "${standalone_dir}/tsconfig.tsbuildinfo"

  find "${standalone_dir}/.next/server" -type f \
    \( -name "*.map" -o -name "*.nft.json" \) -delete 2>/dev/null || true
}

merge_turbopack_server_chunks() {
  local standalone_dir="$1"

  if [ ! -d ".next/server/chunks" ]; then
    return
  fi

  mkdir -p "${standalone_dir}/.next/server/chunks"
  cp -a .next/server/chunks/. "${standalone_dir}/.next/server/chunks/"
}

prune_public_assets() {
  local public_dir="$1"

  # Showcase is frontend-only: drop runtime upload workspace if present.
  rm -rf "${public_dir}/uploads"
}

mkdir -p "${RELEASE_ROOT}"

if [ -e "${PACKAGE_DIR}" ]; then
  echo "Package directory already exists: ${PACKAGE_DIR}" >&2
  exit 1
fi

echo "Building Next.js standalone output locally..."
pnpm run build

if [ ! -f ".next/standalone/server.js" ]; then
  echo "Missing .next/standalone/server.js. Ensure next.config.ts sets output: \"standalone\"." >&2
  exit 1
fi

echo "Creating runtime deployment package: ${PACKAGE_DIR}"
mkdir -p \
  "${PACKAGE_DIR}/standalone" \
  "${PACKAGE_DIR}/static" \
  "${PACKAGE_DIR}/public"

cp -a .next/standalone/. "${PACKAGE_DIR}/standalone/"
merge_turbopack_server_chunks "${PACKAGE_DIR}/standalone"
prune_standalone "${PACKAGE_DIR}/standalone"

cp -a .next/static/. "${PACKAGE_DIR}/static/"

cp -a public/. "${PACKAGE_DIR}/public/"
prune_public_assets "${PACKAGE_DIR}/public"
cp docker-compose.yml "${PACKAGE_DIR}/"

cat > "${PACKAGE_DIR}/Dockerfile" <<'DOCKERFILE'
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN chown -R node:node /app

COPY --chown=node:node standalone ./
COPY --chown=node:node static ./.next/static
COPY --chown=node:node public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
DOCKERFILE

cat > "${PACKAGE_DIR}/.dockerignore" <<'DOCKERIGNORE'
.env
release
*.log
DOCKERIGNORE

cat > "${PACKAGE_DIR}/.env.example" <<ENV
# Host port mapped to container port 3000
APP_PORT=${DEFAULT_APP_PORT}

# Optional public site URL used for metadata/canonical links
PUBLIC_SITE_URL=
NEXT_PUBLIC_SITE_URL=
ENV

cat > "${PACKAGE_DIR}/DEPLOY.md" <<DEPLOY
# ${APP_NAME} Docker runtime package

Frontend-only showcase build of Auntie Chen Home (cn-showcase).

This package contains the prebuilt Next.js standalone server, static assets,
and public assets. Deployment does **not** run \`pnpm install\` or \`next build\`.

## Contents

- \`standalone/\` — Next.js standalone Node server
- \`static/\` — \`_next/static\` assets
- \`public/\` — public images and static files
- \`Dockerfile\` / \`docker-compose.yml\` — runtime container definition

## Server requirements

- Docker
- Docker Compose

## Deploy

\`\`\`bash
tar -xzf ${PACKAGE_ARCHIVE}
cd ${APP_NAME}-${BUILD_ID}
cp .env.example .env
# Optional: edit APP_PORT / PUBLIC_SITE_URL
docker compose up --build -d
\`\`\`

## Ports

Container listens on \`3000\`. Host port defaults to \`${DEFAULT_APP_PORT}\`.

\`\`\`env
APP_PORT=${DEFAULT_APP_PORT}
\`\`\`

Open:

\`\`\`text
http://127.0.0.1:\${APP_PORT:-${DEFAULT_APP_PORT}}
\`\`\`

## Check

\`\`\`bash
docker compose ps
docker compose logs -f
curl -I http://127.0.0.1:\${APP_PORT:-${DEFAULT_APP_PORT}}/
\`\`\`

## Notes

- No admin panel
- No payment / Airwallex runtime secrets
- No CMS write API or persistent upload volume
- Content is baked from local defaults at build time
DEPLOY

tar -czf "${RELEASE_ROOT}/${PACKAGE_ARCHIVE}" -C "${RELEASE_ROOT}" "${APP_NAME}-${BUILD_ID}"

echo
echo "Runtime package created:"
echo "  ${RELEASE_ROOT}/${PACKAGE_ARCHIVE}"
echo "  $(cd "${RELEASE_ROOT}" && pwd)/${PACKAGE_ARCHIVE}"
echo
echo "Deploy on server:"
echo "  tar -xzf ${PACKAGE_ARCHIVE}"
echo "  cd ${APP_NAME}-${BUILD_ID}"
echo "  cp .env.example .env"
echo "  docker compose up --build -d"
