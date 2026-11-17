# Twilight Chronicles web app

This Next.js app is the browser client for the two-player game. Run the full monorepo from the repository root; see the root [README](../../README.md) for development, build, and deployment instructions.

The production build requires `NEXT_PUBLIC_REALTIME_URL`, which must point to a realtime service that browsers can reach. For local development, the client connects to `http://localhost:3001` by default. Remote development and production need an explicit public URL; configure `WEB_ORIGIN` on the realtime service to allow the web app's exact origin.
