const GITHUB_REPO = "mbinkbank/chordkuy";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/rebuild-sitemap" && request.method === "POST") {
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

    return env.ASSETS.fetch(request);
  },
};
