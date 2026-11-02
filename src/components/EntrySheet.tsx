import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { NativeSelect } from "@/components/NativeSelect";
import {
    formatNumber,
    insertEntry,
    unitLabel,
    updateEntry,
    type ConsumptionEntry,
    type Item,
} from "@/lib/consumption";
import { describeError } from "@/lib/sleep";
import { fromInputValue, toInputValue, toLocalTimestamp } from "@/lib/time";

export type EntryTarget = { mode: "create" } | { mode: "edit"; entry: ConsumptionEntry };

const QUANTITY_CHIPS = [
    { label: "¼", value: 0.25 },
    { label: "½", value: 0.5 },
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
];

interface EntrySheetProps {
    target: EntryTarget | null;
    items: Item[];
    onClose: () => void;
    onSaved: (entry: ConsumptionEntry) => void;
}

export function EntrySheet({ target, items, onClose, onSaved }: EntrySheetProps) {
    return (
        <Sheet
            open={target !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {target?.mode === "edit" ? "Edit entry" : "Log consumption"}
                    </SheetTitle>
                    <SheetDescription>
                        Pick an item, then adjust the amount or time if needed.
                    </SheetDescription>
                </SheetHeader>
                {target && (
                    <EntryForm
                        key={target.mode === "edit" ? target.entry.id : "new"}
                        target={target}
                        items={items}
                        onClose={onClose}
                        onSaved={onSaved}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}

function EntryForm({
    target,
    items,
    onClose,
    onSaved,
}: Omit<EntrySheetProps, "target"> & { target: EntryTarget }) {
    const entry = target.mode === "edit" ? target.entry : null;

    const [itemId, setItemId] = useState(entry?.item_id ?? "");
    const [quantity, setQuantity] = useState(entry ? formatNumber(entry.quantity) : "1");
    const [amount, setAmount] = useState(entry ? formatNumber(entry.amount) : "");
    const [amountTouched, setAmountTouched] = useState(false);
    const [time, setTime] = useState(() =>
        toInputValue(entry ? entry.consumed_at : toLocalTimestamp()),
    );
    const [notes, setNotes] = useState(entry?.notes ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const item = items.find((i) => i.id === itemId);

    // Fill in amount = quantity x item default, unless you've typed your own amount.
    function recalc(nextItemId: string, nextQuantity: string) {
        if (amountTouched) return;
        const it = items.find((i) => i.id === nextItemId);
        const q = Number(nextQuantity);
        if (it && q > 0) setAmount(formatNumber(q * it.default_amount));
    }

    function changeItem(id: string) {
        setItemId(id);
        recalc(id, quantity);
    }

    function changeQuantity(q: string) {
        setQuantity(q);
        recalc(itemId, q);
    }

    // Group the dropdown by substance.
    const groups = new Map<string, Item[]>();
    for (const it of items) {
        const list = groups.get(it.substance.name) ?? [];
        list.push(it);
        groups.set(it.substance.name, list);
    }

    async function handleSave() {
        setError(null);
        const q = Number(quantity);
        const a = Number(amount);
        if (!item) return setError("Choose an item.");
        if (!(q > 0)) return setError("Quantity must be more than 0.");
        if (amount === "" || !(a >= 0)) return setError("Enter an amount.");
        if (!time) return setError("Enter a time.");

        const row = {
            item_id: item.id,
            quantity: q,
            amount: a,
            consumed_at: fromInputValue(time),
            notes: notes.trim() || null,
        };

        setSaving(true);
        const { data, error } = entry ? await updateEntry(entry.id, row) : await insertEntry(row);
        setSaving(false);

        if (error || !data) {
            setError(error ? describeError(error) : "Couldn't save.");
            return;
        }
        onSaved(data);
    }

    return (
        <>
            <div className="flex flex-col gap-4 px-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="entry-item">
                        Item
                    </label>
                    <NativeSelect
                        id="entry-item"
                        value={itemId}
                        onChange={(e) => changeItem(e.target.value)}
                    >
                        <option value="">Choose…</option>
                        {[...groups.entries()].map(([substance, list]) => (
                            <optgroup key={substance} label={substance}>
                                {list.map((it) => (
                                    <option key={it.id} value={it.id}>
                                        {it.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </NativeSelect>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Quantity</span>
                    <div className="flex flex-wrap gap-2">
                        {QUANTITY_CHIPS.map((chip) => (
                            <Button
                                key={chip.label}
                                type="button"
                                size="sm"
                                variant={Number(quantity) === chip.value ? "default" : "outline"}
                                onClick={() => changeQuantity(String(chip.value))}
                            >
                                {chip.label}
                            </Button>
                        ))}
                        <Input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            aria-label="Custom quantity"
                            className="h-8 w-24"
                            value={quantity}
                            onChange={(e) => changeQuantity(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="entry-amount">
                        Amount{item ? ` (${unitLabel(item.substance.unit)})` : ""}
                    </label>
                    <Input
                        id="entry-amount"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            setAmountTouched(true);
                        }}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="entry-time">
                        When
                    </label>
                    <Input
                        id="entry-time"
                        type="datetime-local"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="entry-notes">
                        Notes
                    </label>
                    <Textarea
                        id="entry-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>

            <SheetFooter>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
            </SheetFooter>
        </>
    );
}
