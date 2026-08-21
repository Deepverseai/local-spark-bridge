package com.sefey.controllerbridge

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Mirrors src/lib/bridge/httpHandler.test.ts loopback enforcement tests.
 */
class LoopbackHostTest {

    // Mirror the isLoopbackHost logic from LocalhostHttpServer
    private val LOOPBACK_HOSTS = setOf("127.0.0.1", "localhost", "::1", "0:0:0:0:0:0:0:1")

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

    @Test
    fun `accepts loopback hosts`() {
        assertTrue(isLoopbackHost("127.0.0.1:8080"))
        assertTrue(isLoopbackHost("localhost"))
        assertTrue(isLoopbackHost("[::1]:8080"))
        assertTrue(isLoopbackHost("LOCALHOST:3000"))
    }

    @Test
    fun `rejects everything else`() {
        assertFalse(isLoopbackHost(null))
        assertFalse(isLoopbackHost(""))
        assertFalse(isLoopbackHost("0.0.0.0:8080"))
        assertFalse(isLoopbackHost("192.168.1.5"))
        assertFalse(isLoopbackHost("example.com"))
    }
}
