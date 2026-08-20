import { getAdapter } from "./adapter";
import { isAllowedCommand, type BridgeResult } from "./commands";

/**
 * Core bridge logic. Pure validation + dry-run dispatch — no shell, no eval,
 * no filesystem, no dynamic intents. Portable to the native layer as-is.
 */
export async function handleCommand(payload: unknown): Promise<BridgeResult> {
  const receivedAt = new Date().toISOString();

  if (typeof payload !== "object" || payload === null) {
    return {
      status: "error",
      command: null,
      mode: "dry-run",
      message: "Invalid request body: expected JSON object { \"command\": \"...\" }",
      receivedAt,
    };
  }

  const raw = (payload as Record<string, unknown>)["command"];

  if (typeof raw !== "string" || raw.length === 0) {
    return {
      status: "error",
      command: null,
      mode: "dry-run",
      message: 'Missing or invalid "command" field (must be a non-empty string).',
      receivedAt,
    };
  }

  if (!isAllowedCommand(raw)) {
    return {
      status: "blocked",
      command: raw.slice(0, 64),
      mode: "dry-run",
      message: `Command rejected: not in allowlist. No action was taken.`,
      receivedAt,
    };
  }

  const adapter = getAdapter();
  const broadcast = await adapter.send(raw);

  return {
    status: "success",
    command: raw,
    mode: "dry-run",
    message: `Validated. ${adapter.canExecute ? "Broadcast sent." : "DRY RUN — no Android broadcast sent from the web layer."}`,
    broadcast,
    receivedAt,
  };
}
