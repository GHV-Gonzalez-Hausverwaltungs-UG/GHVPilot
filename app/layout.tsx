"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import { useOfflineSync } from "@/lib/useOfflineSync";
import React from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔹 1. Dexie Sync-Logik global aktiv
  useOfflineSync();

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

  // 🔹 2. Service Worker registrieren (damit HTML offline funktioniert)
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
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return (
    <html lang="de">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {!online && (
          <div className="fixed bottom-2 left-1/2 px-3 py-1 bg-red-500/50 border border-red-500 text-red-500 rounded">
            Offline-Modus aktiv
          </div>
        )}
        {/* 🔐 AuthWrapper & App */}
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
