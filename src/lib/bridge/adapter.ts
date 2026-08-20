/**
 * Broadcast adapter abstraction.
 *
 * The web preview CANNOT send Android broadcasts. This module defines the
 * seam where the native Android layer plugs in. Only the DryRunAdapter is
 * wired up here; it validates and describes the broadcast without sending it.
 *
 * Native port (later, inside the Android app):
 *
 *   val intent = Intent("AI_BRIDGE_TEST")
 *   intent.putExtra("command", command)
 *   context.sendBroadcast(intent)
 */

import type { AllowedCommand, BroadcastPlan } from "./commands";

export const BROADCAST_ACTION = "AI_BRIDGE_TEST";
export const BROADCAST_EXTRA_KEY = "command";

export interface BroadcastAdapter {
  readonly name: string;
  readonly canExecute: boolean;
  send(command: AllowedCommand): Promise<BroadcastPlan>;
}

export function buildBroadcastPlan(command: AllowedCommand): BroadcastPlan {
  return {
    action: BROADCAST_ACTION,
    extras: { [BROADCAST_EXTRA_KEY]: command } as { command: AllowedCommand },
    nativeCall: `Intent("${BROADCAST_ACTION}").putExtra("${BROADCAST_EXTRA_KEY}", "${command}") -> context.sendBroadcast(intent)`,
  };
}

/** Safe no-op adapter used everywhere outside a native Android host. */
export const dryRunAdapter: BroadcastAdapter = {
  name: "DryRunAdapter (no Android execution)",
  canExecute: false,
  async send(command) {
    return buildBroadcastPlan(command);
  },
};

/** Single place to swap in the native adapter when running inside the APK. */
export function getAdapter(): BroadcastAdapter {
  return dryRunAdapter;
}
