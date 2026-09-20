class SiteNavbar extends HTMLElement {
    connectedCallback() {
        const links = [
            { href: "/index.html", label: "Home", icon: "ph-house" },
            { href: "/sleep-log.html", label: "Sleep", icon: "ph-bed" },
            { href: "/consumption-log.html", label: "Consumption", icon: "ph-pill" },
            { href: "/incidents-log.html", label: "Incidents", icon: "ph-brain" },
            { href: "/user.html", label: "User", icon: "ph-user" },
        ];
        const current = window.location.pathname;

        this.innerHTML = `
        <nav class="site-navbar">
            ${links
                .map(
                    (link) => `
                <a
                    href="${link.href}"
                    class="site-navbar__link${current === link.href ? " site-navbar__link--active" : ""}"
                    aria-label="${link.label}"
                    aria-current="${current === link.href ? "page" : "false"}"
                >
                    <i class="ph ${link.icon}"></i>
                </a>
            `,
                )
                .join("")}
        </nav>
        `;
    }
}

customElements.define("site-navbar", SiteNavbar);
