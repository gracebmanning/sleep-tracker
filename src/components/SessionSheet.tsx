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
import { describeError, updateSession, type Lookup, type SleepSession } from "@/lib/sleep";
import { fromInputValue, parseLocalTimestamp, toInputValue, toLocalTimestamp } from "@/lib/time";

export interface EditTarget {
    session: SleepSession;
    /** Show the wake-time field even though the session is still open (stale session). */
    askWake: boolean;
}

interface SessionSheetProps {
    target: EditTarget | null;
    activities: Lookup[];
    aids: Lookup[];
    onClose: () => void;
    onSaved: (updated: SleepSession) => void;
}

export function SessionSheet({ target, activities, aids, onClose, onSaved }: SessionSheetProps) {
    return (
        <Sheet
            open={target !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Sleep details</SheetTitle>
                    <SheetDescription>All optional. Change anything, then save.</SheetDescription>
                </SheetHeader>
                {target && (
                    <SessionForm
                        key={target.session.id}
                        target={target}
                        activities={activities}
                        aids={aids}
                        onClose={onClose}
                        onSaved={onSaved}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}

function SessionForm({
    target,
    activities,
    aids,
    onClose,
    onSaved,
}: Omit<SessionSheetProps, "target"> & { target: EditTarget }) {
    const { session, askWake } = target;
    const showWake = askWake || session.woke_up !== null;

    const [start, setStart] = useState(() => toInputValue(session.sleep_start));
    const [wake, setWake] = useState(() =>
        session.woke_up
            ? toInputValue(session.woke_up)
            : askWake
              ? toInputValue(toLocalTimestamp())
              : "",
    );
    const [activityId, setActivityId] = useState(session.pre_bed_activity_id ?? "");
    const [aidId, setAidId] = useState(session.sleep_aid_id ?? "");
    const [notes, setNotes] = useState(session.notes ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedActivity = activities.find((a) => a.id === activityId);

    async function handleSave() {
        setError(null);
        const sleepStart = fromInputValue(start);
        const wokeUp = wake ? fromInputValue(wake) : null;

        if (wokeUp && parseLocalTimestamp(wokeUp) <= parseLocalTimestamp(sleepStart)) {
            setError("Wake time must be after the start time.");
            return;
        }

        setSaving(true);
        const { data, error } = await updateSession(session.id, {
            sleep_start: sleepStart,
            woke_up: wokeUp,
            pre_bed_activity_id: activityId || null,
            sleep_aid_id: aidId || null,
            notes: notes.trim() || null,
        });
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
                    <label className="text-sm font-medium" htmlFor="sleep-start">
                        Went to sleep
                    </label>
                    <Input
                        id="sleep-start"
                        type="datetime-local"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                    />
                </div>

                {showWake && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" htmlFor="woke-up">
                            Woke up
                        </label>
                        <Input
                            id="woke-up"
                            type="datetime-local"
                            required={session.woke_up !== null}
                            value={wake}
                            onChange={(e) => setWake(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="pre-bed">
                        Before bed
                    </label>
                    <NativeSelect
                        id="pre-bed"
                        value={activityId}
                        onChange={(e) => setActivityId(e.target.value)}
                    >
                        <option value="">Not set</option>
                        {activities.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </NativeSelect>
                    {selectedActivity?.examples && (
                        <p className="text-xs text-muted-foreground">{selectedActivity.examples}</p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="sleep-aid">
                        Falling asleep to
                    </label>
                    <NativeSelect
                        id="sleep-aid"
                        value={aidId}
                        onChange={(e) => setAidId(e.target.value)}
                    >
                        <option value="">Not set</option>
                        {aids.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </NativeSelect>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" htmlFor="notes">
                        Notes
                    </label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
