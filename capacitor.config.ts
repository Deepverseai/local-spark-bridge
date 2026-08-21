import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sefey.controllerbridge",
  appName: "Sefey Controller Bridge",
  webDir: "dist-spa",
  android: {
    allowMixedContent: false,
  },
};

export default config;
