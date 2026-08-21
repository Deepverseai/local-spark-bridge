package com.sefey.controllerbridge

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.google.gson.JsonSyntaxException
import java.util.UUID

/**
 * Core bridge validation logic — Kotlin port of src/lib/bridge/handleCommand.ts.
 *
 * Same strict rules: object-only body, single "command" field, non-empty string,
 * allowlist match, no extra fields. Rejected input is never echoed back.
 *
 * Returns a BridgeResult as a JsonObject ready for HTTP response.
 */
object BridgeValidator {

    data class ValidationResult(
        val status: String,        // "success" | "blocked" | "error"
        val reason: String,        // "OK" | "BODY_NOT_OBJECT" | etc.
        val command: String?,      // allowlisted command, or null
        val message: String,
    )

    private val gson = Gson()

    fun validate(rawBody: String?): ValidationResult {
        // Parse JSON
        val body: JsonObject
        try {
            val parsed = JsonParser.parseString(rawBody)
            if (!parsed.isJsonObject) {
                return ValidationResult(
                    "error", "BODY_NOT_OBJECT", null,
                    "Invalid body: expected a JSON object {\"command\":\"...\"}."
                )
            }
            body = parsed.asJsonObject
        } catch (e: JsonSyntaxException) {
            return ValidationResult(
                "error", "BAD_JSON", null,
                "Body is not valid JSON."
            )
        }

        // Check for extra fields
        val keys = body.keySet()
        val extras = keys.filter { it != "command" }
        if (extras.isNotEmpty()) {
            return ValidationResult(
                "error", "UNEXPECTED_FIELDS", null,
                "Rejected: body must contain exactly one field \"command\" (${extras.size} unexpected field(s) present)."
            )
        }

        // Check command field exists
        if (!body.has("command")) {
            return ValidationResult(
                "error", "COMMAND_MISSING", null,
                "Rejected: missing \"command\" field."
            )
        }

        // Check command is a non-empty string
        val cmdElement = body.get("command")
        if (!cmdElement.isJsonPrimitive || !cmdElement.asJsonPrimitive.isString) {
            return ValidationResult(
                "error", "COMMAND_NOT_STRING", null,
                "Rejected: \"command\" must be a non-empty string."
            )
        }
        val raw = cmdElement.asString
        if (raw.isEmpty()) {
            return ValidationResult(
                "error", "COMMAND_NOT_STRING", null,
                "Rejected: \"command\" must be a non-empty string."
            )
        }

        // Check allowlist
        if (!CommandAllowlist.isAllowed(raw)) {
            return ValidationResult(
                "blocked", "COMMAND_NOT_ALLOWED", null,
                "Blocked: command is not in the allowlist. No adapter was called and nothing was executed."
            )
        }

        return ValidationResult("success", "OK", raw, "")
    }

    fun buildResultJson(
        status: String,
        reason: String,
        command: String?,
        message: String,
        mode: String = "native",
        broadcast: JsonObject? = null,
    ): String {
        val obj = JsonObject()
        obj.addProperty("requestId", "req_${UUID.randomUUID()}")
        obj.addProperty("receivedAt", java.time.Instant.now().toString())
        obj.addProperty("status", status)
        obj.addProperty("reason", reason)
        obj.addProperty("command", command)
        obj.addProperty("mode", mode)
        obj.addProperty("message", message)
        if (broadcast != null) {
            obj.add("broadcast", broadcast)
        }
        return gson.toJson(obj)
    }

    fun buildBroadcastJson(command: String): JsonObject {
        val obj = JsonObject()
        obj.addProperty("action", BroadcastAdapter.BROADCAST_ACTION)
        val extras = JsonObject()
        extras.addProperty("command", command)
        obj.add("extras", extras)
        obj.addProperty(
            "nativeCall",
            "Intent(\"${BroadcastAdapter.BROADCAST_ACTION}\").putExtra(\"${BroadcastAdapter.BROADCAST_EXTRA_KEY}\", \"$command\") -> context.sendBroadcast(intent)"
        )
        obj.addProperty("dryRun", false)
        return obj
    }
}
