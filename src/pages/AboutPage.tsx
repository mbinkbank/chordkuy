import Breadcrumb from "../components/Breadcrumb";
import { getStats } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Link } from "../lib/router";
import { breadcrumbSchema, organizationSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function AboutPage() {
  const { t } = useI18n();
  const stats = getStats();
  const description = `${SITE.name} adalah platform chord gitar yang mengutamakan kecepatan, keterbacaan, dan pengalaman membaca chord tanpa gangguan.`;

  useSeo({
    title: `${t("aboutTitle")} | ${SITE.name}`,
    description,
    path: "/about",
    jsonLd: [
      webPageSchema(t("aboutTitle"), description, "/about"),
      organizationSchema(),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: t("navAbout"), href: "/about" },
      ]),
    ],
  });

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: t("navAbout"), href: "/about" },
        ]}
      />

      <article className="prose">
        <p className="eyebrow">{t("navAbout")}</p>
        <h1 className="h-page" style={{ marginBottom: "var(--s3)" }}>
          {t("aboutHeading")}
        </h1>
        <p>{t("aboutBody")}</p>

        <h2>{t("aboutPrinciples")}</h2>
        <ul>
          <li><strong>{t("aboutFast")}</strong> {t("aboutFastDesc")}</li>
          <li><strong>{t("aboutReadable")}</strong> {t("aboutReadableDesc")}</li>
          <li><strong>{t("aboutAccessible")}</strong> {t("aboutAccessibleDesc")}</li>
          <li><strong>{t("aboutRespect")}</strong> {t("aboutRespectDesc")}</li>
        </ul>

        <h2>{t("aboutCatalogTitle")}</h2>
        <p>{t("aboutCatalogBody")}</p>

        <h2>{t("aboutTechTitle")}</h2>
        <p>{t("aboutTechBody")}</p>

        <h2>{t("aboutContributeTitle")}</h2>
        <p>
          {t("aboutContributeBody")}{" "}
          <Link href="/contact">halaman kontak</Link>. Setiap koreksi ditinjau manual sebelum diterbitkan.
        </p>
      </article>
    </main>
  );
}
