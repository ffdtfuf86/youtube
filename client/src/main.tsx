import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Enhanced: React 18 root API for improved performance
createRoot(document.getElementById("root")!).render(<App />);
