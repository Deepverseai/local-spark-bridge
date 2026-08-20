import { createFileRoute } from "@tanstack/react-router";
import { handleCommand } from "@/lib/bridge/handleCommand";

/**
 * POST /api/command  { "command": "OPEN_FLASHLIGHT" }
 *
 * Localhost-only: requests whose Host header is not a loopback address are
 * refused. This route is deliberately NOT under /api/public/*, so it is never
 * exposed as an unauthenticated public endpoint.
 */

function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0]!.toLowerCase().replace(/^\[|\]$/g, "");
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
}

export const Route = createFileRoute("/api/command")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isLoopbackHost(request.headers.get("host"))) {
          return Response.json(
            {
              status: "blocked",
              message:
                "Bridge refuses non-loopback requests. Bind and call 127.0.0.1 only.",
            },
            { status: 403 },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { status: "error", message: "Body is not valid JSON." },
            { status: 400 },
          );
        }

        const result = await handleCommand(body);
        const code = result.status === "success" ? 200 : result.status === "blocked" ? 403 : 400;
        return Response.json(result, { status: code });
      },
    },
  },
});
