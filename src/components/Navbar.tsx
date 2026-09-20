import { NavLink } from "react-router-dom";
import { HouseIcon, BedIcon, PillIcon, BrainIcon, UserIcon } from "@phosphor-icons/react";

const links = [
    { href: "/", label: "Home", icon: HouseIcon },
    { href: "/sleep-log", label: "Sleep", icon: BedIcon },
    { href: "/consumption-log", label: "Consumption", icon: PillIcon },
    { href: "/incidents-log", label: "Incidents", icon: BrainIcon },
    { href: "/user", label: "User", icon: UserIcon },
];

export default function Navbar() {
    const current = window.location.pathname;
    return (
        <nav className="w-full max-w-(--max-width) mx-auto my-0 fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 bg-background border-t border-t-foreground">
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <NavLink
                        key={link.href}
                        to={link.href}
                        end={link.href === "/"}
                        className={({ isActive }) =>
                            `flex justify-center items-center w-8 h-8 p-2 rounded-full text-foreground transition-colors ${isActive ? "opacity-100 bg-bg-fg-blend" : "opacity-75 bg-transparent"}`
                        }
                        aria-label={link.label}
                        aria-current={current === link.href ? "page" : "false"}
                    >
                        <Icon weight="regular" />
                    </NavLink>
                );
            })}
        </nav>
    );
}
