const GITHUB_REPO = "mbinkbank/chordkuy";
const INDEXNOW_KEY = "99bf1f23e53d498bb0727956b84f634e";
const SITE_URL = "https://chordkuy.id";
const SITE_NAME = "Chordkuy";
const SUPABASE_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60";

function slugifyJs(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------- Crawler detection ----------
const CRAWLER_UA = [
  "Googlebot", "Bingbot", "YandexBot", "YandexImages", "DuckDuckBot",
  "Baiduspider", "Sogou", "facebookexternalhit", "Facebot",
  "Twitterbot", "TelegramBot", "WhatsApp", "Slackbot", "Discordbot",
  "LinkedInBot", "Applebot", "Pinterestbot", "embedly", "vkShare",
];

function isCrawler(request) {
  const ua = request.headers.get("User-Agent") || "";
  return CRAWLER_UA.some((k) => ua.includes(k));
}

// ---------- Song map cache (in-isolate) ----------
let _songMap = null;
let _songMapTime = 0;
const SONG_MAP_TTL = 10 * 60 * 1000; // 10 menit

async function getSongMap() {
  if (_songMap && Date.now() - _songMapTime < SONG_MAP_TTL) return _songMap;
  const songs = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,key_name,capo,difficulty,rating,language&order=id.asc&limit=1000&offset=${from}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    if (!res.ok) break;
    const rows = await res.json();
    if (!rows.length) break;
    songs.push(...rows);
  }
  const map = {};
  for (const s of songs) {
    map[`${slugifyJs(s.artist)}-${slugifyJs(s.title)}`] = s;
  }
  _songMap = map;
  _songMapTime = Date.now();
  return map;
}

async function getSongById(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,content,key_name,capo,tuning,difficulty,rating,language&id=eq.${id}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  const rows = await res.json();
  return rows[0] || null;
}

