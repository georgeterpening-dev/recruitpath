import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = fs.readFileSync('/tmp/update_logo_domains.sql', 'utf-8');
const statements = sql.split('\n').filter(s => s.trim());

console.log(`Executing ${statements.length} UPDATE statements...`);

const conn = await mysql.createConnection(DATABASE_URL);

let updated = 0;
let skipped = 0;
let errors = 0;

for (const stmt of statements) {
  try {
    const [result] = await conn.execute(stmt);
    if (result.affectedRows > 0) {
      updated++;
    } else {
      skipped++;
    }
  } catch (err) {
    console.error(`Error: ${err.message}\n  SQL: ${stmt.substring(0, 80)}`);
    errors++;
  }
}

await conn.end();

console.log(`\nDone!`);
console.log(`  Updated: ${updated} schools`);
console.log(`  Skipped (name not found or already had logo): ${skipped}`);
console.log(`  Errors: ${errors}`);

// Verify final state
const conn2 = await mysql.createConnection(DATABASE_URL);
const [rows] = await conn2.execute(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN logoUrl IS NOT NULL AND logoUrl != '' THEN 1 ELSE 0 END) as has_logo_url,
    SUM(CASE WHEN athleticsDomain IS NOT NULL AND athleticsDomain != '' THEN 1 ELSE 0 END) as has_athletics_domain,
    SUM(CASE WHEN (logoUrl IS NULL OR logoUrl = '') AND (athleticsDomain IS NULL OR athleticsDomain = '') THEN 1 ELSE 0 END) as no_logo_at_all
  FROM schools
`);
await conn2.end();

console.log('\nFinal DB state:');
console.log(`  Total schools: ${rows[0].total}`);
console.log(`  Has logoUrl override: ${rows[0].has_logo_url}`);
console.log(`  Has athleticsDomain (Logo.dev): ${rows[0].has_athletics_domain}`);
console.log(`  No logo at all: ${rows[0].no_logo_at_all}`);
