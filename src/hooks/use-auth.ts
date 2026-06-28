import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "seller" | "customer";

export type AuthState = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (userId: string | undefined) => {
      if (!userId) return [];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      return (data?.map((r: { role: AppRole }) => r.role) ?? []) as AppRole[];
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState((s) => ({ ...s, session, user: session?.user ?? null }));
      // defer role fetch
      setTimeout(async () => {
        const roles = await loadRoles(session?.user?.id);
        if (mounted) setState({ session, user: session?.user ?? null, roles, loading: false });
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const roles = await loadRoles(session?.user?.id);
      if (mounted) setState({ session, user: session?.user ?? null, roles, loading: false });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}
