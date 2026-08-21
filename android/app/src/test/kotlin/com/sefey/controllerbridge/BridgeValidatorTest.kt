package com.sefey.controllerbridge

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Test

/**
 * Mirrors src/lib/bridge/handleCommand.test.ts — same test cases, same expectations.
 */
class BridgeValidatorTest {

    @Test
    fun `all allowlisted commands are accepted`() {
        val commands = listOf(
            "OPEN_MAPS", "OPEN_BROWSER", "OPEN_CAMERA", "OPEN_WHATSAPP",
            "OPEN_SETTINGS", "OPEN_FLASHLIGHT", "CLOSE_FLASHLIGHT", "SET_TIMER",
            "BATTERY_STATUS", "BLUETOOTH_ON", "BLUETOOTH_OFF"
        )
        for (command in commands) {
            val result = BridgeValidator.validate("""{"command":"$command"}""")
            assertEquals("status for $command", "success", result.status)
            assertEquals("reason for $command", "OK", result.reason)
            assertEquals("command for $command", command, result.command)
        }
    }

    @Test
    fun `hostile commands are blocked`() {
        val hostile = listOf(
            "DELETE_ALL_FILES",
            "rm -rf /",
            "OPEN_MAPS; rm -rf /",
            "\$(cat /etc/passwd)",
            "`whoami`",
            "<script>alert(1)</script>",
            "require('fs').unlinkSync('/tmp/x')",
            "am start -a android.intent.action.VIEW",
            "open_maps",
            " OPEN_MAPS ",
            "OPEN_MAPS\n",
            "__proto__"
        )
        for (command in hostile) {
            val result = BridgeValidator.validate("""{"command":"$command"}""")
            assertEquals("status for $command", "blocked", result.status)
            assertEquals("reason for $command", "COMMAND_NOT_ALLOWED", result.reason)
            assertNull("command for $command", result.command)
        }
    }

    @Test
    fun `rejected input is never echoed back`() {
        val result = BridgeValidator.validate("""{"command":"DELETE_ALL_FILES"}""")
        val responseJson = BridgeValidator.buildResultJson(
            result.status, result.reason, result.command, result.message
        )
        assertFalse("response must not contain rejected input", responseJson.contains("DELETE_ALL_FILES"))
    }

    @Test
    fun `non-object body is rejected`() {
        assertEquals("BODY_NOT_OBJECT", BridgeValidator.validate("\"OPEN_MAPS\"").reason)
        assertEquals("BODY_NOT_OBJECT", BridgeValidator.validate("null").reason)
        assertEquals("BODY_NOT_OBJECT", BridgeValidator.validate("[\"OPEN_MAPS\"]").reason)
    }

    @Test
    fun `missing command field is rejected`() {
        assertEquals("COMMAND_MISSING", BridgeValidator.validate("{}").reason)
    }

    @Test
    fun `non-string commands are rejected`() {
        assertEquals("COMMAND_NOT_STRING", BridgeValidator.validate("""{"command":42}""").reason)
        assertEquals("COMMAND_NOT_STRING", BridgeValidator.validate("""{"command":""}""").reason)
        assertEquals("COMMAND_NOT_STRING", BridgeValidator.validate("""{"command":["OPEN_MAPS"]}""").reason)
    }

    @Test
    fun `extra fields are rejected`() {
        val result = BridgeValidator.validate("""{"command":"OPEN_MAPS","shell":"rm -rf /"}""")
        assertEquals("error", result.status)
        assertEquals("UNEXPECTED_FIELDS", result.reason)
    }

    @Test
    fun `invalid JSON is rejected`() {
        assertEquals("BAD_JSON", BridgeValidator.validate("{not json").reason)
        assertEquals("BAD_JSON", BridgeValidator.validate("").reason)
    }

    @Test
    fun `buildResultJson has valid requestId and receivedAt`() {
        val json = BridgeValidator.buildResultJson("success", "OK", "OPEN_MAPS", "")
        assertTrue("requestId should start with req_", json.contains("\"requestId\":\"req_"))
        assertTrue("receivedAt should be present", json.contains("\"receivedAt\":"))
    }

    @Test
    fun `broadcast JSON has correct shape`() {
        val broadcast = BridgeValidator.buildBroadcastJson("OPEN_FLASHLIGHT")
        assertEquals("AI_BRIDGE_TEST", broadcast.get("action").asString)
        assertEquals("OPEN_FLASHLIGHT", broadcast.getAsJsonObject("extras").get("command").asString)
        assertFalse(broadcast.get("dryRun").asBoolean)
    }
}
