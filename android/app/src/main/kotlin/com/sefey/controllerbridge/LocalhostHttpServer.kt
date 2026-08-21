package com.sefey.controllerbridge

import android.content.Context
import android.util.Log
import com.google.gson.JsonObject
import java.io.BufferedReader
import java.io.IOException
import java.io.OutputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import kotlin.concurrent.thread

/**
 * Embedded localhost HTTP server.
 *
 * Binds EXCLUSIVELY to 127.0.0.1 on port 8080. Never binds 0.0.0.0.
 * Routes POST /command and POST /api/command through the same validation
 * contract as the JS bridge.
 *
 * Security:
 * - Startup assertion fails if bind address is not 127.0.0.1.
 * - Loopback Host check rejects any request whose Host is not
 *   127.0.0.1 / localhost / ::1 with 403 NON_LOOPBACK.
 * - No wildcard CORS headers.
 * - No analytics, no persistence — logs are metadata only.
 */
class LocalhostHttpServer(
    private val context: Context,
    private val port: Int = 8080,
) {
    companion object {
        private const val TAG = "LocalhostHttpServer"
        private const val BIND_ADDRESS = "127.0.0.1"
        private val LOOPBACK_HOSTS = setOf("127.0.0.1", "localhost", "::1", "0:0:0:0:0:0:0:1")
    }

    private var serverSocket: ServerSocket? = null
    @Volatile private var running = false

    fun start() {
        if (running) return

        val addr = InetAddress.getByName(BIND_ADDRESS)
        serverSocket = ServerSocket(port, 10, addr)

        // Hard assertion: if we somehow bound to something other than 127.0.0.1, fail.
        val boundAddr = serverSocket!!.inetAddress.hostAddress
        check(boundAddr == "127.0.0.1" || boundAddr == "localhost" || boundAddr == "::1") {
            "FATAL: server bound to $boundAddr, expected 127.0.0.1. Refusing to start."
        }

        running = true
        Log.i(TAG, "Server started on 127.0.0.1:$port")

        thread(name = "bridge-http-server", isDaemon = true) {
            while (running) {
                try {
                    val client = serverSocket?.accept() ?: break
                    thread(name = "bridge-conn", isDaemon = true) {
                        handleClient(client)
                    }
                } catch (e: IOException) {
                    if (running) Log.e(TAG, "Accept error", e)
                }
            }
        }
    }

    fun stop() {
        running = false
        try {
            serverSocket?.close()
        } catch (e: IOException) {
            Log.e(TAG, "Error closing server socket", e)
        }
        serverSocket = null
        Log.i(TAG, "Server stopped")
    }

    private fun handleClient(client: Socket) {
        try {
            client.use { sock ->
                val input = sock.getInputStream()
                val output = sock.getOutputStream()
                val reader = BufferedReader(input.bufferedReader(Charsets.UTF_8))

                val requestLine = reader.readLine() ?: return
                val parts = requestLine.split(" ")
                if (parts.size < 3) {
                    writeResponse(output, 400, "Bad Request", "{}")
                    return
                }
                val method = parts[0]
                val path = parts[1]

                // Read headers
                val headers = mutableMapOf<String, String>()
                while (true) {
                    val line = reader.readLine() ?: break
                    if (line.isEmpty()) break
                    val colonIdx = line.indexOf(":")
                    if (colonIdx > 0) {
                        val key = line.substring(0, colonIdx).trim().lowercase()
                        val value = line.substring(colonIdx + 1).trim()
                        headers[key] = value
                    }
                }

                // Only accept POST on /command and /api/command
                if (method != "POST" || (path != "/command" && path != "/api/command")) {
                    writeResponse(output, 404, "Not Found", "{}")
                    return
                }

                // Loopback Host check
                val host = headers["host"]
                if (!isLoopbackHost(host)) {
                    val body = BridgeValidator.buildResultJson(
                        "blocked", "NON_LOOPBACK", null,
                        "Bridge refuses non-loopback requests. Call http://127.0.0.1:$port/command only."
                    )
                    writeResponse(output, 403, "Forbidden", body)
                    return
                }

                // Read body
                val contentLength = headers["content-length"]?.toIntOrNull() ?: 0
                val bodyChars = CharArray(contentLength)
                var read = 0
                while (read < contentLength) {
                    val n = reader.read(bodyChars, read, contentLength - read)
                    if (n < 0) break
                    read += n
                }
                val rawBody = if (read > 0) String(bodyChars, 0, read) else null

                // Validate
                val result = BridgeValidator.validate(rawBody)

                if (result.status == "success" && result.command != null) {
                    // Send the actual broadcast
                    BroadcastAdapter.sendBroadcast(context, result.command)
                    val broadcast = BridgeValidator.buildBroadcastJson(result.command)
                    val responseBody = BridgeValidator.buildResultJson(
                        "success", "OK", result.command,
                        "Validated. Broadcast sent by native adapter.",
                        "native", broadcast
                    )
                    writeResponse(output, 200, "OK", responseBody)
                } else {
                    val httpStatus = if (result.status == "blocked") 403 else 400
                    val responseBody = BridgeValidator.buildResultJson(
                        result.status, result.reason, null, result.message
                    )
                    writeResponse(output, httpStatus, if (httpStatus == 403) "Forbidden" else "Bad Request", responseBody)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling client", e)
        }
    }

    private fun isLoopbackHost(host: String?): Boolean {
        if (host.isNullOrEmpty()) return false
        val h = host.trim().lowercase()
        val hostname = if (h.startsWith("[")) {
            h.slice(1..h.indexOf("]") - 1)
        } else {
            h.split(":")[0]
        }
        return hostname in LOOPBACK_HOSTS
    }

    private fun writeResponse(output: OutputStream, status: Int, statusText: String, body: String) {
        val response = StringBuilder()
        response.append("HTTP/1.1 $status $statusText\r\n")
        response.append("Content-Type: application/json\r\n")
        response.append("Content-Length: ${body.toByteArray(Charsets.UTF_8).size}\r\n")
        response.append("Cache-Control: no-store\r\n")
        response.append("X-Bridge-Mode: native\r\n")
        response.append("\r\n")
        output.write(response.toString().toByteArray(Charsets.UTF_8))
        output.write(body.toByteArray(Charsets.UTF_8))
        output.flush()
    }
}
