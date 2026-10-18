import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext, type AuthContextValue } from "@/lib/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            user: session?.user ?? null,
            loading,
            // Emails a 6-digit code AND a backup magic link (same message).
            signInWithOtp: async (email) => {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
                });
                return { error };
            },
            verifyOtp: async (email, token) => {
                const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
                return { error };
            },
            signOut: async () => {
                await supabase.auth.signOut();
            },
        }),
        [session, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
