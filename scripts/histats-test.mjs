import puppeteer from "puppeteer";

const USER = process.env.HISTATS_USER;
const PASS = process.env.HISTATS_PASS;
const SID = "5046881";

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
);

// Login
await page.goto(`https://www.histats.com/viewstats/?sid=${SID}`, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector('form[action*="DOLOGIN"]', { timeout: 20000 });
await page.type('input[name="user"]', USER);
await page.type('input[name="pass"]', PASS);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}),
  page.click('input[name="B1"]'),
]);

// Summary act=2
await page.goto(`https://www.histats.com/viewstats/?act=2&sid=${SID}`, {
  waitUntil: "networkidle2",
  timeout: 60000,
});
await new Promise((r) => setTimeout(r, 4000));
const text = await page.evaluate(() => document.body.innerText);
console.log("=== ACT 2 innerText (potongan) ===");
console.log(text.slice(0, 2500));
await browser.close();
