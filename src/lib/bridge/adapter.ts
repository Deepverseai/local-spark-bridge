/**
 * Automate broadcast adapter abstraction (DRY RUN ONLY here).
 *
 * A web preview cannot send Android broadcasts. This module defines the seam
 * where the native Android layer plugs in. Only the dry-run adapter is wired
 * up; it maps an allowlisted command to the exact broadcast the native app
 * will emit, without emitting anything.
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
  /** false in every web/preview context — no Android execution is possible. */
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

/** Single swap point for the native adapter when running inside the APK. */
export function getAdapter(): BroadcastAdapter {
  return dryRunAdapter;
}
