import * as React from "react";
import { ThemeContext, type Theme } from "@/components/theme-context";

const STORAGE_KEY = "theme";

function getSystemTheme(): Theme {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Matches the inline script in index.html so there's no mismatch on mount
    const [theme, setThemeState] = React.useState<Theme>(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return stored ?? getSystemTheme();
    });

    // While the user has never made an explicit choice, keep following the OS setting live
    React.useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY)) return;

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            const next = getSystemTheme();
            setThemeState(next);
            applyTheme(next);
        };
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    React.useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setTheme = React.useCallback((next: Theme) => {
        localStorage.setItem(STORAGE_KEY, next); // explicit choice: stop following the OS from now on
        setThemeState(next);
    }, []);

    const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
