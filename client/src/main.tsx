import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Firebase debug utilities in development
if (import.meta.env.DEV) {
  import('./lib/firebase-debug').then(({ testFirebaseConnectivity }) => {
    // Add debug function to window for testing
    (window as any).testFirebase = testFirebaseConnectivity;
    console.log('Firebase debug tools loaded. Run testFirebase() in console to test connectivity.');
  });
}

// Safely create root with error handling
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

