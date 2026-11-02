const pad = (n: number) => String(n).padStart(2, "0");

/** Wall-clock value for Postgres `timestamp` columns, e.g. "2026-10-17T22:42:05". */
export function toLocalTimestamp(d: Date = new Date()): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Reads a Postgres timestamp (no zone) back as a local Date. */
export function parseLocalTimestamp(ts: string): Date {
    return new Date(ts.replace(" ", "T"));
}

/** For <input type="datetime-local">: "2026-10-17T22:42" */
export function toInputValue(ts: string): string {
    return ts.replace(" ", "T").slice(0, 16);
}

export function fromInputValue(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
}

export function formatTime(d: Date): string {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDateTime(d: Date): string {
    return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

/** 7h 12m */
export function formatDuration(ms: number): string {
    const totalMinutes = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** 00:00:00 */
export function formatStopwatch(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}
