"use client";

import React from "react";
import AuthWrapper from "@/components/AuthWrapper";

import { useOfflineSync } from "@/lib/useOfflineSync";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dexie / Offline-Sync
  useOfflineSync();

  // Online/Offline Badge
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Service Worker
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js");
          console.log("✅ Service Worker registered:", reg.scope);
        } catch (err) {
          console.error("❌ Service Worker registration failed:", err);
        }
      };
      // sofort registrieren (statt auf window.load zu warten)
      registerSW();
    }
  }, []);

  return (
    <>
      {!online && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500/50 border border-red-500 text-red-500 rounded z-[60]">
          Offline-Modus aktiv
        </div>
      )}

      <AuthWrapper>{children}</AuthWrapper>
    </>
  );
}
