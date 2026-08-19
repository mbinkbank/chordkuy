export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Dynamic real-time Sitemap generated directly from Supabase DB
    if (url.pathname === "/sitemap.xml") {
      try {
        const supabaseUrl = "https://tbpdopmbvuhxjktuwsej.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";

        const res = await fetch(`${supabaseUrl}/rest/v1/chords?select=id,title,artist`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        const slugify = (text) =>
          String(text || "")
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        let songs = [];
        if (res.ok) {
          songs = await res.json();
        }

        const domain = "https://chordkuy.id";
        const today = new Date().toISOString().split("T")[0];

        // Static Main Pages
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${domain}/artists</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${domain}/search</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
  <url><loc>${domain}/about</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${domain}/contact</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${domain}/privacy</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>
  <url><loc>${domain}/terms</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>`;

        // Artist Pages
        const seenArtists = new Set();
        for (const s of songs) {
          const aSlug = slugify(s.artist);
          if (aSlug && !seenArtists.has(aSlug)) {
            seenArtists.add(aSlug);
            xml += `\n  <url><loc>${domain}/artist/${aSlug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
          }
        }

        // Song Chord Pages
        for (const s of songs) {
          const songSlug = `${slugify(s.artist)}-${slugify(s.title)}`;
          xml += `\n  <url><loc>${domain}/chord/${songSlug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
        }

        xml += "\n</urlset>";

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      } catch (err) {
        // Fallback to static asset fetch on error
      }
    }

    return env.ASSETS.fetch(request);
  }
};
