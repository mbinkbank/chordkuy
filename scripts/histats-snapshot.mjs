/**
 * Histats snapshot — login via Puppeteer, ambil semua halaman statistik,
 * simpan hasilnya (parsed + raw) ke Supabase tabel histats_snapshots.
 *
 * Env: HISTATS_USER, HISTATS_PASS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";

const USER = process.env.HISTATS_USER;
const PASS = process.env.HISTATS_PASS;
const SID = "5046881";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ACTS = { summary: 2, daily: 3, referrers: 6, geolocation: 10, byUrl: 15, byTitle: 16 };

function num(text) {
  const m = text.match(/[\d.,]+/);
  if (!m) return null;
  return parseInt(m[0].replace(/[.,]/g, ""), 10);
}

function extractSummary(innerText) {
  const out = {};
  const grab = (label, next = "") => {
    const m = innerText.match(new RegExp(`${label}\\s*([\\d.,:hms%()]+)\\s*${next}`));
    return m ? m[1] : null;
  };
  out.totalPageViews = num(grab("Total page views") || "");
  out.totalVisitors = num(grab("Total visitors") || "");
  const pvPerVisit = innerText.match(/Page views per visit\s*([\d.,]+)/);
  out.pageViewsPerVisit = pvPerVisit ? parseFloat(pvPerVisit[1].replace(",", ".")) : null;

  // blok TODAY
  const todayIdx = innerText.indexOf("First time visitors");
  if (todayIdx > -1) {
    const block = innerText.slice(Math.max(0, todayIdx - 400), todayIdx + 300);
    const nums = [...block.matchAll(/\n(\d[\d.,]*)\n/g)].map((m) => m[1]);
    out.todayPageViews = nums.length > 0 ? num(nums[0]) : null;
    out.todayVisitors = nums.length > 1 ? num(nums[1]) : null;
    out.todayFirstTimeVisitors = num(grab("First time visitors") || "");
  }
  const avg = innerText.match(/Average visit length\s*\n?\s*([\d:hms ]+?)\n/);
  out.avgVisitLength = avg ? avg[1].trim() : null;
  const online = innerText.match(/Users online\s*\n?\s*(\d+)/i);
  out.usersOnline = online ? parseInt(online[1], 10) : null;
  return out;
}

/** Ambil baris tabel daftar: label|angka berulang */
function extractList(innerText) {
  const lines = innerText.split("\n").map((s) => s.trim());
  const items = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const n = lines[i + 1].match(/^[\d.,]+%?$/);
    if (n && lines[i] && !/^\d/.test(lines[i]) && lines[i].length > 2 && lines[i].length < 120) {
      items.push({ label: lines[i], value: n[0] });
    }
  }
  return items;
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  );

  console.log("Login Histats...");
  await page.goto(`https://www.histats.com/viewstats/?sid=${SID}`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await page.waitForSelector('form[action*="DOLOGIN"]', { timeout: 20000 });
  await page.type('input[name="user"]', USER);
  await page.type('input[name="pass"]', PASS);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}),
    page.click('input[name="B1"]'),
  ]);

  const data = { fetchedAt: new Date().toISOString(), raw: {}, lists: {} };
  for (const [name, act] of Object.entries(ACTS)) {
    await page.goto(`https://www.histats.com/viewstats/?act=${act}&sid=${SID}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 3500));
    const text = await page.evaluate(() => document.body.innerText);
    data.raw[name] = text.slice(0, 20000);
    if (name === "summary") {
      data.summary = extractSummary(text);
    } else {
      data.lists[name] = extractList(text);
    }
    console.log(`act ${name}: ok`);
  }
  await browser.close();

  const payload = {
    fetched_at: data.fetchedAt,
    data,
  };

  if (SUPABASE_URL && SUPABASE_KEY) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/histats_snapshots`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
    console.log("Simpan Supabase:", res.status);
    if (!res.ok) {
      writeFileSync("histats-last-snapshot.json", JSON.stringify(payload, null, 2));
      console.error("(table belum ada? payload disimpan ke histats-last-snapshot.json)");
    }
  } else {
    writeFileSync("histats-last-snapshot.json", JSON.stringify(payload, null, 2));
    console.log("Env Supabase tidak ada — disimpan ke file lokal.");
  }

  console.log("Summary:", JSON.stringify(data.summary));
}

main().catch((e) => {
  console.error("Gagal:", e.message);
  process.exit(1);
});
