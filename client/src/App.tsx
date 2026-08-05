import React from "react";
import AppRouter from "./router";

const App = () => {
  React.useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });

      // ✅ Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("Message from SW:", event.data);
      });
    }
  }, []);

  return <AppRouter />;
};

export default App;
