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
    `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,content,key_name,capo,tuning,difficulty,rating,language,slug,artist_slug,seo_note&id=eq.${id}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  const rows = await res.json();
  return rows[0] || null;
}

async function getSongBySlug(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chords?select=id,title,artist,content,key_name,capo,tuning,difficulty,rating,language,slug,artist_slug,seo_note&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

async function getArtistSongs(artistSlug, excludeSlug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chords?select=slug,title,key_name&artist_slug=eq.${encodeURIComponent(artistSlug)}&order=id.asc&limit=15`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.filter((r) => r.slug && r.slug !== excludeSlug).slice(0, 10);
}

// ---------- HTML rendering untuk crawler ----------
function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Bentuk kunci terbuka (low E -> high E); sisanya derivasi barre E-shape/A-shape
const OPEN_SHAPES = {
  C: [null, 3, 2, 0, 1, 0], Cmaj7: [null, 3, 2, 0, 0, 0], C7: [null, 3, 2, 3, 1, 0],
  Cadd9: [null, 3, 2, 0, 3, 0], Csus4: [null, 3, 3, 0, 1, 1], "C/G": [3, 3, 2, 0, 1, 0],
  D: [null, null, 0, 2, 3, 2], Dm: [null, null, 0, 2, 3, 1], D7: [null, null, 0, 2, 1, 2],
  Dmaj7: [null, null, 0, 2, 2, 2], Dm7: [null, null, 0, 2, 1, 1], Dsus4: [null, null, 0, 2, 3, 3],
  Dsus2: [null, null, 0, 2, 3, 0], "D/F#": [2, 0, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0], Em: [0, 2, 2, 0, 0, 0], E7: [0, 2, 0, 1, 0, 0],
  Em7: [0, 2, 2, 0, 3, 0], Emaj7: [0, 2, 1, 1, 0, 0], Esus4: [0, 2, 2, 2, 0, 0],
  F: [1, 3, 3, 2, 1, 1], Fmaj7: [null, null, 3, 2, 1, 0], Fm: [1, 3, 3, 1, 1, 1],
  "F#m": [2, 4, 4, 2, 2, 2],
  G: [3, 2, 0, 0, 0, 3], G7: [3, 2, 0, 0, 0, 1], Gmaj7: [3, 2, 0, 0, 0, 2],
  Gsus4: [3, 3, 0, 0, 1, 3], "G/B": [null, 2, 0, 0, 0, 3],
  A: [null, 0, 2, 2, 2, 0], Am: [null, 0, 2, 2, 1, 0], A7: [null, 0, 2, 0, 2, 0],
  Am7: [null, 0, 2, 0, 1, 0], Amaj7: [null, 0, 2, 1, 2, 0], Asus4: [null, 0, 2, 2, 3, 0],
  Asus2: [null, 0, 2, 2, 0, 0],
  B7: [null, 2, 1, 2, 0, 2], Bm: [null, 2, 4, 4, 3, 2], Bm7: [null, 2, 0, 2, 0, 2],
  Bb: [null, 1, 3, 3, 3, 1],
};
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseChordName(name) {
  const m = String(name).match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return null;
  return { root: m[1] + m[2], rest: m[3] };
}

function chordToFrets(name) {
  const p = parseChordName(name);
  if (!p) return null;
  if (OPEN_SHAPES[name]) return OPEN_SHAPES[name];
  // derivasi barre: E-shape (root di fret root, bentuk 022100) / A-shape (bentuk x02220)
  const pc = PC[p.root[0]] + (p.root[1] === "#" ? 1 : p.root[1] === "b" ? -1 : 0);
  const root = ((pc % 12) + 12) % 12;
  let q = p.rest;
  if (q === "maj") q = "";
  if (q === "min") q = "m";
  const eVariant = ["", "7", "m", "m7", "maj7", "sus4"].includes(q);
  const aVariant = ["", "7", "m", "m7", "maj7", "sus4", "sus2"].includes(q);
  if (eVariant) { // E-shape: fret barre = pitch class root
    const b = root === 0 ? 12 : root;
    return [b, b + 2, b + 2, b + 1, b, b].map((f) => (f > 16 ? null : f));
  }
  if (aVariant) { // A-shape: fret barre = (root - 9) mod 12
    const b = ((root - 9 + 12) % 12) || 12;
    return [null, b, b + 2, b + 2, b + 2, b].map((f) => (f > 16 ? null : f));
  }
  return null;
}

