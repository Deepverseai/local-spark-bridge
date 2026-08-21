package com.sefey.controllerbridge

import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Capacitor plugin that exposes the native broadcast adapter to the WebView.
 *
 * When the SPA dashboard detects this plugin via Capacitor.Plugins["BridgeAdapter"],
 * it switches from dry-run mode to native mode. The plugin's sendBroadcast method
 * calls BroadcastAdapter.sendBroadcast() which emits AI_BRIDGE_TEST.
 *
 * The command passed in is always an already-validated allowlisted string —
 * the JS validation tier rejects anything else before calling this plugin.
 */
@CapacitorPlugin(name = "BridgeAdapter")
class BridgeAdapterPlugin : Plugin() {

    @PluginMethod
    fun sendBroadcast(call: PluginCall) {
        val command = call.getString("command")
        if (command == null || command.isEmpty()) {
            call.reject("Missing command")
            return
        }

        if (!CommandAllowlist.isAllowed(command)) {
            call.reject("Command not in allowlist")
            return
        }

        try {
            BroadcastAdapter.sendBroadcast(context, command)
            val ret = JSObject()
            ret.put("success", true)
            ret.put("command", command)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to send broadcast: ${e.message}")
        }
    }
}
