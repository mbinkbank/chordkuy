import { useState } from "react";
import { Link, useRoute } from "../lib/router";
import { NAV_ITEMS, SITE } from "../lib/site";
import ThemeToggle from "./ThemeToggle";
import { Bookmark, Search, Menu, X } from "lucide-react";

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
            <img src="/chordkuy-logo.svg" alt="Chordkuy" className="brand-logo logo-light" />
            <img src="/chordkuy-logodark.svg" alt="Chordkuy" className="brand-logo logo-dark" />
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
            <button
              type="button"
              className="btn btn-sm btn-icon nav-toggle"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Buka menu navigasi</span>
              {open ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>
            <Link href="/search" className="btn btn-sm btn-icon" aria-label="Cari chord lagu" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={20} strokeWidth={2.2} />
            </Link>
            <ThemeToggle />
            <Link href="/bookmark" className="btn btn-sm btn-icon" aria-label="Bookmark saya" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Bookmark size={20} strokeWidth={2} />
            </Link>
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