function chordSvg(name, size = 70) {
  const frets = chordToFrets(name);
  if (!frets) return "";
  const played = frets.filter((f) => f !== null && f > 0);
  const minF = played.length ? Math.min(...played) : 1;
  const baseFret = minF > 4 ? minF : 1;
  const W = 66, H = 82, top = 16, rowH = 14, colW = 12;
  let marks = "";
  let lines = "";
  for (let i = 0; i <= 5; i++) {
    const x = 6 + i * colW;
    lines += `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + 4 * rowH}" stroke="#555" stroke-width="1"/>`;
  }
  for (let r = 0; r <= 4; r++) {
    const y = top + r * rowH;
    lines += `<line x1="6" y1="${y}" x2="${6 + 5 * colW}" y2="${y}" stroke="${r === 0 ? "#999" : "#555"}" stroke-width="${r === 0 ? 2 : 1}"/>`;
  }
  // barre: fret dasar muncul di >=2 senar -> gambar batang horizontal
  const barreIdx = frets.map((f, i) => (f === minF && f > 0 ? i : -1)).filter((i) => i >= 0);
  if (barreIdx.length >= 2) {
    const y = top + (minF - baseFret + 0.5) * rowH;
    const x1 = 6 + Math.min(...barreIdx) * colW;
    const x2 = 6 + Math.max(...barreIdx) * colW;
    marks += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#4ade80" stroke-width="8" stroke-linecap="round"/>`;
  }
  frets.forEach((f, s) => {
    const x = 6 + s * colW;
    if (f === null) marks += `<text x="${x}" y="${top - 5}" fill="#777" font-size="8" text-anchor="middle">x</text>`;
    else if (f === 0) marks += `<circle cx="${x}" cy="${top - 7}" r="3" fill="none" stroke="#4ade80" stroke-width="1.2"/>`;
    else if (f !== minF || barreIdx.length < 2) {
      const y = top + (f - baseFret + 0.5) * rowH;
      marks += `<circle cx="${x}" cy="${y}" r="4.5" fill="#4ade80"/>`;
    }
  });
  if (baseFret > 1) marks += `<text x="${6 + 5 * colW + 2}" y="${top + rowH * 0.9}" fill="#777" font-size="8">${baseFret}</text>`;
  return `<div class="chip"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-label="Diagram kunci ${name}">${lines}${marks}</svg><small>${name}</small></div>`;
}

