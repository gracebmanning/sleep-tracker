import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/lib/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = React.useState<Session | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setLoading(false);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    const signInWithOtp = React.useCallback(async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false,
                emailRedirectTo: window.location.origin,
            },
        });
        return { error: error?.message ?? null };
    }, []);

    const signOut = React.useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    const value = React.useMemo(
        () => ({ session, user: session?.user ?? null, loading, signInWithOtp, signOut }),
        [session, loading, signInWithOtp, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
