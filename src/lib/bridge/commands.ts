/**
 * Sefey Controller Bridge — command allowlist and shared contract types.
 *
 * Dependency-free on purpose so it can be ported verbatim into the native
 * Android layer (Kotlin/JS bridge) later.
 */

export const ALLOWED_COMMANDS = [
  "OPEN_MAPS",
  "OPEN_BROWSER",
  "OPEN_CAMERA",
  "OPEN_WHATSAPP",
  "OPEN_SETTINGS",
  "OPEN_FLASHLIGHT",
  "CLOSE_FLASHLIGHT",
  "SET_TIMER",
  "BATTERY_STATUS",
  "BLUETOOTH_ON",
  "BLUETOOTH_OFF",
] as const;

export type AllowedCommand = (typeof ALLOWED_COMMANDS)[number];

export const COMMAND_DESCRIPTIONS: Record<AllowedCommand, string> = {
  OPEN_MAPS: "Launch the maps app",
  OPEN_BROWSER: "Launch the default browser",
  OPEN_CAMERA: "Launch the camera app",
  OPEN_WHATSAPP: "Launch WhatsApp",
  OPEN_SETTINGS: "Open system settings",
  OPEN_FLASHLIGHT: "Turn the torch on",
  CLOSE_FLASHLIGHT: "Turn the torch off",
  SET_TIMER: "Start a timer via the clock app",
  BATTERY_STATUS: "Report battery level",
  BLUETOOTH_ON: "Enable Bluetooth",
  BLUETOOTH_OFF: "Disable Bluetooth",
};

export function isAllowedCommand(value: unknown): value is AllowedCommand {
  return (
    typeof value === "string" &&
    (ALLOWED_COMMANDS as readonly string[]).includes(value)
  );
}

export type BridgeStatus = "success" | "blocked" | "error";

/** Machine-readable reason codes — safe to log, never contain payload data. */
export type BridgeReason =
  | "OK"
  | "BODY_NOT_OBJECT"
  | "COMMAND_MISSING"
  | "COMMAND_NOT_STRING"
  | "COMMAND_NOT_ALLOWED"
  | "UNEXPECTED_FIELDS"
  | "BAD_JSON"
  | "NON_LOOPBACK";

export interface BroadcastPlan {
  action: string;
  extras: { command: AllowedCommand };
  /** Human-readable representation of what the native layer will do. */
  nativeCall: string;
  dryRun: boolean;
}

export interface BridgeResult {
  requestId: string;
  receivedAt: string;
  status: BridgeStatus;
  reason: BridgeReason;
  /** Allowlisted command, or null. Rejected input is never echoed back. */
  command: AllowedCommand | null;
  mode: "dry-run" | "native";
  message: string;
  broadcast?: BroadcastPlan;
}
