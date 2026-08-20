import { Link } from "../lib/router";
import { SITE } from "../lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-bottom" style={{ borderTop: "none", padding: "var(--s4) 0" }}>
          <span>
            © {year} {SITE.name}. Chord untuk keperluan belajar dan latihan.
          </span>
          <span className="row" style={{ gap: "var(--s3)" }}>
            <Link href="/privacy">Kebijakan Privasi</Link>
            <Link href="/terms">Syarat &amp; Ketentuan</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
