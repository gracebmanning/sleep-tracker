import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signInWithOtp: (email: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

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
                // do not allow new users to sign up
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

export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
