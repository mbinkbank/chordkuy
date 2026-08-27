import { Link } from "../lib/router";
import { useI18n } from "../lib/i18n";

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div id="histats_counter"></div>
        </div>
        <div className="footer-bottom" style={{ borderTop: "none", padding: "var(--s2) 0" }}>
          <span>
            © {year} <Link href="/">Chordkuy.id</Link> {t("footerCopy")}
          </span>
          <span className="row" style={{ gap: "var(--s3)" }}>
            <Link href="/privacy">{t("footerPrivacy")}</Link>
            <Link href="/terms">{t("footerTerms")}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
