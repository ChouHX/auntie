#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-auntie-chen-web}"
BUILD_ID="${BUILD_ID:-$(date +%Y%m%d%H%M%S)}"
RELEASE_ROOT="${RELEASE_ROOT:-release}"
PACKAGE_DIR="${RELEASE_ROOT}/${APP_NAME}-${BUILD_ID}"
PACKAGE_ARCHIVE="${APP_NAME}-${BUILD_ID}.tar.gz"

prune_standalone() {
  local standalone_dir="$1"

  rm -rf \
    "${standalone_dir}/public" \
    "${standalone_dir}/data/cms.sqlite"* \
    "${standalone_dir}/data/"*.tmp \
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

  rm -rf "${public_dir}/uploads"
  mkdir -p "${public_dir}/uploads"

  if [ -d "${public_dir}/review-screenshots" ]; then
    find "${public_dir}/review-screenshots" -maxdepth 1 -type f \
      \( -name "review-*.png" -o -name "review-*.jpg" -o -name "manifest.json" \) \
      -delete
  fi
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
  "${PACKAGE_DIR}/public" \
  "${PACKAGE_DIR}/data" \
  "${PACKAGE_DIR}/public/uploads"

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
    PORT=3000 \
    CMS_SQLITE_FILE=/app/data/cms.sqlite

RUN mkdir -p /app/data /app/public/uploads \
  && chown -R node:node /app

COPY --chown=node:node standalone ./
COPY --chown=node:node static ./.next/static
COPY --chown=node:node public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
DOCKERFILE

cat > "${PACKAGE_DIR}/.dockerignore" <<'DOCKERIGNORE'
.env
data
public/uploads
release
*.log
DOCKERIGNORE

cat > "${PACKAGE_DIR}/.env.example" <<ENV
APP_PORT=4174
ADMIN_SESSION_TOKEN=change-this-to-a-long-random-string
ENV

chmod 0777 "${PACKAGE_DIR}/data" "${PACKAGE_DIR}/public/uploads"

cat > "${PACKAGE_DIR}/DEPLOY.md" <<DEPLOY
# ${APP_NAME} Next.js runtime deployment package

This package contains the prebuilt Next.js standalone server, static assets,
and public assets. The server does not run pnpm install or next build during
deployment.

## Server requirements

- Docker
- Docker Compose
- Network access to pull the Node runtime base image if it is not cached

## Deploy

\`\`\`bash
tar -xzf ${PACKAGE_ARCHIVE}
cd ${APP_NAME}-${BUILD_ID}
cp .env.example .env
# Edit .env before first start.
docker compose up --build -d
\`\`\`

Default admin login is \`admin / admin123\`. Change the password in the admin
panel after first login. Configure notification SMTP in the admin site settings,
not in Docker environment variables.

## Ports

The container runs Next.js on port 3000. The host port defaults to 4174 to keep
the old deployment port stable.

\`\`\`env
APP_PORT=4174
\`\`\`

## Check

\`\`\`bash
docker compose ps
docker compose logs -f
curl http://127.0.0.1:\${APP_PORT:-4174}/api/health
\`\`\`

## Persistent data

- \`./data/cms.sqlite\` -> CMS content, admin settings, payment settings, and payment orders
- \`./public/uploads\` -> uploaded images

These are local directories in the deployment folder, not Docker named volumes.
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
