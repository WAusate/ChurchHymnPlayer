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

// Comprehensive error suppression for Vite plugin issues
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('insertBefore') ||
    event.message.includes('runtime-error-plugin') ||
    event.message.includes('Failed to execute \'insertBefore\' on \'Node\'')
  )) {
    console.warn('Vite plugin error suppressed:', event.message);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Also suppress unhandled promise rejections from Vite plugins
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('insertBefore') ||
    event.reason.message.includes('runtime-error-plugin')
  )) {
    console.warn('Vite plugin promise rejection suppressed');
    event.preventDefault();
  }
});

// Simple console.error override to suppress insertBefore errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('insertBefore') || message.includes('runtime-error-plugin')) {
      return; // Don't log these errors
    }
    return originalConsoleError.apply(console, args);
  };
}

// Safely create root with error handling
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

