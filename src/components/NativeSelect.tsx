import type { ComponentProps } from "react";

export function NativeSelect({ className = "", ...props }: ComponentProps<"select">) {
    return (
        <select
            className={`h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 [&>option]:bg-background [&>option]:text-foreground ${className}`}
            {...props}
        />
    );
}
