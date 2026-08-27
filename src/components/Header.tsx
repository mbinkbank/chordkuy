import { useEffect, useState } from "react";
import { Link, useRoute } from "../lib/router";
import { NAV_ITEMS, SITE } from "../lib/site";
import { getBookmarks, onBookmarksChange } from "../lib/bookmarks";
import ThemeToggle from "./ThemeToggle";
import { Bookmark, Search } from "lucide-react";

export default function Header() {
  const route = useRoute();
  const [bmCount, setBmCount] = useState(0);

  useEffect(() => {
    setBmCount(getBookmarks().length);
    return onBookmarksChange(() => setBmCount(getBookmarks().length));
  }, []);

  const isCurrent = (href: string) =>
    href === "/" ? route.pathname === "/" : route.pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label={`${SITE.name} — beranda`}>
            <img src="/chordkuy-logo.svg" alt="Chordkuy" className="brand-logo logo-light" width={768} height={225} />
            <img src="/chordkuy-logodark.svg" alt="Chordkuy" className="brand-logo logo-dark" width={768} height={225} />
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
            <Link href="/search" className="btn btn-sm btn-icon header-search" aria-label="Cari chord lagu">
              <Search size={20} strokeWidth={2.2} />
            </Link>
            <ThemeToggle />
            <Link href="/bookmark" className="btn btn-sm btn-icon bookmark-btn" aria-label={`Bookmark saya (${bmCount})`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Bookmark size={20} strokeWidth={2} />
              {bmCount > 0 && <span className="bookmark-badge">{bmCount > 99 ? "99+" : bmCount}</span>}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
