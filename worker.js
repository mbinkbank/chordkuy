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
      `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,slug,artist_slug,key_name,capo,difficulty,rating,language&order=id.asc&limit=1000&offset=${from}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    if (!res.ok) break;
    const rows = await res.json();
    if (!rows.length) break;
    songs.push(...rows);
  }
  const map = {};
  for (const s of songs) {
    map[s.slug || `${slugifyJs(s.artist)}-${slugifyJs(s.title)}`] = s;
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

async function getSongBySlug(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,content,key_name,capo,tuning,difficulty,rating,language,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) return null;
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
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="icon" href="/favicon.png" type="image/png" sizes="120x120">
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
  const clean = langText.replace(/[\u0430\u0435\u043E\u0440\u0441\u0443\u0445\u0456\u0455\u0458\u0410\u0415\u041E\u0420\u0421\u0423\u0425]/g, "");
  const SCRIPT_TESTS = [
    ["ko", /[\uAC00-\uD7AF\u1100-\u11FF]/g],
    ["ja", /[\u3040-\u30FF]/g],
    ["zh", /[\u4E00-\u9FFF]/g],
    ["ru", /[\u0400-\u04FF]/g],
    ["th", /[\u0E00-\u0E7F]/g],
    ["lo", /[\u0E80-\u0EFF]/g],
    ["km", /[\u1780-\u17FF]/g],
    ["my", /[\u1000-\u109F]/g],
    ["hi", /[\u0900-\u097F]/g],
    ["bn", /[\u0980-\u09FF]/g],
    ["si", /[\u0D80-\u0DFF]/g],
    ["dv", /[\u0780-\u07BF]/g],
    ["he", /[\u0590-\u05FF]/g],
    ["hy", /[\u0530-\u058F]/g],
    ["ka", /[\u10A0-\u10FF]/g],
    ["el", /[\u0370-\u03FF]/g],
    ["mn", /[\u1800-\u18AF]/g],
    ["ar", /[\u0600-\u06FF]/g],
  ];
  let inLang = null;
  for (const [code, rx] of SCRIPT_TESTS) {
    if ((clean.match(rx) || []).length >= 3) { inLang = code; break; }
  }
  if (!inLang) {
    const lyricText = langText.replace(/\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d+)*(?:\/[A-G][#b]?)?\b/g, " ");
    const idCount = (lyricText.match(/\b(yang|dan|di|ke|dari|aku|saya|kamu|kita|mereka|untuk|tidak|bukan|adalah|dengan|pada|sudah|belum|juga|hanya|akan|bisa|boleh|ini|itu|apa|siapa|kenapa|bagaimana|lagi|saja|kah|pun|lah|nantinya|ingin|harus|pernah|masih|semua|setiap|seorang|hati|kasih|sayang|cinta|rindu|hidup|dunia|waktu|masa)\b/gi) || []).length;
    const WORD_TESTS = [
      ["en", /\b(the|you|and|is|are|was|were|i'm|im|i've|don't|dont|can't|cant|it's|its|that|this|with|for|my|me|just|when|what|how|why|not|but|all|of|to|in|on|we|they|she|he|will|would|could|should|there|here|your|from|at|be|been|am|so|if|then|than|about|like|one|never|always|know|get|got|go|going)\b/gi],
      ["vi", /\b(của|và|là|không|anh|em|tôi|bạn|những|được|đã|sẽ|vậy|này|kia|gì|đi|về|yêu|đời|tình|trong|một|cuộc)\b/g],
      ["fil", /\b(ang|ng|sa|ako|ikaw|hindi|ko|mo|kami|tayo|siya|namin|atin|mahal|puso|sana|lang|na|pa)\b/gi],
      ["tr", /\b(bir|ve|bu|için|ben|sen|biz|siz|ama|çok|daha|gibi|kadar|değil|var|yok|seni|beni|sevdim|kalbim|hayat|aşk|gönül)\b/gi],
    ];
    let best = null, bestN = 0;
    for (const [code, rx] of WORD_TESTS) {
      const n = (lyricText.match(rx) || []).length;
      if (n > bestN) { best = code; bestN = n; }
    }
    if (best && bestN >= 3 && bestN > idCount * 2) inLang = best;
  }

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: song.title,
    byArtist: { "@type": "MusicGroup", name: song.artist },
    url: `${SITE_URL}${canonical}`,
    inLanguage: inLang || (song.language === "EN" ? "en" : "id"),
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ---------- Dynamic rendering untuk crawler ----------
    if (isCrawler(request)) {
      let html = null;

      if (url.pathname.startsWith("/chord/")) {
        const slug = decodeURIComponent(url.pathname.replace("/chord/", "").replace(/\/$/, ""));
        try {
          // Pertama coba cari langsung via slug DB (100% akurat untuk lagu baru/terbalik)
          let song = await getSongBySlug(slug);
          if (!song) {
            const map = await getSongMap();
            const mapped = map[slug];
            if (mapped) song = await getSongById(mapped.id);
          }
          if (song) html = renderChordHtml(song);
        } catch {}
      } else if (url.pathname.startsWith("/artist/")) {
        const slug = decodeURIComponent(url.pathname.replace("/artist/", "").replace(/\/$/, ""));
        try {
          html = await renderArtistHtml(slug);
        } catch {}
      }

      if (html) {
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
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

    return env.ASSETS.fetch(request);
  },
};
