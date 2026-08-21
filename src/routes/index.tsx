import { createFileRoute } from "@tanstack/react-router";
import { BridgeDashboard } from "@/components/bridge-dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sefey Controller Bridge — Local Dry-Run Console" },
      {
        name: "description",
        content:
          "Localhost-only command bridge prototype for a private Android assistant: strict 11-command allowlist, dry-run Automate broadcast adapter, no cloud, no analytics.",
      },
      { property: "og:title", content: "Sefey Controller Bridge — Local Dry-Run Console" },
      {
        property: "og:description",
        content:
          "Private, loopback-only bridge prototype with a strict command allowlist and a safe dry-run Android broadcast adapter.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BridgeDashboard,
});
