import { describe, expect, it } from "vitest";
import { bridgeHttpHandler, isLoopbackHost } from "./httpHandler";

function req(body: unknown, host = "127.0.0.1:8080") {
  return new Request("http://127.0.0.1:8080/command", {
    method: "POST",
    headers: { host, "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("loopback enforcement", () => {
  it("accepts loopback hosts", () => {
    for (const h of ["127.0.0.1:8080", "localhost", "[::1]:8080", "LOCALHOST:3000"]) {
      expect(isLoopbackHost(h)).toBe(true);
    }
  });

  it("rejects everything else", () => {
    for (const h of [null, "", "0.0.0.0:8080", "192.168.1.5", "example.com"]) {
      expect(isLoopbackHost(h)).toBe(false);
    }
  });

  it("returns 403 for a non-loopback request", async () => {
    const res = await bridgeHttpHandler(req({ command: "OPEN_MAPS" }, "example.com"));
    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe("NON_LOOPBACK");
  });
});

describe("POST /command", () => {
  it("returns 200 for an allowlisted command", async () => {
    const res = await bridgeHttpHandler(req({ command: "OPEN_FLASHLIGHT" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.broadcast.extras.command).toBe("OPEN_FLASHLIGHT");
    expect(body.broadcast.dryRun).toBe(true);
  });

  it("returns 403 for a blocked command", async () => {
    const res = await bridgeHttpHandler(req({ command: "DELETE_ALL_FILES" }));
    expect(res.status).toBe(403);
    expect((await res.json()).status).toBe("blocked");
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await bridgeHttpHandler(req("{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toBe("BAD_JSON");
  });

  it("returns 400 for extra fields", async () => {
    const res = await bridgeHttpHandler(req({ command: "OPEN_MAPS", exec: "rm -rf /" }));
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toBe("UNEXPECTED_FIELDS");
  });

  it("does not send wildcard CORS headers", async () => {
    const res = await bridgeHttpHandler(req({ command: "OPEN_MAPS" }));
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});
