import { supabase } from "@/lib/supabaseClient";
import type { Tables, TablesUpdate } from "@/lib/database.types";

export type SleepSession = Tables<"sleep_sessions">;
export type Lookup = { id: string; name: string; examples?: string | null };

export function getOpenSession() {
    return supabase.from("sleep_sessions").select("*").is("woke_up", null).maybeSingle();
}

export function startNight(sleepStart: string) {
    return supabase
        .from("sleep_sessions")
        .insert({ kind: "night", sleep_start: sleepStart })
        .select()
        .single();
}

export function updateSession(id: string, patch: TablesUpdate<"sleep_sessions">) {
    return supabase.from("sleep_sessions").update(patch).eq("id", id).select().single();
}

export function deleteSession(id: string) {
    return supabase.from("sleep_sessions").delete().eq("id", id);
}

export function getPreBedActivities() {
    return supabase
        .from("pre_bed_activities")
        .select("id, name, examples")
        .eq("archived", false)
        .order("name");
}

export function getSleepAids() {
    return supabase.from("sleep_aids").select("id, name").eq("archived", false).order("name");
}

/** Turns database constraint errors into plain language. */
export function describeError(error: { code?: string; message: string }): string {
    if (error.code === "23P01") return "That overlaps another sleep session.";
    if (error.code === "23505")
        return "There's already a sleep session for this night, or one is still open.";
    if (error.code === "23514") return "Check the times: wake-up must be after the start.";
    return error.message;
}
