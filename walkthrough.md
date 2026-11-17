# Twilight Chronicles — Implementation and Operations Notes

Twilight Chronicles is a two-player conversation game built as a pnpm/Turborepo monorepo. The browser UI is in `apps/web`, the authoritative Socket.IO service is in `apps/realtime`, shared contracts are in `packages/shared-types`, and the 120-question deck is in `packages/content/seed-questions.json`.

## State and reconnect behavior

- Redis stores rooms, opaque resume-token mappings, private answer drafts, active questions, used-question IDs, doodle galleries, and bounded reports. Local development can fall back to process memory; production startup requires Redis and does not fall back.
- Each browser tab stores its resume token in `sessionStorage`. Reconnection resumes the same player identity instead of matching on a display name.
- A Redis adapter carries Socket.IO room broadcasts across realtime replicas. Room transitions use a Redis lock. If polling is needed across replicas, the load balancer must use sticky sessions.
- Question text and the current answer draft are sent privately to the answerer. The other player receives the answer only after share.
- Rooms expire after 24 hours of inactivity. The optional answer timer is a pacing cue and never forces submission. The question-report queue retains up to 500 reports for 90 days. Doodle images are limited to 80 KB and the room gallery keeps at most 20.

## Local development

```sh
pnpm install --frozen-lockfile
docker compose up -d redis
pnpm dev
```

Open `http://localhost:3000`. The realtime service listens on `http://localhost:3001`. Without Redis, local state is process-local and will not survive a service restart or synchronize across replicas.

## Production prerequisites

1. Build the web app with `NEXT_PUBLIC_REALTIME_URL` set to a browser-reachable realtime service origin.
2. Set `NODE_ENV=production`, `WEB_ORIGIN` to the exact web origin(s), and `REDIS_URL` on the realtime service.
3. Use HTTPS/WSS, private TLS-enabled Redis, and a Redis capacity/retention policy that fits expected active rooms and doodles.
4. Expose the realtime service's `/health/live` and `/health` checks. The readiness endpoint returns 503 when production Redis is unavailable.
5. Configure a WebSocket-capable ingress. If Socket.IO falls back to polling across multiple replicas, enable sticky sessions as well as Redis Pub/Sub.

## Product boundaries

The Prisma/PostgreSQL schema is scaffolding and is not connected to the active game server. The app has no accounts, persistent answer history, saved highlights, or report moderation dashboard. Drafts are not end-to-end encrypted. Report submissions are stored in Redis but no moderation workflow is implemented.

## Verification

- `pnpm install --frozen-lockfile` completed successfully.
- `pnpm --filter web lint`, `pnpm --filter web exec tsc --noEmit`, and `pnpm --filter @twilight/realtime typecheck` completed successfully.
- Root `pnpm build` completed successfully with `NEXT_PUBLIC_REALTIME_URL` set; it generated all 29 static pages and bundled the realtime service.
- `pnpm dev` started both services after correcting `turbo.json`. The web endpoint returned HTTP 200.
- Two two-client Socket.IO smoke flows passed in development memory mode: room creation/join, readiness/start, coin toss, private question delivery, draft restoration after reconnect while answering and while locked, synchronized sharing, unlock, and next-turn transition.
- Local `/health` returned `degraded` with `storage: memory`, as expected because Docker Desktop/Redis was unavailable in this environment. Redis-backed and multi-replica behavior and a real two-browser visual pass remain deployment acceptance items.

The manual two-player flow is documented in the root `README.md`.
