import * as React from "react";
import { syncOfflineData } from "@/lib/offlineSync";

export function useOfflineSync() {
  React.useEffect(() => {
    let syncing = false;

    const trySync = async () => {
      if (syncing) return;
      syncing = true;
      await syncOfflineData();
      syncing = false;
    };

    window.addEventListener("online", trySync);
    trySync(); // sofort beim Start

    return () => window.removeEventListener("online", trySync);
  }, []);
}
