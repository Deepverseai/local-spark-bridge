import { useState } from "react";
import {
  ALLOWED_COMMANDS,
  COMMAND_DESCRIPTIONS,
  type AllowedCommand,
  type BridgeResult,
} from "@/lib/bridge/commands";
import { handleCommand } from "@/lib/bridge/handleCommand";
import {
  BROADCAST_ACTION,
  BROADCAST_EXTRA_KEY,
  buildBroadcastPlan,
  getAdapter,
} from "@/lib/bridge/adapter";

const LOCAL_URL = "http://127.0.0.1:8080/command";

export function BridgeDashboard() {
  const [log, setLog] = useState<BridgeResult[]>([]);
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<AllowedCommand>("OPEN_FLASHLIGHT");
  const adapter = getAdapter();
  const preview = buildBroadcastPlan(selected);

  async function run(command: string) {
    const result = await handleCommand({ command });
    setLog((prev) => [result, ...prev].slice(0, 50));
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 pb-16 pt-6">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          private prototype · not deployed
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Sefey Controller Bridge
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Local-first command bridge between Sefey/ChatterUI and an existing Automate
          flow.{" "}
          {adapter.canExecute
            ? "Native adapter active — broadcasts are sent to the Automate flow."
            : "Dry-run only: no Android broadcast can leave a web preview."}
        </p>
      </header>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${adapter.canExecute ? "bg-chart-2" : "animate-pulse bg-chart-5"}`}
            />
            <span className="text-sm font-medium">
              {adapter.canExecute
                ? "Bridge online — native mode"
                : "Bridge online — dry-run mode"}
            </span>
          </div>
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
            127.0.0.1 only
          </span>
        </div>
        <dl className="mt-4 space-y-2 font-mono text-xs">
          <Row label="endpoint" value={`POST ${LOCAL_URL}`} />
          <Row label="alias" value="POST /api/command" />
          <Row label="payload" value={'{"command":"OPEN_FLASHLIGHT"}'} />
          <Row label="adapter" value={adapter.name} />
          <Row
            label="broadcast"
            value={`${BROADCAST_ACTION} · extras.${BROADCAST_EXTRA_KEY}`}
          />
          <Row label="allowlist" value={`${ALLOWED_COMMANDS.length} commands`} />
        </dl>
      </Panel>

      <Section title="Security notes">
        <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
          <li>
            Loopback-only: requests whose Host is not 127.0.0.1 / localhost / ::1 get
            403. Nothing binds to 0.0.0.0, there is no wildcard CORS, no public hosting,
            no cloud database.
          </li>
          <li>
            Exactly {ALLOWED_COMMANDS.length} allowlisted strings are accepted. Bodies
            with a missing, non-string, empty, or extra field are rejected before any
            adapter call.
          </li>
          <li>
            No shell, no eval, no filesystem, no dynamic intents. The command is
            compared against a fixed list — never interpreted or interpolated into an
            executable form.
          </li>
          <li>
            Logging is metadata only: request id, timestamp, status, reason code.
            Rejected input is never echoed back or stored.
          </li>
          <li>
            No analytics, no telemetry, no persistence — the log lives in memory.
          </li>
        </ul>
      </Section>

      <Section title="Bridge test panel">
        <p className="mb-3 text-xs text-muted-foreground">
          Each button runs the real validation path and the adapter.{" "}
          {adapter.canExecute
            ? "Broadcasts are sent to the Automate flow."
            : "Nothing is sent to Android."}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALLOWED_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setSelected(cmd);
                void run(cmd);
              }}
              className={`rounded-lg border px-3 py-3 text-left transition-colors hover:bg-accent active:bg-accent ${
                selected === cmd ? "border-primary bg-accent" : "border-border bg-card"
              }`}
            >
              <span className="block font-mono text-sm font-medium">{cmd}</span>
              <span className="block text-xs text-muted-foreground">
                {COMMAND_DESCRIPTIONS[cmd]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">
              {adapter.canExecute
                ? "Broadcast payload"
                : "Simulated broadcast payload"}
            </span>
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${
                adapter.canExecute
                  ? "bg-chart-2/15 text-chart-2"
                  : "bg-chart-5/15 text-chart-5"
              }`}
            >
              {adapter.canExecute ? "native" : "dry run"}
            </span>
          </div>
          <pre className="overflow-x-auto rounded-md bg-muted p-2 font-mono text-[10px] leading-relaxed">
            {JSON.stringify(
              {
                action: preview.action,
                extras: preview.extras,
                dryRun: !adapter.canExecute,
              },
              null,
              2,
            )}
          </pre>
          <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 font-mono text-[10px] text-muted-foreground">
            {preview.nativeCall}
          </pre>
        </div>
      </Section>

      <Section title="Rejection test">
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
      </Section>

      <Section
        title="Request log"
        action={
          log.length > 0 ? (
            <button
              onClick={() => setLog([])}
              className="text-xs text-muted-foreground underline"
            >
              clear
            </button>
          ) : null
        }
      >
        {log.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No requests yet. Tap a command above.
          </p>
        ) : (
          <ul className="space-y-2">
            {log.map((entry) => (
              <li
                key={entry.requestId}
                className="rounded-lg border border-border bg-card p-3"
              >
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
                  {entry.requestId} · {entry.receivedAt} · {entry.reason}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Native Android integration">
        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            This web layer is the bridge/validation tier only. The final APK ships a
            native intent sender: after the same validation contract passes, Android
            code emits the broadcast that the existing Automate flow already listens
            for.
          </p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-[10px] leading-relaxed text-foreground">
{`// Android (Kotlin) — replaces DryRunAutomateAdapter
val intent = Intent("${BROADCAST_ACTION}")
intent.putExtra("${BROADCAST_EXTRA_KEY}", command) // exact allowlisted string
context.sendBroadcast(intent)

// Automate side: BroadcastReceiver on action ${BROADCAST_ACTION}
// reads extras.${BROADCAST_EXTRA_KEY} and runs the existing flow.`}
          </pre>
          <p>
            Contract stays identical: POST <span className="font-mono">/command</span>{" "}
            with <span className="font-mono">{'{"command":"..."}'}</span>, same
            allowlist, same JSON result shape. Only{" "}
            <span className="font-mono">getAdapter()</span> is swapped, and the embedded
            server must bind 127.0.0.1 exclusively.
          </p>
        </div>
      </Section>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">{children}</section>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
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
