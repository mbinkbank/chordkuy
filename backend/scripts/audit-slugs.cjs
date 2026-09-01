require("dotenv").config({ path: ".env" });
const { Client } = require("pg");

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const summary = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE slug LIKE '/chord/%' OR slug LIKE 'chord/%')::int AS prefixed_path,
      COUNT(*) FILTER (WHERE slug LIKE '%/%')::int AS contains_slash
    FROM chords
  `);
  const samples = await db.query(`
    SELECT id, title, artist, slug
    FROM chords
    WHERE slug LIKE '/chord/%' OR slug LIKE 'chord/%' OR slug LIKE '%/%'
    ORDER BY id
    LIMIT 20
  `);
  console.log(JSON.stringify({ summary: summary.rows[0], samples: samples.rows }, null, 2));
  await db.end();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
