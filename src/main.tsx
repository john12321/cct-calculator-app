import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./styles/main.scss";
import packageJson from "../package.json";

document.title = `Completion of Training Date Calculator v${packageJson.version}`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
