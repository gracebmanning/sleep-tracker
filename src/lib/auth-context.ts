import { createContext } from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";

export interface AuthContextValue {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
    verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
