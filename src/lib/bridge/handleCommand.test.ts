import { describe, expect, it } from "vitest";
import { handleCommand } from "./handleCommand";
import { ALLOWED_COMMANDS } from "./commands";
import { BROADCAST_ACTION } from "./adapter";

describe("allowlisted commands", () => {
  for (const command of ALLOWED_COMMANDS) {
    it(`accepts ${command} and plans a dry-run broadcast`, async () => {
      const res = await handleCommand({ command });
      expect(res.status).toBe("success");
      expect(res.reason).toBe("OK");
      expect(res.command).toBe(command);
      expect(res.mode).toBe("dry-run");
      expect(res.broadcast).toEqual({
        action: BROADCAST_ACTION,
        extras: { command },
        nativeCall: expect.stringContaining(command),
        dryRun: true,
      });
      expect(res.requestId).toMatch(/^req_/);
      expect(new Date(res.receivedAt).toString()).not.toBe("Invalid Date");
    });
  }

  it("gives every request a unique id", async () => {
    const a = await handleCommand({ command: "OPEN_MAPS" });
    const b = await handleCommand({ command: "OPEN_MAPS" });
    expect(a.requestId).not.toBe(b.requestId);
  });
});

describe("blocked commands", () => {
  const hostile = [
    "DELETE_ALL_FILES",
    "rm -rf /",
    "OPEN_MAPS; rm -rf /",
    "$(cat /etc/passwd)",
    "`whoami`",
    "<script>alert(1)</script>",
    "require('fs').unlinkSync('/tmp/x')",
    "am start -a android.intent.action.VIEW",
    "open_maps",
    " OPEN_MAPS ",
    "OPEN_MAPS\n",
    "__proto__",
  ];

  for (const command of hostile) {
    it(`blocks ${JSON.stringify(command)}`, async () => {
      const res = await handleCommand({ command });
      expect(res.status).toBe("blocked");
      expect(res.reason).toBe("COMMAND_NOT_ALLOWED");
      expect(res.command).toBeNull();
      expect(res.broadcast).toBeUndefined();
    });
  }

  it("never echoes rejected input back to the caller", async () => {
    const res = await handleCommand({ command: "DELETE_ALL_FILES" });
    expect(JSON.stringify(res)).not.toContain("DELETE_ALL_FILES");
  });
});

describe("malformed payloads", () => {
  it("rejects a non-object body", async () => {
    expect((await handleCommand("OPEN_MAPS")).reason).toBe("BODY_NOT_OBJECT");
    expect((await handleCommand(null)).reason).toBe("BODY_NOT_OBJECT");
    expect((await handleCommand(["OPEN_MAPS"])).reason).toBe("BODY_NOT_OBJECT");
  });

  it("rejects a missing command field", async () => {
    expect((await handleCommand({})).reason).toBe("COMMAND_MISSING");
  });

  it("rejects non-string commands", async () => {
    expect((await handleCommand({ command: 42 })).reason).toBe("COMMAND_NOT_STRING");
    expect((await handleCommand({ command: "" })).reason).toBe("COMMAND_NOT_STRING");
    expect((await handleCommand({ command: ["OPEN_MAPS"] })).reason).toBe(
      "COMMAND_NOT_STRING",
    );
  });

  it("rejects extra/unexpected fields", async () => {
    const res = await handleCommand({ command: "OPEN_MAPS", shell: "rm -rf /" });
    expect(res.status).toBe("error");
    expect(res.reason).toBe("UNEXPECTED_FIELDS");
    expect(res.broadcast).toBeUndefined();
  });
});
