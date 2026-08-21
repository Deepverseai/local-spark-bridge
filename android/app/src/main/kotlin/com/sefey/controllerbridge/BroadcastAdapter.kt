package com.sefey.controllerbridge

import android.content.Intent
import android.content.Context

/**
 * Native broadcast adapter — replaces DryRunAutomateAdapter inside the APK.
 *
 * After the same validation contract passes, this emits the exact broadcast
 * the existing Automate flow listens for:
 *
 *   Intent("AI_BRIDGE_TEST").putExtra("command", command) -> context.sendBroadcast(intent)
 *
 * The command parameter is always an already-validated allowlisted string.
 * No dynamic intents, no shell, no eval.
 */
object BroadcastAdapter {

    const val BROADCAST_ACTION = "AI_BRIDGE_TEST"
    const val BROADCAST_EXTRA_KEY = "command"

    fun sendBroadcast(context: Context, command: String) {
        val intent = Intent(BROADCAST_ACTION)
        intent.putExtra(BROADCAST_EXTRA_KEY, command)
        context.sendBroadcast(intent)
    }
}
