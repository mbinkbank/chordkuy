import { useState } from "react";
import { Link, useRoute } from "../lib/router";
import { NAV_ITEMS, SITE } from "../lib/site";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const route = useRoute();
  const [open, setOpen] = useState(false);

  const isCurrent = (href: string) =>
    href === "/" ? route.pathname === "/" : route.pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label={`${SITE.name} — beranda`}>
            <span className="brand-mark" aria-hidden="true">
              ♭
            </span>
            <span>
              {SITE.name}
              <span className="brand-dot">_</span>
            </span>
          </Link>

          <nav className="nav" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={isCurrent(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/search" className="btn btn-sm btn-accent" aria-label="Cari chord lagu">
              <span aria-hidden="true">⌕</span> Cari
            </Link>
            <ThemeToggle />
            <button
              type="button"
              className="btn btn-sm btn-icon nav-toggle"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Buka menu navigasi</span>
              <span aria-hidden="true">{open ? "✕" : "≡"}</span>
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-nav" className="mobile-nav" aria-label="Navigasi seluler">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={isCurrent(item.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
