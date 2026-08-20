import { getAdapter } from "./adapter";
import {
  isAllowedCommand,
  type BridgeReason,
  type BridgeResult,
  type BridgeStatus,
  type AllowedCommand,
} from "./commands";

/**
 * Core bridge logic: strict validation + dry-run dispatch.
 *
 * No shell execution, no eval, no filesystem access, no dynamic intents, no
 * arbitrary user code paths. The command string is only ever compared against
 * a fixed allowlist — never interpreted. Rejected input is NOT echoed back or
 * logged, so a hostile payload can never travel through the log surface.
 *
 * Portable to the native Android layer as-is.
 */

export function newRequestId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return `req_${c.randomUUID()}`;
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function result(
  status: BridgeStatus,
  reason: BridgeReason,
  message: string,
  command: AllowedCommand | null = null,
): BridgeResult {
  return {
    requestId: newRequestId(),
    receivedAt: new Date().toISOString(),
    status,
    reason,
    command,
    mode: "dry-run",
    message,
  };
}

export async function handleCommand(payload: unknown): Promise<BridgeResult> {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return result(
      "error",
      "BODY_NOT_OBJECT",
      'Invalid body: expected a JSON object {"command":"..."}.',
    );
  }

  const keys = Object.keys(payload as Record<string, unknown>);
  const extras = keys.filter((k) => k !== "command");
  if (extras.length > 0) {
    return result(
      "error",
      "UNEXPECTED_FIELDS",
      `Rejected: body must contain exactly one field "command" (${extras.length} unexpected field(s) present).`,
    );
  }

  if (!keys.includes("command")) {
    return result("error", "COMMAND_MISSING", 'Rejected: missing "command" field.');
  }

  const raw = (payload as Record<string, unknown>)["command"];
  if (typeof raw !== "string" || raw.length === 0) {
    return result(
      "error",
      "COMMAND_NOT_STRING",
      'Rejected: "command" must be a non-empty string.',
    );
  }

  if (!isAllowedCommand(raw)) {
    return result(
      "blocked",
      "COMMAND_NOT_ALLOWED",
      "Blocked: command is not in the allowlist. No adapter was called and nothing was executed.",
    );
  }

  const adapter = getAdapter();
  const broadcast = await adapter.send(raw);

  return {
    ...result("success", "OK", "", raw),
    message: adapter.canExecute
      ? "Validated. Broadcast sent by native adapter."
      : "Validated. DRY RUN — the web layer cannot send Android broadcasts.",
    broadcast,
  };
}
