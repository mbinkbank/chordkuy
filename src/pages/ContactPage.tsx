import { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import { useI18n } from "../lib/i18n";
import { breadcrumbSchema, useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

type Status = "idle" | "sent" | "error" | "failed";

const WHATSAPP_NUMBER = "6285156280708";

export default function ContactPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const [topic, setTopic] = useState("");
  const [method, setMethod] = useState("");
  const description = `Hubungi tim ${SITE.name} untuk koreksi chord, permintaan lagu, atau laporan masalah aksesibilitas.`;

  useSeo({
    title: `${t("contactTitle")} | ${SITE.name}`,
    description,
    path: "/contact",
    jsonLd: [
      webPageSchema(t("contactTitle"), description, "/contact"),
      breadcrumbSchema([
        { name: "Beranda", href: "/" },
        { name: t("navContact"), href: "/contact" },
      ]),
    ],
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!topic || !name || !method || (method === "email" && !email) || !message) {
      setStatus("error");
      return;
    }

    const fullMessage = `[${topic}]\n\n${message}\n\n— ${name}`;

    if (method === "whatsapp") {
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMessage)}`,
        "_blank",
        "noopener,noreferrer",
      );
      setStatus("sent");
      return;
    }

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: `[${topic}] Pesan untuk ${SITE.name}`,
          _replyto: email,
          name,
          message: fullMessage,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <main id="main" className="container">
      <Breadcrumb
        items={[
          { name: "Beranda", href: "/" },
          { name: t("navContact"), href: "/contact" },
        ]}
      />

      <div className="chord-layout">
        <div>
          <p className="eyebrow">{t("navContact")}</p>
          <h1 className="h-page" style={{ marginBottom: "var(--s3)" }}>
            {t("contactSend")}
          </h1>
          <p className="small muted" style={{ maxWidth: "58ch", marginBottom: "var(--s4)" }}>
            {t("contactDesc")}
          </p>

          <form className="panel stack stack-4" onSubmit={submit} noValidate>
            <div className="field">
              <label className="label" htmlFor="topic">{t("contactTopic")}</label>
              <select
                id="topic"
                name="topic"
                className="select"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                required
              >
                <option value="" disabled>— {t("contactSelect")} —</option>
                <option value={t("contactTopicFix")}>{t("contactTopicFix")}</option>
                <option value={t("contactTopicRequest")}>{t("contactTopicRequest")}</option>
                <option value={t("contactTopicBug")}>{t("contactTopicBug")}</option>
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="name">{t("contactName")}</label>
              <input id="name" name="name" className="input" type="text" autoComplete="name" required />
            </div>

            <div className="field">
              <label className="label" htmlFor="method">{t("contactMethod")}</label>
              <select
                id="method"
                name="method"
                className="select"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                required
              >
                <option value="" disabled>— {t("contactSelect")} —</option>
                <option value="email">{t("contactMethodEmail")}</option>
                <option value="whatsapp">{t("contactMethodWhatsapp")}</option>
              </select>
            </div>

            {method === "email" && (
              <div className="field">
                <label className="label" htmlFor="email">{t("contactEmail")}</label>
                <input id="email" name="email" className="input" type="email" autoComplete="email" required />
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="message">{t("contactMessage")}</label>
              <textarea id="message" name="message" className="textarea" required />
            </div>

            <div className="row">
              <button className="btn btn-accent btn-lg" type="submit">
                {t("contactSubmit")}
              </button>
              <span className="caption" role="status" aria-live="polite">
                {status === "sent" && t("contactSent")}
                {status === "error" && t("contactError")}
                {status === "failed" && t("contactFailed")}
              </span>
            </div>
          </form>
        </div>

        <aside className="sidebar" aria-label="Informasi kontak">
          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              {t("contactDirectEmail")}
            </h2>
            <p className="small" style={{ margin: 0 }}>
              <a href={`mailto:${SITE.email}`} style={{ color: "var(--accent)" }}>
                {SITE.email}
              </a>
            </p>
          </div>
          <div className="card">
            <h2 className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              {t("contactBeforeSending")}
            </h2>
            <ul className="stack stack-1 small" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>› {t("contactTip1")}</li>
              <li>› {t("contactTip2")}</li>
              <li>› {t("contactTip3")}</li>
            </ul>
          </div>
          <div className="card card-accent">
            <p className="caption" style={{ margin: 0 }}>
              {t("contactDisclaimer")}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
