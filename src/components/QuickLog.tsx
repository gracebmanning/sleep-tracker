import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PillIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EntrySheet, type EntryTarget } from "@/components/EntrySheet";
import { deleteEntry, getItems, insertEntry, quickLabel, type Item } from "@/lib/consumption";
import { describeError } from "@/lib/sleep";
import { formatTime, parseLocalTimestamp, toLocalTimestamp } from "@/lib/time";

export function QuickLog({ showMore }: { showMore: boolean }) {
    const [items, setItems] = useState<Item[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [sheet, setSheet] = useState<EntryTarget | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const result = await getItems();
            if (cancelled) return;
            setItems(result.items);
            setLoadError(result.error);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const favorites = items.filter((i) => i.is_favorite);

    async function logQuick(item: Item) {
        setBusyId(item.id);
        const { data, error } = await insertEntry({
            item_id: item.id,
            quantity: item.quick_quantity,
            amount: Math.round(item.quick_quantity * item.default_amount * 100) / 100,
            consumed_at: toLocalTimestamp(),
        });
        setBusyId(null);
        if (error || !data) {
            toast.error(error ? describeError(error) : "Couldn't save.");
            return;
        }
        toast(`Logged ${quickLabel(item)} · ${formatTime(parseLocalTimestamp(data.consumed_at))}`, {
            duration: 8000,
            action: { label: "Edit", onClick: () => setSheet({ mode: "edit", entry: data }) },
            cancel: {
                label: "Undo",
                onClick: async () => {
                    const res = await deleteEntry(data.id);
                    if (res.error) toast.error(describeError(res.error));
                },
            },
        });
    }

    function handleSaved() {
        setSheet(null);
        toast.success("Saved");
    }

    return (
        <div className="flex w-full max-w-xs flex-col items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quick log
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {favorites.map((item) => (
                    <Button
                        key={item.id}
                        variant="outline"
                        disabled={busyId === item.id}
                        onClick={() => logQuick(item)}
                        className="gap-2 border-consumption text-consumption"
                    >
                        <PillIcon weight="fill" className="size-5" />
                        {quickLabel(item)}
                    </Button>
                ))}
            </div>
            {showMore && (
                <Button variant="ghost" size="sm" onClick={() => setSheet({ mode: "create" })}>
                    More…
                </Button>
            )}
            {loadError && <p className="text-xs text-destructive">{loadError}</p>}

            <EntrySheet
                target={sheet}
                items={items}
                onClose={() => setSheet(null)}
                onSaved={handleSaved}
            />
        </div>
    );
}
