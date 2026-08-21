import React from "react";
import { createRoot } from "react-dom/client";
import { BridgeDashboard } from "@/components/bridge-dashboard";
import "@/styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <BridgeDashboard />
  </React.StrictMode>,
);
