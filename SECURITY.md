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

## Android APK architecture

The final APK is built with Capacitor. It contains:

### Capacitor dashboard (WebView)
The existing web dashboard is compiled to a static client-side bundle (`dist-spa/`) and loaded into the Android WebView. The dashboard detects whether the native adapter plugin is available and switches from dry-run mode to native mode automatically.

### Native Kotlin localhost HTTP server
An embedded HTTP server (`LocalhostHttpServer.kt`) binds **exclusively to `127.0.0.1`** on port 8080. It serves the same `POST /command` and `POST /api/command` endpoints with the same strict 11-command validator, reimplemented in Kotlin (`BridgeValidator.kt`) to match the JS validation byte-for-byte.

Security layers:
1. **Bind assertion**: The server hard-binds to `127.0.0.1` and fails on startup if the bind address is anything else.
2. **Loopback Host check**: Requests whose Host header is not `127.0.0.1` / `localhost` / `::1` are rejected with `403 NON_LOOPBACK`.
3. **No wildcard CORS**: No `Access-Control-Allow-Origin` header is sent.
4. **No analytics, no persistence**: Request logs are metadata only (request ID, timestamp, status, reason code). Rejected input is never echoed back or stored.

### Native AI_BRIDGE_TEST broadcast adapter
After validation passes, the native `BroadcastAdapter.kt` emits `Intent("AI_BRIDGE_TEST")` with `extras.command` set to the exact allowlisted string via `context.sendBroadcast(intent)`. This replaces the dry-run adapter at the designed seam (`getAdapter()`). The adapter only ever receives an already-validated allowlisted string — no dynamic intents, no shell, no eval.

### Required Android networking configuration

**INTERNET permission** (`android.permission.INTERNET`) is required. Android requires this permission for any app that opens network sockets, including a `ServerSocket` bound to `127.0.0.1`. This permission grants socket creation, not public exposure. The localhost-only restriction is enforced by the bind address and loopback Host check, not by the permission.

**Network security config** (`network_security_config.xml`): The base config blocks cleartext traffic for all domains. A scoped domain-config exemption permits cleartext **only** for `localhost` and `127.0.0.1`, because the embedded HTTP server serves plain HTTP over loopback. Every non-loopback destination remains blocked. This config covers Android API 28 through 36 (target SDK 36). From Android 17 (API 37) and higher, an implicit localhost cleartext exemption is added automatically; the explicit config is harmless on 37+.

**Target SDK**: 36 (Android 16). **Minimum SDK**: 24 (Android 7.0).

## Data collection

This prototype does not collect analytics, telemetry, or user data. Request logs contain only request IDs, timestamps, command names, and validation results — no sensitive data.
