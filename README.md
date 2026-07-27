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
