import { useEffect } from "react";
import { Link } from "../lib/router";
import { SITE } from "../lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  useEffect(() => {
    const w = window as any;
    w._Hasync = w._Hasync || [];
    w._Hasync.push(["Histats.start", "1,5046881,4,0,0,0,00010000"]);
    w._Hasync.push(["Histats.fasi", "1"]);
    w._Hasync.push(["Histats.track_hits", ""]);
    const hs = document.createElement("script");
    hs.type = "text/javascript";
    hs.async = true;
    hs.src = "//s10.histats.com/js15_as.js";
    document.head.appendChild(hs);
  }, []);

  return (
    <footer className="site-footer">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--s3) 0 var(--s2)" }}>
          <div id="histats_counter"></div>
        </div>
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
