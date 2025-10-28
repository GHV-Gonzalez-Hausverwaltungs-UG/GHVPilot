// components/AuthGate.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseclient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "authorized" | "unauthorized"
  >("loading");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus("unauthorized");
        // cast to any to satisfy the router typing for RouteImpl<"/auth/login">
        router.replace("/auth/login" as unknown as any);
      } else {
        setStatus("authorized");
      }
    }

    checkSession();
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (status === "unauthorized") {
    return null;
  }

  return <>{children}</>;
}
