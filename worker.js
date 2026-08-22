const DOMAIN = "https://chordkuy.id";
const SUPABASE_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const STATIC_PAGES = `
  <url><loc>${DOMAIN}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${DOMAIN}/artists</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${DOMAIN}/search</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
  <url><loc>${DOMAIN}/about</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${DOMAIN}/contact</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${DOMAIN}/privacy</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>
  <url><loc>${DOMAIN}/terms</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>`;

function buildSitemap(songs) {
  const today = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  xml += STATIC_PAGES;

  const seenArtists = new Set();
  for (const s of songs) {
    const aSlug = slugify(s.artist);
    if (aSlug && !seenArtists.has(aSlug)) {
      seenArtists.add(aSlug);
      xml += `\n  <url><loc>${DOMAIN}/artist/${aSlug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }
  }

  for (const s of songs) {
    const songSlug = `${slugify(s.artist)}-${slugify(s.title)}`;
    xml += `\n  <url><loc>${DOMAIN}/chord/${songSlug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
  }

  xml += "\n</urlset>";
  return xml;
}

function xmlResponse(body) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/sitemap.xml") {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/chords?select=id,title,artist`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        });

        if (!res.ok) throw new Error(`Supabase ${res.status}`);

        const songs = await res.json();
        return xmlResponse(buildSitemap(songs));
      } catch {
        return xmlResponse(buildSitemap([]));
      }
    }

    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status === 404) {
      return env.ASSETS.fetch(new Request(new URL("/", url), request));
    }
    return assetRes;
  },
};
