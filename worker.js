const GITHUB_REPO = "mbinkbank/chordkuy";
const INDEXNOW_KEY = "99bf1f23e53d498bb0727956b84f634e";

function slugifyJs(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/rebuild-sitemap" && request.method === "POST") {
      let record = null;
      try {
        const body = await request.json();
        if (body.type !== "DELETE") record = body.record;
      } catch {}

      if (record && record.title && record.artist) {
        const songUrl = `https://chordkuy.id/chord/${slugifyJs(record.artist)}-${slugifyJs(record.title)}`;
        const artistUrl = `https://chordkuy.id/artist/${slugifyJs(record.artist)}`;
        ctx.waitUntil(
          fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              host: "chordkuy.id",
              key: INDEXNOW_KEY,
              keyLocation: `https://chordkuy.id/${INDEXNOW_KEY}.txt`,
              urlList: [songUrl, artistUrl],
            }),
          }).catch(() => {}),
        );
      }

      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "chordkuy-worker",
          },
          body: JSON.stringify({ event_type: "rebuild-sitemap" }),
        });

        return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/scrape-fetch") {
      const sent = (request.headers.get("x-scraper-token") || "").trim();
      const expected = (env.SCRAPER_TOKEN || "").trim();
      if (!expected || sent !== expected) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
      }
      const target = url.searchParams.get("url");
      if (!target || !target.startsWith("https://www.chordtela.com")) {
        return new Response(JSON.stringify({ error: "url param required" }), { status: 400 });
      }
      const upstream = await fetch(target, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
          "Accept-Language": "id-ID,id;q=0.9",
        },
        redirect: "follow",
      });
      const body = await upstream.text();
      return new Response(JSON.stringify({ status: upstream.status, body }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/indexnow-all" && request.method === "POST") {
      const sent = (request.headers.get("x-scraper-token") || "").trim();
      const expected = (env.SCRAPER_TOKEN || "").trim();
      if (!expected || sent !== expected) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
      }
      const SUPABASE_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co";
      const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";
      let urls = [];
      try {
        for (let from = 0; ; from += 1000) {
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/chords?select=title,artist&order=id.asc&limit=1000&offset=${from}`,
            { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
          );
          if (!res.ok) break;
          const rows = await res.json();
          if (!rows.length) break;
          for (const r of rows) {
            const a = slugifyJs(r.artist);
            const s = slugifyJs(r.title);
            if (a && s) {
              urls.push(`https://chordkuy.id/chord/${a}-${s}`);
              urls.push(`https://chordkuy.id/artist/${a}`);
            }
          }
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }

      const unique = [...new Set(urls)];
      const results = [];
      for (let i = 0; i < unique.length; i += 100) {
        const batch = unique.slice(i, i + 100);
        const res = await fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host: "chordkuy.id",
            key: INDEXNOW_KEY,
            keyLocation: `https://chordkuy.id/${INDEXNOW_KEY}.txt`,
            urlList: batch,
          }),
        });
        results.push(res.status);
        await new Promise((r) => setTimeout(r, 1500));
      }
      return new Response(JSON.stringify({ total: unique.length, batches: results }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
