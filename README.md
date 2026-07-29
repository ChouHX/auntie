# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```

## Docker deployment

The production image is built directly from the source tree. Docker installs
the locked dependencies, runs the Next.js production build, and copies the
standalone output into the runtime image.

Create a local `.env` file for runtime-only configuration, then build and start
the service:

```bash
docker compose up --build -d
```

The application listens on host port `4174` by default. Set `APP_PORT` in
`.env` to use another port. Runtime secrets are passed through the variables in
`docker-compose.yml`; they are not included in the image.

```bash
docker compose ps
docker compose logs -f
curl http://127.0.0.1:${APP_PORT:-4174}/api/health
```
# Auntie Chen Home

## Migrating CMS JSON to SQLite

The production app stores CMS data in SQLite at `/app/data/cms.sqlite`. If an existing deployment still has `data/cms-content.json`, migrate it before starting the SQLite build:

```bash
pnpm migrate:json-to-sqlite
```

The migration does not overwrite an existing SQLite database. Back up the database first and use `--force` only when intentionally replacing its content:

```bash
cp data/cms.sqlite data/cms.sqlite.backup
pnpm migrate:json-to-sqlite -- --force
```

Keep `data/cms.sqlite` on the host and mount it into the container with `./data:/app/data`. The original JSON file is not deleted.
