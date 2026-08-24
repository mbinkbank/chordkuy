import "dotenv/config";
import pg from "pg";
import { readFileSync } from "node:fs";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const sql = readFileSync("stats-tables.sql", "utf-8");
await pool.query(sql);
console.log("✅ Tabel pageviews & page_stats_all_time siap");
await pool.end();
