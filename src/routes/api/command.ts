import { createFileRoute } from "@tanstack/react-router";
import { bridgeHttpHandler } from "@/lib/bridge/httpHandler";

/** Alias of POST /command — same loopback-only contract. */
export const Route = createFileRoute("/api/command")({
  server: {
    handlers: {
      POST: async ({ request }) => bridgeHttpHandler(request),
    },
  },
});