// ---------- HTML rendering untuk crawler ----------
function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderContentHtml(content) {
  const CHORD_RE = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d+)?(?:\/[A-G][#b]?)?)\b/g;
  const lines = String(content || "").split("\n");
  return lines
    .map((line) => {
      const escaped = escapeHtml(line);
      const withChords = escaped.replace(CHORD_RE, "<strong>$1</strong>");
      return `<div class="cl">${withChords || "&nbsp;"}</div>`;
    })
    .join("\n");
}

function baseHead(title, description, canonicalPath, ogImage) {
  const url = `${SITE_URL}${canonicalPath}`;
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage || SITE_URL + "/og-default.png"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">`;
}

function renderChordHtml(song) {
  const title = `Chord Gitar ${song.title} - ${song.artist} | ${SITE_NAME}`;
  const desc = `Chord gitar ${song.title} — ${song.artist}. Kunci dasar ${song.key_name}${song.capo ? `, capo fret ${song.capo}` : ""}. Lengkap dengan lirik dan diagram chord.`;
  const canonical = `/chord/${slugifyJs(song.artist)}-${slugifyJs(song.title)}`;
  const rating = song.rating ? Number(song.rating).toFixed(1) : null;
  const langText = `${song.title} ${(song.content || "").slice(0, 3000)}`;
  const scriptLang = /[\uAC00-\uD7AF\u1100-\u11FF]/.test(langText) ? "ko" : /[\u3040-\u30FF]/.test(langText) ? "ja" : /[\u4E00-\u9FFF]/.test(langText) ? "zh" : /[\u0400-\u04FF]/.test(langText) ? "ru" : null;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: song.title,
    byArtist: { "@type": "MusicGroup", name: song.artist },
    url: `${SITE_URL}${canonical}`,
    inLanguage: scriptLang || (song.language === "EN" ? "en" : "id"),
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
${baseHead(title, desc, canonical)}
<script type="application/ld+json">${jsonLd}</script>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;line-height:1.6;color:#f1f1f3;background:#101014}
h1{font-size:22px;margin:12px 0}
.badge{display:inline-block;border:1px solid #444;border-radius:999px;padding:2px 12px;font-size:13px;margin-right:4px}
.cl{white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:14px}
strong{color:#4ade80;font-weight:700}
a{color:#4ade80}
.meta{color:#9b9ba6;font-size:13px;margin:8px 0}
</style>
</head>
<body>
<h1>Chord Gitar ${escapeHtml(song.title)} — ${escapeHtml(song.artist)}</h1>
<p><span class="badge">Key ${escapeHtml(song.key_name)}</span>${song.capo ? `<span class="badge">Capo fret ${escapeHtml(song.capo)}</span>` : ""}<span class="badge">${escapeHtml(song.difficulty)}</span>${rating ? `<span class="badge">★ ${rating}</span>` : ""}</p>
<div style="margin:16px 0">
${renderContentHtml(song.content)}
</div>
<p><a href="${SITE_URL}/chord/${canonical}">Lihat versi interaktif dengan transpose & auto scroll →</a></p>
</body>
</html>`;
}

async function renderArtistHtml(artistSlug, env) {
  const map = await getSongMap();
  // cari nama artis dari slug
  let artistName = null;
  for (const [slug, s] of Object.entries(map)) {
    if (slug.startsWith(artistSlug + "-") || slugifyJs(s.artist) === artistSlug) {
      artistName = s.artist;
      break;
    }
  }
  if (!artistName) return null;

  const songs = Object.entries(map)
    .filter(([slug]) => slug.startsWith(artistSlug + "-"))
    .map(([slug, s]) => ({ ...s, slug }));

  const title = `${artistName} — Chord Gitar | ${SITE_NAME}`;
  const desc = `Kumpulan chord gitar ${artistName} — ${songs.length} lagu lengkap dengan lirik, transpose, dan auto scroll.`;
  const canonical = `/artist/${artistSlug}`;

  const listHtml = songs
    .map((s) => `<li><a href="${SITE_URL}/chord/${slugifyJs(s.artist)}-${slugifyJs(s.title)}">${escapeHtml(s.title)}</a> <span style="color:#888">(${escapeHtml(s.key_name)})</span></li>`)
    .join("\n");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artistName,
    url: `${SITE_URL}${canonical}`,
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
${baseHead(title, desc, canonical)}
<script type="application/ld+json">${jsonLd}</script>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;line-height:1.6;color:#f1f1f3;background:#101014}h1{font-size:20px;margin:12px 0}li{margin:6px 0}a{color:#4ade80}</style>
</head>
<body>
<h1>${escapeHtml(artistName)}</h1>
<p>${songs.length} chord tersedia</p>
<ul>
${listHtml}
</ul>
<p><a href="${SITE_URL}/artists">Semua artis →</a></p>
</body>
</html>`;
}

// ---------- Pageview tracking ----------
function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function shouldTrack(request, url) {
  if (request.method !== "GET") return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/assets/")) return false;
  if (/\.(js|css|png|jpg|svg|ico|json|xml|txt|woff2?)$/.test(url.pathname)) return false;
  // hanya halaman HTML
  return (
    url.pathname === "/" ||
    url.pathname.startsWith("/chord/") ||
    url.pathname.startsWith("/artist/") ||
    url.pathname === "/artists" ||
    url.pathname.startsWith("/search")
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ---------- Pageview tracking (human only) ----------
    let visitorId = getCookie(request, "ck_id");
    let setCookie = null;
    const trackThis = shouldTrack(request, url) && !isCrawler(request);
    if (trackThis && !visitorId) {
      visitorId = crypto.randomUUID();
      setCookie = `ck_id=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
    if (trackThis) {
      const referrer = request.headers.get("Referer") || "";
      const country = (request.cf && request.cf.country) || "";
      const pathToLog = url.pathname;
      const vidToLog = visitorId;
      ctx.waitUntil(
        (async () => {
          let pageTitle = "";
          try {
            if (pathToLog.startsWith("/chord/")) {
              const slug = decodeURIComponent(pathToLog.replace("/chord/", "").replace(/\/$/, ""));
              const map = await getSongMap();
              const s = map[slug];
              if (s) pageTitle = `${s.title} - ${s.artist}`;
            } else if (pathToLog.startsWith("/artist/")) {
              const slug = decodeURIComponent(pathToLog.replace("/artist/", "").replace(/\/$/, ""));
              const map = await getSongMap();
              for (const s of Object.values(map)) {
                if (slugifyJs(s.artist) === slug) { pageTitle = s.artist; break; }
              }
            }
          } catch {}
          const svcKey = env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/pageviews`, {
              method: "POST",
              headers: {
                apikey: svcKey,
                Authorization: `Bearer ${svcKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                path: pathToLog,
                title: pageTitle.slice(0, 200),
                referrer: referrer.slice(0, 500),
                country: String(country).slice(0, 2),
                visitor_id: vidToLog,
              }),
            });
          } catch {}
        })(),
      );
    }

    // ---------- Dynamic rendering untuk crawler ----------
    if (isCrawler(request)) {
      let html = null;

      if (url.pathname.startsWith("/chord/")) {
        const slug = decodeURIComponent(url.pathname.replace("/chord/", "").replace(/\/$/, ""));
        try {
          const map = await getSongMap();
          const song = map[slug];
          if (song) {
            const full = await getSongById(song.id);
            if (full) html = renderChordHtml(full);
          }
        } catch {}
      } else if (url.pathname.startsWith("/artist/")) {
        const slug = decodeURIComponent(url.pathname.replace("/artist/", "").replace(/\/$/, ""));
        try {
          html = await renderArtistHtml(slug);
        } catch {}
      }

      if (html) {
        const res = new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
        if (setCookie) res.headers.set("Set-Cookie", setCookie);
        return res;
      }
      // fallback ke SPA kalau bukan halaman yang bisa di-render
    }

    // ---------- API endpoints ----------
    if (url.pathname === "/api/rebuild-sitemap" && request.method === "POST") {
      let record = null;
      try {
        const body = await request.json();
        if (body.type !== "DELETE") record = body.record;
      } catch {}

      if (record && record.title && record.artist) {
        const songUrl = `${SITE_URL}/chord/${slugifyJs(record.artist)}-${slugifyJs(record.title)}`;
        const artistUrl = `${SITE_URL}/artist/${slugifyJs(record.artist)}`;
        ctx.waitUntil(
          fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              host: "chordkuy.id",
              key: INDEXNOW_KEY,
              keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
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
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
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
      let urls = [];
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
          const t = slugifyJs(r.title);
          if (a && t) urls.push(`${SITE_URL}/chord/${a}-${t}`);
        }
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
            keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
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

    return env.ASSETS.fetch(request).then((res) => {
      if (setCookie) {
        const newRes = new Response(res.body, res);
        newRes.headers.set("Set-Cookie", setCookie);
        return newRes;
      }
      return res;
    });
  },
};
