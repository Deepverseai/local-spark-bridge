# Security Notes — Sefey Controller Bridge

This repository contains a **private, local-first prototype** for an Android local AI assistant bridge.

## Localhost-only operation

- The bridge HTTP API binds to `127.0.0.1` (localhost) only.
- It must **never** be bound to `0.0.0.0` or exposed to the public internet.
- No public hosting, cloud deployment, or remote access is intended.

## Command allowlist

The bridge accepts only these exact commands:

- `OPEN_MAPS`
- `OPEN_BROWSER`
- `OPEN_CAMERA`
- `OPEN_WHATSAPP`
- `OPEN_SETTINGS`
- `OPEN_FLASHLIGHT`
- `CLOSE_FLASHLIGHT`
- `SET_TIMER`
- `BATTERY_STATUS`
- `BLUETOOTH_ON`
- `BLUETOOTH_OFF`

Any unknown command, shell-like payload, code injection attempt, or extra request fields are rejected. The bridge does **not** execute arbitrary shell commands, JavaScript, intents, file operations, or user-supplied code.

## Android integration

The current web/prototype implementation uses a **dry-run broadcast adapter**. The final native Android APK must implement the actual `BroadcastReceiver` / `sendBroadcast` call to emit `AI_BRIDGE_TEST` with `extras.command` set to the exact allowlisted command. See the dashboard's "Native Android integration" section for the Kotlin reference.

## Data collection

This prototype does not collect analytics, telemetry, or user data. Request logs contain only request IDs, timestamps, command names, and validation results — no sensitive data.
