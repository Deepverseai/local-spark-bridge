package com.sefey.controllerbridge

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Verifies the command allowlist has exactly 11 entries and matches the JS side.
 */
class CommandAllowlistTest {

    @Test
    fun `allowlist has exactly 11 commands`() {
        assertEquals(11, CommandAllowlist.ALLOWED_COMMANDS.size)
    }

    @Test
    fun `all expected commands are present`() {
        val expected = setOf(
            "OPEN_MAPS", "OPEN_BROWSER", "OPEN_CAMERA", "OPEN_WHATSAPP",
            "OPEN_SETTINGS", "OPEN_FLASHLIGHT", "CLOSE_FLASHLIGHT", "SET_TIMER",
            "BATTERY_STATUS", "BLUETOOTH_ON", "BLUETOOTH_OFF"
        )
        assertEquals(expected, CommandAllowlist.ALLOWED_COMMANDS)
    }

    @Test
    fun `isAllowed returns true for allowlisted commands`() {
        assertTrue(CommandAllowlist.isAllowed("OPEN_MAPS"))
        assertTrue(CommandAllowlist.isAllowed("BLUETOOTH_OFF"))
    }

    @Test
    fun `isAllowed returns false for unknown commands`() {
        assertFalse(CommandAllowlist.isAllowed("DELETE_ALL_FILES"))
        assertFalse(CommandAllowlist.isAllowed("open_maps"))
        assertFalse(CommandAllowlist.isAllowed(""))
    }
}
