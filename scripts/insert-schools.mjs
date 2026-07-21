import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = readFileSync('/tmp/insert_schools.sql', 'utf-8');
const statements = sql.split('\n').filter(s => s.trim().length > 0);

console.log(`Executing ${statements.length} INSERT statements...`);

const conn = await createConnection(DATABASE_URL);

let inserted = 0;
let skipped = 0;
let errors = 0;

for (const stmt of statements) {
  try {
    const [result] = await conn.execute(stmt);
    if (result.affectedRows > 0) {
      inserted++;
    } else {
      skipped++;
    }
  } catch (err) {
    console.error(`Error on: ${stmt.substring(0, 80)}...`);
    console.error(err.message);
    errors++;
  }
}

await conn.end();

console.log(`Done! Inserted: ${inserted}, Skipped (already exists): ${skipped}, Errors: ${errors}`);

// Verify total count
const conn2 = await createConnection(DATABASE_URL);
const [rows] = await conn2.execute('SELECT COUNT(*) as total FROM schools');
console.log(`Total schools in DB: ${rows[0].total}`);
await conn2.end();
