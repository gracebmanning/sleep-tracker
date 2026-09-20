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
        <nav className="site-navbar">
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <NavLink
                        key={link.href}
                        to={link.href}
                        end={link.href === "/"}
                        className={({ isActive }) =>
                            `site-navbar__link ${isActive ? "site-navbar__link--active" : ""}`
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
