import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "./lib/push";

createRoot(document.getElementById("root")!).render(<App />);

const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
const isPreview = location.hostname.includes("lovableproject.com") || location.hostname.includes("id-preview--");
if (!inIframe && !isPreview) {
  registerSW();
} else {
  navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
}
