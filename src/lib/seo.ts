/**
 * Head + structured data manager.
 *
 * In the Astro build these values are rendered server-side inside `<head>`
 * (see MIGRATION-ASTRO.md); here the same object drives the document head so
 * the metadata contract is identical on both stacks.
 */

import { useEffect } from "react";
import { SITE, absoluteUrl } from "./site";

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

let lastHitPath = "";

// ponytail: hit SPA = re-inject js15_as.js per path; histats tidak punya API virtual pageview
export function histatsHit(): void {
  const path = location.pathname + location.search;
  if (path === lastHitPath) return;
  lastHitPath = path;
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
}

export function applySeo({
  title,
  description,
  path,
  type = "website",
  image,
  noindex = false,
  jsonLd = [],
}: SeoInput): void {
  const canonical = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl("/og-default.png");

  document.title = title;
  document.documentElement.lang = SITE.lang;
  histatsHit();

  upsertMeta('meta[name="description"]', { name: "description", content: description });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
  });
  upsertLink("canonical", canonical);

  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE.name });
  upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "id_ID" });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });

  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:site"]', { name: "twitter:site", content: SITE.twitter });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

  document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((n) => n.remove());
  for (const block of jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seo = "jsonld";
    script.textContent = JSON.stringify(block);
    document.head.appendChild(script);
  }
}

export function useSeo(input: SeoInput): void {
  const key = JSON.stringify(input);
  useEffect(() => {
    applySeo(JSON.parse(key) as SeoInput);
  }, [key]);
}

/* ------------------------------- JSON-LD -------------------------------- */

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  inLanguage: SITE.lang,
  description: SITE.description,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  email: SITE.email,
  description: SITE.description,
});

export const breadcrumbSchema = (items: { name: string; href: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.href),
  })),
});

export const webPageSchema = (name: string, description: string, path: string) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name,
  description,
  url: absoluteUrl(path),
  inLanguage: SITE.lang,
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
});

export const itemListSchema = (name: string, urls: string[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  numberOfItems: urls.length,
  itemListElement: urls.map((url, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(url),
  })),
});
