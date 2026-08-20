import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ALLOWED_COMMANDS,
  COMMAND_DESCRIPTIONS,
  type BridgeResult,
} from "@/lib/bridge/commands";
import { handleCommand } from "@/lib/bridge/handleCommand";
import { BROADCAST_ACTION, getAdapter } from "@/lib/bridge/adapter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sefey Controller Bridge — Local Dry-Run Console" },
      {
        name: "description",
        content:
          "Localhost-only command bridge prototype for a private Android assistant: strict allowlist, dry-run broadcast adapter, no cloud, no analytics.",
      },
      { property: "og:title", content: "Sefey Controller Bridge — Local Dry-Run Console" },
      {
        property: "og:description",
        content:
          "Private, localhost-only bridge prototype with a strict 11-command allowlist and a safe dry-run Android broadcast adapter.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BridgeDashboard,
});

const LOCAL_URL = "http://127.0.0.1:8080/api/command";

function BridgeDashboard() {
  const [log, setLog] = useState<BridgeResult[]>([]);
  const [custom, setCustom] = useState("");
  const adapter = getAdapter();

  async function run(command: string) {
    const result = await handleCommand({ command });
    setLog((prev) => [result, ...prev].slice(0, 40));
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 pb-16 pt-6">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          private prototype
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Sefey Controller Bridge
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Local-first command bridge between Sefey/ChatterUI and an existing Automate
          flow. Not deployed, not public, no data collection.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-chart-2" />
            <span className="text-sm font-medium">Bridge online — dry-run mode</span>
          </div>
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
            127.0.0.1 only
          </span>
        </div>
        <dl className="mt-4 space-y-2 font-mono text-xs">
          <Row label="endpoint" value={`POST ${LOCAL_URL}`} />
          <Row label="payload" value={'{"command":"OPEN_FLASHLIGHT"}'} />
          <Row label="adapter" value={adapter.name} />
          <Row label="broadcast" value={`${BROADCAST_ACTION} · extras.command`} />
          <Row label="allowlist" value={`${ALLOWED_COMMANDS.length} commands`} />
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Security notes</h2>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            HTTP API answers loopback hosts only (127.0.0.1 / localhost). Non-loopback
            requests are refused with 403; nothing binds to 0.0.0.0.
          </li>
          <li>
            Only the {ALLOWED_COMMANDS.length} allowlisted strings below are accepted.
            Anything else is blocked before any adapter call.
          </li>
          <li>
            No shell, no eval, no file access, no dynamic intents, no user-supplied code
            paths. The command string is compared against a fixed list — never
            interpreted.
          </li>
          <li>
            The web layer cannot send Android broadcasts. Buttons here exercise
            validation + the dry-run adapter only; real{" "}
            <span className="font-mono">sendBroadcast</span> happens in the native APK.
          </li>
          <li>No analytics, no telemetry, no persistence — the log lives in memory.</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Allowlisted commands</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALLOWED_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => run(cmd)}
              className="rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors active:bg-accent hover:bg-accent"
            >
              <span className="block font-mono text-sm font-medium">{cmd}</span>
              <span className="block text-xs text-muted-foreground">
                {COMMAND_DESCRIPTIONS[cmd]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Rejection test</h2>
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. DELETE_ALL_FILES"
            className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => run(custom)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Send
          </button>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Request log</h2>
          {log.length > 0 && (
            <button
              onClick={() => setLog([])}
              className="text-xs text-muted-foreground underline"
            >
              clear
            </button>
          )}
        </div>
        {log.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No requests yet. Tap a command above.
          </p>
        ) : (
          <ul className="space-y-2">
            {log.map((entry, i) => (
              <li key={i} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-sm">
                    {entry.command ?? "—"}
                  </span>
                  <StatusBadge status={entry.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{entry.message}</p>
                {entry.broadcast && (
                  <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 font-mono text-[10px] text-muted-foreground">
                    {entry.broadcast.nativeCall}
                  </pre>
                )}
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {entry.receivedAt}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: BridgeResult["status"] }) {
  const styles =
    status === "success"
      ? "bg-chart-2/15 text-chart-2"
      : status === "blocked"
        ? "bg-destructive/15 text-destructive"
        : "bg-chart-5/15 text-chart-5";
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ${styles}`}
    >
      {status}
    </span>
  );
}
