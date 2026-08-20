import { handleCommand, newRequestId } from "./handleCommand";

/**
 * Shared HTTP wrapper for the bridge endpoint.
 *
 * Localhost-only intent: the bridge answers loopback hosts only. There is no
 * public hosting, no wildcard CORS, and no cloud database. In the native
 * Android wrapper the embedded server MUST bind to 127.0.0.1 exclusively.
 */

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "0:0:0:0:0:0:0:1"]);

export function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host
    .replace(/^\[/, "")
    .split("]")[0]!
    .split(":")
    .slice(0, host.includes("]") || !host.includes(":") ? undefined : 1)
    .join(":")
    .toLowerCase();
  return LOOPBACK.has(hostname);
}

/** No wildcard CORS: only same-origin loopback callers are answered. */
const BASE_HEADERS = {
  "cache-control": "no-store",
  "x-bridge-mode": "dry-run",
} as const;

export async function bridgeHttpHandler(request: Request): Promise<Response> {
  if (!isLoopbackHost(request.headers.get("host"))) {
    return Response.json(
      {
        requestId: newRequestId(),
        receivedAt: new Date().toISOString(),
        status: "blocked",
        reason: "NON_LOOPBACK",
        command: null,
        mode: "dry-run",
        message:
          "Bridge refuses non-loopback requests. Call http://127.0.0.1:<port>/command only.",
      },
      { status: 403, headers: BASE_HEADERS },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        requestId: newRequestId(),
        receivedAt: new Date().toISOString(),
        status: "error",
        reason: "BAD_JSON",
        command: null,
        mode: "dry-run",
        message: "Body is not valid JSON.",
      },
      { status: 400, headers: BASE_HEADERS },
    );
  }

  const result = await handleCommand(body);
  const status =
    result.status === "success" ? 200 : result.status === "blocked" ? 403 : 400;
  return Response.json(result, { status, headers: BASE_HEADERS });
}
