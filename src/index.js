import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(`${process.env.PUBLIC_URL}/firebase-messaging-sw.js`)
    .then((registration) => {
      console.log("✅ Service Worker registered:", registration);
    })
    .catch((err) => console.log("❌ Service Worker registration failed:", err));
}


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
