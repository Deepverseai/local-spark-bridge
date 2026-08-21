/**
 * Automate broadcast adapter abstraction.
 *
 * In the web preview, the dry-run adapter is used — it maps an allowlisted
 * command to the exact broadcast the native app will emit, without emitting
 * anything.
 *
 * Inside the Android APK, a Capacitor plugin (BridgeAdapterPlugin) is available
 * at runtime. When detected, getAdapter() returns a native adapter that calls
 * through to the Kotlin BroadcastAdapter, which actually emits
 * AI_BRIDGE_TEST via context.sendBroadcast(intent).
 *
 * Native port (inside the Android APK):
 *
 *   val intent = Intent("AI_BRIDGE_TEST")
 *   intent.putExtra("command", command)   // exact allowlisted string
 *   context.sendBroadcast(intent)
 */

import type { AllowedCommand, BroadcastPlan } from "./commands";

export const BROADCAST_ACTION = "AI_BRIDGE_TEST";
export const BROADCAST_EXTRA_KEY = "command";

export interface BroadcastAdapter {
  readonly name: string;
  /** false in web/preview, true inside the native Android APK */
  readonly canExecute: boolean;
  send(command: AllowedCommand): Promise<BroadcastPlan>;
}

export function buildBroadcastPlan(command: AllowedCommand): BroadcastPlan {
  return {
    action: BROADCAST_ACTION,
    extras: { command },
    nativeCall: `Intent("${BROADCAST_ACTION}").putExtra("${BROADCAST_EXTRA_KEY}", "${command}") -> context.sendBroadcast(intent)`,
    dryRun: true,
  };
}

/** Safe no-op adapter used everywhere outside a native Android host. */
export const dryRunAdapter: BroadcastAdapter = {
  name: "DryRunAutomateAdapter (no Android execution)",
  canExecute: false,
  async send(command) {
    return buildBroadcastPlan(command);
  },
};

/**
 * Detects whether the Capacitor native bridge adapter plugin is available.
 * In a browser/web preview, Capacitor is absent or the plugin is unregistered,
 * so this returns null and the dry-run adapter is used.
 */
function detectNativeAdapter(): BroadcastAdapter | null {
  const capacitor = (globalThis as unknown as { Capacitor?: unknown }).Capacitor;
  if (!capacitor) return null;

  try {
    const Plugins = (capacitor as { Plugins?: Record<string, unknown> }).Plugins;
    if (!Plugins) return null;
    const plugin = Plugins["BridgeAdapter"];
    if (!plugin || typeof plugin !== "object") return null;

    const sendBroadcast = (plugin as { sendBroadcast?: unknown }).sendBroadcast;
    if (typeof sendBroadcast !== "function") return null;

    return {
      name: "NativeAutomateAdapter (context.sendBroadcast)",
      canExecute: true,
      async send(command) {
        const plan = buildBroadcastPlan(command);
        await (
          plugin as { sendBroadcast: (cmd: string) => Promise<void> }
        ).sendBroadcast(command);
        return { ...plan, dryRun: false };
      },
    };
  } catch {
    return null;
  }
}

let cachedAdapter: BroadcastAdapter | null = null;

/** Single swap point for the native adapter when running inside the APK. */
export function getAdapter(): BroadcastAdapter {
  if (cachedAdapter === null) {
    cachedAdapter = detectNativeAdapter() ?? dryRunAdapter;
  }
  return cachedAdapter;
}
