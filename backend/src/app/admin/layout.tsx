"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/songs", label: "Chord" },
  { href: "/admin/import-export", label: "Import / Export" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
        <strong>Chordkuy Admin</strong>
        <button className="secondary" onClick={logout}>Keluar</button>
      </div>
      <div className="container">
        <nav className="row" style={{ margin: "14px 0" }}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`nav-link${pathname.startsWith(n.href) ? " active" : ""}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </>
  );
}
