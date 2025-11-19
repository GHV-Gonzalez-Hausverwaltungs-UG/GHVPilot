"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabaseclient";
import type { User } from "@supabase/supabase-js";

type UseCurrentUserResult = {
  user: User | null;
  loading: boolean;
};

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Initialen User holen
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("getUser error", error);
          setUser(null);
        } else {
          setUser(data.user ?? null);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("getUser exception", err);
        setUser(null);
        setLoading(false);
      });

    // 2. Auf Auth-Änderungen hören (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
