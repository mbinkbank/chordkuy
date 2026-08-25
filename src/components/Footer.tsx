import { Link } from "../lib/router";
import { SITE } from "../lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div id="histats_counter"></div>
        </div>
        <div className="footer-bottom" style={{ borderTop: "none", padding: "var(--s2) 0" }}>
          <span>
            © {year} <Link href="/">Chordkuy.id</Link> Chord Gitar Mudah &amp; Lirik Lagu.
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
