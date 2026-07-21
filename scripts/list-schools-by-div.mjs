import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT name, division, sortOrder FROM schools ORDER BY division, name');

const byDiv = {};
for (const r of rows) {
  if (!byDiv[r.division]) byDiv[r.division] = [];
  byDiv[r.division].push({ name: r.name, order: r.sortOrder });
}

for (const [div, schools] of Object.entries(byDiv)) {
  console.log(`\n=== ${div} (${schools.length}) ===`);
  for (const s of schools) {
    console.log(`  [${s.order}] ${s.name}`);
  }
}

await conn.end();
