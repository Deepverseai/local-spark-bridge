import { createFileRoute } from "@tanstack/react-router";
import { bridgeHttpHandler } from "@/lib/bridge/httpHandler";

/**
 * POST /command   body: {"command":"OPEN_FLASHLIGHT"}
 *
 * Loopback-only. Deliberately NOT under /api/public/*, so it is never exposed
 * as a public unauthenticated endpoint.
 */
export const Route = createFileRoute("/command")({
  server: {
    handlers: {
      POST: async ({ request }) => bridgeHttpHandler(request),
    },
  },
});
