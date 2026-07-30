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

## Docker deployment

`docker-compose.yml` builds the image from local source. Use it for development or machines intended to compile the application:

```bash
docker compose up -d --build
```

Production servers should pull the prebuilt GHCR image and avoid running Next.js builds locally:

```bash
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

The server compose file defaults to `ghcr.io/chouhx/auntie:latest`. Set `AUNTIE_IMAGE` to a commit-tagged image when a pinned deployment is required.

## WeCom customer synchronization

Customer management reads the WeCom Customer Contact APIs and stores a
read-only customer snapshot in the existing `CMS_SQLITE_FILE` database. Add
the following values to the server `.env` file:

```bash
WECOM_CORP_ID=your-corp-id
WECOM_CORP_SECRET=your-customer-contact-app-secret
```

The WeCom application must be configured as an application allowed to call
Customer Contact APIs, and its visible scope must include the service members
whose customers should be synchronized. The secret is only read by the server;
it is never returned to the admin browser or stored in SQLite.
