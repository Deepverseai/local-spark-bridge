package com.sefey.controllerbridge

/**
 * Command allowlist — must match the JS allowlist in src/lib/bridge/commands.ts
 * byte-for-byte. Any change here must be mirrored on the JS side and vice versa.
 */
object CommandAllowlist {

    val ALLOWED_COMMANDS: Set<String> = setOf(
        "OPEN_MAPS",
        "OPEN_BROWSER",
        "OPEN_CAMERA",
        "OPEN_WHATSAPP",
        "OPEN_SETTINGS",
        "OPEN_FLASHLIGHT",
        "CLOSE_FLASHLIGHT",
        "SET_TIMER",
        "BATTERY_STATUS",
        "BLUETOOTH_ON",
        "BLUETOOTH_OFF",
    )

    fun isAllowed(command: String): Boolean = command in ALLOWED_COMMANDS
}
