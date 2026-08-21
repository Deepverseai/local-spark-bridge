package com.sefey.controllerbridge

import android.os.Bundle
import com.getcapacitor.BridgeActivity

/**
 * Main entry point for the Android app.
 *
 * Registers the BridgeAdapter plugin so the WebView dashboard can detect
 * native mode and call sendBroadcast. Also starts the embedded localhost
 * HTTP server on 127.0.0.1:8080 for Sefey/ChatterUI to call.
 */
class MainActivity : BridgeActivity() {

    private var httpServer: LocalhostHttpServer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        // Register the native bridge adapter plugin before super.onCreate
        // so it's available when the WebView loads.
        registerPlugin(BridgeAdapterPlugin::class.java)
        super.onCreate(savedInstanceState)

        // Start the embedded localhost HTTP server (127.0.0.1 only).
        httpServer = LocalhostHttpServer(this, 8080)
        httpServer?.start()
    }

    override fun onDestroy() {
        httpServer?.stop()
        httpServer = null
        super.onDestroy()
    }
}
