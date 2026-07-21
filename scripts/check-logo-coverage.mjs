import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all DB school names
const [rows] = await conn.execute('SELECT name, athleticsDomain, logoUrl FROM schools');
const dbNames = new Set(rows.map(r => r.name));

// Read CSV
const csv = fs.readFileSync('/home/ubuntu/upload/cleaned_schoolswithurls-cleaned_schools.csv', 'utf-8');
const csvEntries = {};
csv.split('\n').forEach(line => {
  const parts = line.split(',');
  const name = parts[0].trim();
  const url = parts[3]?.trim() || '';
  if (name && url) {
    // Extract domain
    const match = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/);
    if (match) csvEntries[name] = match[1];
  }
});

// Find CSV names not in DB
const unmatched = Object.keys(csvEntries).filter(n => !dbNames.has(n));
console.log(`CSV names not found in DB (${unmatched.length}):`);
unmatched.forEach(n => console.log(` - "${n}" -> ${csvEntries[n]}`));

// Schools still without logo
const noLogo = rows.filter(r => (!r.logoUrl || r.logoUrl === '') && (!r.athleticsDomain || r.athleticsDomain === ''));
console.log(`\nSchools still without logo (${noLogo.length}):`);
noLogo.forEach(r => console.log(` - ${r.name}`));

// Summary
const withLogo = rows.filter(r => (r.logoUrl && r.logoUrl !== '') || (r.athleticsDomain && r.athleticsDomain !== ''));
console.log(`\nSummary: ${withLogo.length}/${rows.length} schools have logos`);

await conn.end();
