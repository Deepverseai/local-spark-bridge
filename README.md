# Local AI Bridge

Build a private/local-first Sefey Controller Bridge prototype for an Android local AI assistant. This must NOT be a public production app and must NOT expose an API to the internet. The goal is to create the bridge layer that will later connect Sefey/ChatterUI to an existing Automate Android flow.

Required architecture and security:
- Localhost-only HTTP API, binding to 127.0.0.1 only; never bind to 0.0.0.0 and do not add cloud/public hosting.
- Strict allowlist of exactly these commands: OPEN_MAPS, OPEN_BROWSER, OPEN_CAMERA, OPEN_WHATSAPP, OPEN_SETTINGS, OPEN_FLASHLIGHT, CLOSE_FLASHLIGHT, SET_TIMER, BATTERY_STATUS, BLUETOOTH_ON, BLUETOOTH_OFF.
- Reject every unknown command with a clear error; never execute arbitrary shell commands, JavaScript, intents, file operations, or user-supplied code.
- Provide a simple local dashboard showing bridge status, localhost URL, allowlisted commands, request log, and success/blocked/error status. Do not collect analytics or user data.
- API endpoint should accept POST /command with JSON {"command":"OPEN_FLASHLIGHT"} and validate strictly.
- For now implement a SAFE DRY-RUN broadcast adapter abstraction rather than pretending a browser/web app can directly send Android broadcasts. The adapter should clearly show where the native Android layer will send the existing Automate broadcast AI_BRIDGE_TEST with extras.command. Do not claim Android execution works in the web preview.
- Include a test button for each allowlisted command that only exercises the local bridge validation/dry-run path.
- Include security notes in the UI explaining localhost-only and allowlist behavior.
- Mobile-first UI suitable for viewing on Android.
- Keep the code clean and easy to port into a native Android APK later. Do not deploy/publish the project.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a1a03cc9-565b-4090-800c-76e8a378988c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
