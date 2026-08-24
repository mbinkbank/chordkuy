import "dotenv/config";
import { readFileSync } from "node:fs";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const sql = readFileSync("trigger-v2.sql", "utf-8");
await pool.query(sql);
console.log("✅ Trigger v2 terpasang (lastmod otomatis)");
await pool.end();
