import { supabase } from "@/lib/supabaseClient";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

export type ConsumptionEntry = Tables<"consumption_entries">;

export interface Item {
    id: string;
    name: string;
    default_amount: number;
    quick_quantity: number;
    is_favorite: boolean;
    substance: { name: string; unit: string };
}

export async function getItems(): Promise<{ items: Item[]; error: string | null }> {
    const { data, error } = await supabase
        .from("consumption_items")
        .select("id, name, default_amount, quick_quantity, is_favorite, substances(name, unit)")
        .eq("archived", false)
        .order("name");
    if (error) return { items: [], error: error.message };
    const items: Item[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        default_amount: Number(row.default_amount),
        quick_quantity: Number(row.quick_quantity),
        is_favorite: row.is_favorite,
        substance: row.substances ?? { name: "Other", unit: "mg" },
    }));
    return { items, error: null };
}

export function insertEntry(row: TablesInsert<"consumption_entries">) {
    return supabase.from("consumption_entries").insert(row).select().single();
}

export function updateEntry(id: string, patch: TablesUpdate<"consumption_entries">) {
    return supabase.from("consumption_entries").update(patch).eq("id", id).select().single();
}

export function deleteEntry(id: string) {
    return supabase.from("consumption_entries").delete().eq("id", id);
}

export function unitLabel(unit: string): string {
    return unit === "standard_drinks" ? "standard drinks" : unit;
}

/** 0.25, 1, 400 (max 2 decimals, no trailing zeros) */
export function formatNumber(n: number): string {
    return String(Math.round(n * 100) / 100);
}

/** "2 × Ibuprofen 200 mg" (or just the name when the quick quantity is 1) */
export function quickLabel(item: Item): string {
    return item.quick_quantity === 1
        ? item.name
        : `${formatNumber(item.quick_quantity)} × ${item.name}`;
}
