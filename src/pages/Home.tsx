import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SessionSheet, type EditTarget } from "@/components/SessionSheet";
import {
    deleteSession,
    describeError,
    getOpenSession,
    getPreBedActivities,
    getSleepAids,
    startNight,
    updateSession,
    type Lookup,
    type SleepSession,
} from "@/lib/sleep";
import {
    formatDateTime,
    formatDuration,
    formatStopwatch,
    formatTime,
    parseLocalTimestamp,
    toLocalTimestamp,
} from "@/lib/time";

const STALE_MS = 16 * 60 * 60 * 1000;

export default function Home() {
    const [session, setSession] = useState<SleepSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [activities, setActivities] = useState<Lookup[]>([]);
    const [aids, setAids] = useState<Lookup[]>([]);

    // Load the open session and the dropdown lists.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [open, acts, sleepAids] = await Promise.all([
                getOpenSession(),
                getPreBedActivities(),
                getSleepAids(),
            ]);
            if (cancelled) return;
            const err = open.error ?? acts.error ?? sleepAids.error;
            setLoadError(err ? err.message : null);
            setSession(open.data ?? null);
            setActivities(acts.data ?? []);
            setAids(sleepAids.data ?? []);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    // Tick the stopwatch only while a session is open.
    const isOpen = session !== null;
    useEffect(() => {
        if (!isOpen) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [isOpen]);

    async function handleStart() {
        setBusy(true);
        const { data, error } = await startNight(toLocalTimestamp());
        setBusy(false);
        if (error || !data) {
            toast.error(error ? describeError(error) : "Couldn't save.");
            return;
        }
        setNow(Date.now());
        setSession(data);
        toast(`Sleep started ${formatTime(parseLocalTimestamp(data.sleep_start))}`, {
            duration: 8000,
            action: {
                label: "Add details",
                onClick: () => setEditTarget({ session: data, askWake: false }),
            },
            cancel: {
                label: "Undo",
                onClick: async () => {
                    const res = await deleteSession(data.id);
                    if (res.error) toast.error(describeError(res.error));
                    else setSession(null);
                },
            },
        });
    }

    async function handleWake() {
        if (!session) return;
        setBusy(true);
        const { data, error } = await updateSession(session.id, { woke_up: toLocalTimestamp() });
        setBusy(false);
        if (error || !data) {
            toast.error(error ? describeError(error) : "Couldn't save.");
            return;
        }
        setSession(null);
        const wokeUp = parseLocalTimestamp(data.woke_up ?? data.sleep_start).getTime();
        const slept = formatDuration(wokeUp - parseLocalTimestamp(data.sleep_start).getTime());
        toast(`Slept ${slept}`, {
            duration: 8000,
            action: {
                label: "Edit",
                onClick: () => setEditTarget({ session: data, askWake: false }),
            },
            cancel: {
                label: "Undo",
                onClick: async () => {
                    const res = await updateSession(data.id, { woke_up: null });
                    if (res.error || !res.data)
                        toast.error(res.error ? describeError(res.error) : "Couldn't undo.");
                    else setSession(res.data);
                },
            },
        });
    }

    async function handleResetStart() {
        if (!session) return;
        const previous = session.sleep_start;
        const { data, error } = await updateSession(session.id, {
            sleep_start: toLocalTimestamp(),
        });
        if (error || !data) {
            toast.error(error ? describeError(error) : "Couldn't save.");
            return;
        }
        setNow(Date.now());
        setSession(data);
        toast("Start time reset to now", {
            cancel: {
                label: "Undo",
                onClick: async () => {
                    const res = await updateSession(data.id, { sleep_start: previous });
                    if (res.data) setSession(res.data);
                },
            },
        });
    }

    function handleSaved(updated: SleepSession) {
        setSession((current) =>
            current && current.id === updated.id
                ? updated.woke_up === null
                    ? updated
                    : null
                : current,
        );
        setEditTarget(null);
        toast.success("Saved");
    }

    if (loading) {
        return <p className="p-4 text-center text-muted-foreground">Loading…</p>;
    }

    if (loadError) {
        return (
            <div className="flex flex-col items-center gap-3 p-4 text-center">
                <p className="text-sm text-destructive">{loadError}</p>
                <Button
                    variant="outline"
                    onClick={() => {
                        setLoading(true);
                        setReloadKey((k) => k + 1);
                    }}
                >
                    Try again
                </Button>
            </div>
        );
    }

    const start = session ? parseLocalTimestamp(session.sleep_start) : null;
    const elapsed = start ? now - start.getTime() : 0;
    const stale = elapsed >= STALE_MS;

    return (
        <div className="flex min-h-[calc(100svh-5rem)] flex-col items-center justify-center gap-6 p-4 pb-24">
            {session === null || start === null ? (
                <Button
                    disabled={busy}
                    onClick={handleStart}
                    className="h-44 w-44 flex-col gap-2 rounded-full bg-sleep text-xl font-semibold text-background hover:bg-sleep/90"
                >
                    <MoonIcon weight="fill" className="size-10" />
                    Going to sleep
                </Button>
            ) : (
                <>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Asleep since {formatTime(start)}
                        </p>
                        <p className="font-mono text-6xl font-semibold tabular-nums text-sleep">
                            {formatStopwatch(elapsed)}
                        </p>
                    </div>

                    {stale && (
                        <div className="flex max-w-xs flex-col items-center gap-2 rounded-lg border border-destructive/40 p-3 text-center text-sm">
                            <p>
                                This session started {formatDateTime(start)}, over 16 hours ago.
                                Still asleep?
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditTarget({ session, askWake: true })}
                            >
                                Set wake time
                            </Button>
                        </div>
                    )}

                    <Button
                        disabled={busy}
                        onClick={handleWake}
                        className="h-16 w-full max-w-xs gap-2 bg-sleep text-lg text-background hover:bg-sleep/90"
                    >
                        <SunIcon weight="fill" className="size-6" />
                        I'm awake
                    </Button>

                    <div className="flex flex-col items-center">
                        <Button variant="link" size="sm" onClick={handleResetStart}>
                            Still awake? Reset to now
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditTarget({ session, askWake: false })}
                        >
                            Add details
                        </Button>
                    </div>
                </>
            )}

            <SessionSheet
                target={editTarget}
                activities={activities}
                aids={aids}
                onClose={() => setEditTarget(null)}
                onSaved={handleSaved}
            />
        </div>
    );
}
