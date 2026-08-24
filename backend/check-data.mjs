import "dotenv/config";
import pg from "pg";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const r = await c.query(
  "select count(*)::int total, count(*) filter (where judul <> '')::int berjudul, count(*) filter (where lastmod <> '')::int berlastmod from chords",
);
console.log(r.rows[0]);
await c.end();
