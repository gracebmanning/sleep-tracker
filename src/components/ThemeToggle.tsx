import { MoonIcon, SunIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/use-theme";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            {theme === "dark" ? (
                <SunIcon weight="regular" className="w-5 h-5" />
            ) : (
                <MoonIcon weight="regular" className="w-5 h-5" />
            )}
        </Button>
    );
}
