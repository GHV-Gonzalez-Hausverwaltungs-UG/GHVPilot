"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabaseclient";
import type { Tables } from "@/types/supabase";
import { useCurrentUser } from "./useCurrentUser";

type Profile = Tables<"profiles">;

type UseCurrentProfileResult = {
  user: ReturnType<typeof useCurrentUser>["user"];
  profile: Profile | null;
  loading: boolean;
  error: string | null;
};

export function useCurrentProfile(): UseCurrentProfileResult {
  const { user, loading: authLoading } = useCurrentUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wenn Auth noch lädt → nichts tun
    if (authLoading) return;

    // Kein User eingeloggt
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Profil laden fehlgeschlagen:", error);
        setError(error.message);
        setProfile(null);
      } else {
        setProfile(data ?? null);
      }

      setLoading(false);
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { user, profile, loading: authLoading || loading, error };
}
