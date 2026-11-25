# Twilight Chronicles

Twilight Chronicles is a two-player conversation game. The Next.js web app is in `apps/web`; the authoritative Socket.IO game server is in `apps/realtime`; shared event and room contracts are in `packages/shared-types`; and the published question deck is in `packages/content/seed-questions.json`.

## Local development

Requirements: Node.js 20.9 or newer, pnpm 11.22, and Docker Desktop (or a local Redis server).

```sh
pnpm install --frozen-lockfile
docker compose up -d redis
pnpm dev
```

Open `http://localhost:3000`. The real-time server listens on port `3001`. Local development can run without Redis, but it then uses process memory and will not survive a server restart or work across realtime replicas.

For a remote browser or tunnel, set `NEXT_PUBLIC_REALTIME_URL` to the browser-reachable realtime service URL in `apps/web/.env.local`. The web and realtime services are separate origins in this setup; publish the realtime service over HTTPS/WSS and allow the web origin in `WEB_ORIGIN`.

## Production build and services

Build from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
```

Deploy `apps/web` as a Node.js Next.js service and `apps/realtime` as a long-running Node.js service with WebSocket support. The realtime start command is `pnpm --filter @twilight/realtime start`; the web start command is `pnpm --filter web start`.

For Render, [`render.yaml`](./render.yaml) declares both services, their exact monorepo commands, health checks, and automatic deployment. Existing manually-created Render services are not converted automatically: either deploy the Blueprint or copy the matching build/start commands and environment variables into each service before manually deploying the latest commit.

Configure the web build with:

- `NEXT_PUBLIC_REALTIME_URL=https://realtime.example.com`, a URL browsers can reach directly. The build fails if this is missing in production.

Configure the realtime service with:

- `NODE_ENV=production`
- `PORT` (provided by the hosting platform)
- `REDIS_URL=rediss://...` for a private, TLS-enabled Redis service
- `PAIR_HISTORY_SECRET`, a long, random value that remains stable between deploys. It turns a returning pair's display names and relationship choices into an opaque server-only history key.
- `WEB_ORIGIN=https://www.example.com` (comma-separated exact origins are supported)
- `TRUST_PROXY=true` only when the realtime service is reachable through a trusted ingress that sets `X-Forwarded-For`; keep direct public access to the service disabled in that setup.

The server fails closed in production if Redis is missing or unavailable at startup. `/health/live` checks that the process is running; `/health` reports readiness and returns HTTP 503 if Redis is unavailable. Redis is used for room state, reconnection tokens, answer drafts, reports, and the Socket.IO Redis adapter. Keep Redis private and configure it with `noeviction`; the application relies on Redis state and must report write failures instead of silently losing rooms.

The realtime server uses WebSocket first and polling as a fallback. If the hosting platform blocks WebSockets and the realtime service has multiple replicas, configure sticky sessions for polling traffic as well as Redis Pub/Sub. A reverse proxy must forward WebSocket upgrade headers if the realtime endpoint is exposed through one.

## Room and privacy behavior

- The server controls room membership, readiness, turns, question selection, answer locking, and answer sharing.
- Each player receives an opaque resume token. It is stored in the current browser tab's `sessionStorage`; display names are never used to recover player identity.
- The answer draft is sent to the realtime service so it can survive a network drop. It is private from the other player until the answerer shares it. Drafts are not end-to-end encrypted.
- The optional answer timer is a pacing cue; it never forces a lock or submission. Room state expires after 24 hours without activity. Reports are kept in a bounded Redis queue for up to 90 days. Each room keeps at most 20 doodles, and each image is limited to 80 KB of encoded data.
- A pair's seen curated questions and position in the local living deck are retained for 90 days through an opaque HMAC key; raw display names are not stored in that key or sent to the browsers. This keeps repeat sessions fresh. Changing a display name or relationship choice starts a new prompt history.
- The PostgreSQL schema is scaffolding and is not connected to the game server. Accounts, encrypted highlights, and long-term answer history are not available in this version.

## Two-player smoke check

1. Open the site in two separate browser profiles.
2. Create a room in one profile and join it with the room code in the other.
3. Mark both players ready and start the game.
4. Complete a coin toss, select a mood, type a draft, lock it, edit it, lock it again, share it, and continue.
5. Confirm the waiting player never sees the draft before sharing; after sharing, both see the same answer and room phase.
6. Refresh the answerer's page while answering and confirm the same question and last synced draft return.
7. Disconnect and reconnect one client; confirm the other sees the connection state update and the game continues.
8. While one player is answering, open Doodles on the waiting player's device, draw and send a sketch, and confirm it appears once for both players. Retry after a temporary connection interruption and confirm the same sketch is not duplicated.