// Ekstrak kunci dari baris chord (bukan seluruh lirik — regex global pada lirik
// Inggris menangkap kata "A", "E", "D", "G" sebagai kunci palsu)
function extractChords(content) {
  const CHORD_TOKEN = /^([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|m7|maj7|7|9|11|13)*)(?:\/[A-G][#b]?)?$/;
  const out = [];
  const seen = new Set();
  for (const raw of String(content || "").split("\n")) {
    const line = raw.trim();
    if (!line || line.length > 60) continue;
    const tokens = line.split(/\s+/);
    if (tokens.length > 8) continue;
    const h = tokens.filter((t) => CHORD_TOKEN.test(t)).length;
    // baris chord: mayoritas token kunci, hampir tanpa kata lirik
    if (h >= 1 && h >= tokens.length * 0.6) {
      for (const t of tokens) {
        const base = t.split("/")[0];
        if (!CHORD_TOKEN.test(t) || seen.has(base)) continue;
        seen.add(base);
        out.push(base);
      }
    }
    if (out.length >= 16) break;
  }
  return out;
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

function renderChordHtml(song, artistSongs) {
  // canonical WAJIB pakai slug asli DB — reconstruct slugify(artist)-slugify(title)
  // menghasilkan URL 404 untuk ~161 lagu (mis. "mulakma ho amang" -> "mulak-maho-amang")
  const songSlug = song.slug || `${slugifyJs(song.artist)}-${slugifyJs(song.title)}`;
  const artistSlug = song.artist_slug || slugifyJs(song.artist);
  const canonical = `/chord/${songSlug}`;
  // DB kadang menyimpan "fret 5" atau "No capo" di kolom capo — normalisasi di sini
  const capoRaw = String(song.capo || "").trim();
  const hasCapo = capoRaw && !/^(no|none|tanpa)/i.test(capoRaw);
  const capoFret = hasCapo ? capoRaw.replace(/^fret\s*/i, "") : "";
  const capoText = hasCapo ? `dengan capo di fret ${escapeHtml(capoFret)}` : "tanpa capo";
  const capoBadge = hasCapo ? `<span class="badge">Capo fret ${escapeHtml(capoFret)}</span>` : "";
  const title = `Chord Gitar ${song.title} - ${song.artist} | ${SITE_NAME}`;
  const desc = `Chord gitar ${song.title} — ${song.artist}. Kunci dasar ${song.key_name}${hasCapo ? `, capo fret ${capoFret}` : ""}, diagram chord, transpose, dan auto scroll gratis di Chordkuy.`;
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

  // diagram kunci + fakta data dari baris chord (bukan seluruh lirik)
  const used = extractChords(song.content).slice(0, 12);
  const chordCount = used.length;
  const chordChips = used.map((c) => chordSvg(c)).filter(Boolean).join("\n");
  const seoNote = String(song.seo_note || "").trim();
  const diffLabel = song.difficulty === "novice" ? "pemula" : song.difficulty === "advanced" ? "mahir" : "menengah";

  // variasi kalimat deterministik dari song.id — 38K halaman tidak satu pola
  const seed = Number(song.id) || 0;
  const introPool = [
    `Chord ${escapeHtml(song.title)} dari ${escapeHtml(song.artist)} dimainkan di kunci dasar ${escapeHtml(song.key_name)}, ${capoText}. Tingkat kesulitan ${diffLabel}, cocok untuk latihan ${diffLabel === "pemula" ? "awal" : diffLabel === "mahir" ? "barre chord dan perpindahan cepat" : "pergantian kunci"}.`,
    `Lagu ${escapeHtml(song.title)} — ${escapeHtml(song.artist)} ini memakai kunci ${escapeHtml(song.key_name)} ${capoText}. Dengan ${chordCount} kunci utama, lagu ini tergolong ${diffLabel} dan enak dimainkan sambil menyanyi.`,
    `${escapeHtml(song.artist)} membawakan ${escapeHtml(song.title)} dengan progresi kunci ${escapeHtml(song.key_name)} ${capoText}. Pola ${chordCount} kunci yang dipakai membuatnya ${diffLabel} untuk dimainkan pemula maupun pemain berpengalaman.`,
    `Ingin memainkan ${escapeHtml(song.title)}? Chord lagu ${escapeHtml(song.artist)} ini berada di kunci ${escapeHtml(song.key_name)} ${capoText}. ${chordCount} kunci yang muncul digambar lengkap di bawah, dengan tingkat kesulitan ${diffLabel}.`,
  ];
  const intro = introPool[seed % introPool.length];
  const chordNames = used.join(", ");

  return `<!DOCTYPE html>
<html lang="id">
<head>
${baseHead(title, desc, canonical)}
<script type="application/ld+json">${jsonLd}</script>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;line-height:1.6;color:#f1f1f3;background:#101014}
h1{font-size:22px;margin:12px 0}
h2{font-size:16px;margin:20px 0 8px}
.badge{display:inline-block;border:1px solid #444;border-radius:999px;padding:2px 12px;font-size:13px;margin-right:4px}
.cl{white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:14px}
strong{color:#4ade80;font-weight:700}
a{color:#4ade80}
.meta{color:#9b9ba6;font-size:13px;margin:8px 0}
.chips{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0}
.chip{text-align:center}
.chip svg{display:block}
.chip small{font-size:11px;color:#4ade80;font-weight:600}
</style>
</head>
<body>
<h1>Chord Gitar ${escapeHtml(song.title)} — ${escapeHtml(song.artist)}</h1>
<p><span class="badge">Key ${escapeHtml(song.key_name)}</span>${capoBadge}<span class="badge">${escapeHtml(song.difficulty)}</span>${rating ? `<span class="badge">★ ${rating}</span>` : ""}</p>
<p class="meta">${intro}</p>
${chordNames ? `<p class="meta">Kunci yang dipakai: <strong>${escapeHtml(chordNames)}</strong>.</p>` : ""}
<div class="chips">
${chordChips}
</div>
<h2>Chord & Lirik ${escapeHtml(song.title)}</h2>
<div style="margin:16px 0">
${renderContentHtml(song.content)}
</div>
${seoNote ? `<h2>Tentang lagu ${escapeHtml(song.title)}</h2>
<p>${escapeHtml(seoNote)}</p>` : ""}
<h2>Cara memainkan</h2>
<p class="meta">Pasang ${hasCapo ? "capo di fret " + escapeHtml(capoFret) : "gitar tanpa capo"}, lalu mainkan ${chordCount} kunci di atas mengikuti lirik. Gunakan tombol transpose di versi interaktif untuk menaikkan atau menurunkan nada tanpa mengubah bentuk kunci, dan aktifkan auto scroll agar halaman bergulir mengikuti tempo.</p>
${artistSongs && artistSongs.length ? `<h2>Lagu lain dari ${escapeHtml(song.artist)}</h2>
<ul>
${artistSongs.map((s) => `<li><a href="${SITE_URL}/chord/${escapeHtml(s.slug)}">${escapeHtml(s.title)}</a> (${escapeHtml(s.key_name)})</li>`).join("\n")}
</ul>` : ""}
<p><a href="${SITE_URL}/chord/${songSlug}">Lihat versi interaktif dengan transpose & auto scroll →</a></p>
<p><a href="${SITE_URL}/artist/${artistSlug}">Semua chord ${escapeHtml(song.artist)} →</a></p>
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
  const desc = `Kumpulan ${songs.length} chord gitar ${artistName} lengkap dengan lirik, kunci dasar, diagram chord, transpose, dan auto scroll. Cari lagu ${artistName} favoritmu di sini.`;
  const canonical = `/artist/${artistSlug}`;

  const listHtml = songs
    .map((s) => `<li><a href="${SITE_URL}/chord/${escapeHtml(s.slug || `${slugifyJs(s.artist)}-${slugifyJs(s.title)}`)}">${escapeHtml(s.title)}</a> <span style="color:#888">(${escapeHtml(s.key_name)})</span></li>`)
    .join("\n");

  // ringkasan kunci & variasi kalimat dari hash slug
  const keysTally = {};
  for (const s of songs) {
    if (s.key_name) keysTally[s.key_name] = (keysTally[s.key_name] || 0) + 1;
  }
  const topKeys = Object.entries(keysTally).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
  let hash = 0;
  for (const ch of artistSlug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const artistIntroPool = [
    `Chord gitar ${escapeHtml(artistName)} berjumlah ${songs.length} lagu di Chordkuy, semuanya lengkap dengan lirik dan kunci. Kunci yang paling sering dipakai: ${topKeys.map((k) => escapeHtml(k)).join(", ")}.`,
    `Total ${songs.length} lagu ${escapeHtml(artistName)} tersedia. Setiap lagu punya kunci dasar, diagram chord, dan tombol transpose — mulai dari ${songs.slice(0, 3).map((s) => escapeHtml(s.title)).join(", ")}.`,
    `${songs.length} chord ${escapeHtml(artistName)} siap dimainkan. Mayoritas berada di kunci ${topKeys.map((k) => escapeHtml(k)).join(", ")} — pilih lagunya, lalu sesuaikan nada dengan transpose bila perlu.`,
    `Di halaman ini ada ${songs.length} chord lagu ${escapeHtml(artistName)}. Kunci dominannya ${topKeys.map((k) => escapeHtml(k)).join(", ")}, pas untuk yang baru belajar maupun yang sudah lancar.`,
  ];
  const artistIntro = artistIntroPool[hash % artistIntroPool.length];

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
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;line-height:1.6;color:#f1f1f3;background:#101014}h1{font-size:20px;margin:12px 0}h2{font-size:15px;margin:18px 0 8px}li{margin:6px 0}a{color:#4ade80}</style>
</head>
<body>
<h1>Chord Gitar ${escapeHtml(artistName)}</h1>
<p>${artistIntro}</p>
<h2>Daftar lagu (${songs.length})</h2>
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

    if (url.pathname === "/" && url.searchParams.has("page")) {
      const corrected = new URL(request.url);
      corrected.pathname = "/";
      corrected.search = "";
      return Response.redirect(corrected.toString(), 301);
    }

    if ((url.pathname.startsWith("/chord/") || url.pathname.startsWith("/artist/")) && url.pathname.endsWith("/")) {
      const corrected = new URL(request.url);
      corrected.pathname = url.pathname.replace(/\/$/, "");
      return Response.redirect(corrected.toString(), 301);
    }

    if (url.pathname.startsWith("/chord/chord/")) {
      const corrected = new URL(request.url);
      corrected.pathname = url.pathname.replace(/^\/chord\/chord\//, "/chord/");
      return Response.redirect(corrected.toString(), 301);
    }

    // Sitemap: selalu lewat worker (run_worker_first) — index tanpa query dari asset,
    // ?page=N map ke file chunk (sebelum blok crawler, karena path tak dikenal = 404)
    if (url.pathname === "/sitemap.xml") {
      if (!url.searchParams.has("page")) return env.ASSETS.fetch(request);
      const p = url.searchParams.get("page");
      if (!/^\d+$/.test(p) || Number(p) < 1) {
        return new Response("Not Found", { status: 404 });
      }
      const res = await env.ASSETS.fetch(new Request(`${url.origin}/sitemap-page-${p}.xml`));
      // asset hilang jatuh ke SPA fallback (200 + html) -> paksa 404
      if (res.status === 404 || (res.headers.get("content-type") || "").includes("text/html")) {
        return new Response("Not Found", { status: 404 });
      }
      return res;
    }

    // ---------- Dynamic rendering untuk crawler ----------
    if (isCrawler(request)) {
      // asset ber-extension (favicon, robots.txt, gambar, js/css) -> serahkan ke ASSETS,
      // jangan kena 404 (dengan run_worker_first=true semua request lewat worker dulu)
      const seg = url.pathname.split("/").pop() || "";
      if (seg.includes(".") && !url.pathname.startsWith("/chord/") && !url.pathname.startsWith("/artist/")) {
        return env.ASSETS.fetch(request);
      }
      let html = null;

      if (url.pathname.startsWith("/chord/")) {
        const slug = decodeURIComponent(url.pathname.replace("/chord/", "").replace(/\/$/, ""));
        try {
          let song = await getSongBySlug(slug);
          if (!song) {
            const map = await getSongMap();
            const mapped = map[slug];
            if (mapped) song = await getSongById(mapped.id);
          }
          if (song) {
            const artistSlugForSongs = song.artist_slug || slugifyJs(song.artist);
            const artistSongs = await getArtistSongs(artistSlugForSongs, song.slug).catch(() => []);
            html = renderChordHtml(song, artistSongs);
          }
          else return new Response("Not Found", { status: 404 });
        } catch {
          return new Response("Not Found", { status: 404 });
        }
      } else if (url.pathname.startsWith("/artist/")) {
        const slug = decodeURIComponent(url.pathname.replace("/artist/", "").replace(/\/$/, ""));
        try {
          html = await renderArtistHtml(slug);
          if (!html) return new Response("Not Found", { status: 404 });
        } catch {
          return new Response("Not Found", { status: 404 });
        }
      }

      if (html) {
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // Halaman statis: sajikan shell SPA dengan canonical + title yang benar
      // (shell default selalu canonical-kan ke homepage — bikin Google anggap halaman ini duplikat)
      const STATIC_SEO = {
        "/artists": {
          title: "Daftar artis | Chordkuy",
          desc: "Daftar artis chord gitar. Pilih artis untuk melihat seluruh chord lagu yang tersedia.",
        },
        "/about": { title: "Tentang Kami | Chordkuy", desc: "Tentang Chordkuy — platform chord gitar yang mengutamakan kecepatan dan keterbacaan." },
        "/contact": { title: "Kontak | Chordkuy", desc: "Hubungi tim Chordkuy melalui email atau WhatsApp." },
        "/privacy": { title: "Kebijakan Privasi | Chordkuy", desc: "Kebijakan privasi situs Chordkuy.id." },
        "/terms": { title: "Syarat & Ketentuan | Chordkuy", desc: "Syarat dan ketentuan penggunaan situs Chordkuy.id." },
      };
      const staticSeo = STATIC_SEO[url.pathname];
      if (staticSeo) {
        const res = await env.ASSETS.fetch(request);
        let shell = await res.text();
        shell = shell
          .replace(`<link rel="canonical" href="${SITE_URL}" />`, `<link rel="canonical" href="${SITE_URL}${url.pathname}" />`)
          .replace("<title>Chordkuy — Chord Gitar Indonesia Lengkap dan Terupdate</title>", `<title>${staticSeo.title}</title>`)
          .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${staticSeo.desc}" />`);
        return new Response(shell, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      if (url.pathname === "/") return env.ASSETS.fetch(request);

      // Path tak dikenal → 404 nyata (hindari soft-404: shell homepage dengan 200)
      return new Response("Not Found", { status: 404 });
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
