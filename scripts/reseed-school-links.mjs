/**
 * reseed-school-links.mjs
 * 
 * Clears ALL existing recruitingQuestionnaireUrl and athleticsWebsiteUrl values
 * and re-seeds them from scratch using the CSV, with strict row-by-row matching.
 * 
 * Manual overrides handle DB schools with abbreviated names that don't match
 * the full names in the CSV.
 */

import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

// ── Step 1: Load CSV map (already extracted) ──────────────────────────────────
const csvMap = JSON.parse(readFileSync('/home/ubuntu/recruitpath/scripts/csv-links-map.json', 'utf8'));

// ── Step 2: Manual overrides for abbreviated DB names ─────────────────────────
// Key = exact DB school name, Value = exact CSV school name
const MANUAL_OVERRIDES = {
  'USC':                    'University of Southern California',
  'UCLA':                   'University of California - Los Angeles - UCLA',
  'Hawaii':                 'University of Hawaii at Manoa',
  'BYU':                    'Brigham Young University',
  'Ball State':             'Ball State University',
  'Cal Lutheran':           'California Lutheran University',
  'George Mason':           'George Mason University',
  'Harvard':                'Harvard University',
  'Long Beach State':       'California State University - Long Beach',
  'Loyola Chicago':         'Loyola University Chicago',
  'Messiah University':     'Messiah College',
  'NYU':                    'New York University',
  'Ohio State':             'Ohio State University',
  'Pepperdine':             'Pepperdine University',
  'Sacred Heart':           'Sacred Heart University',
  'St. Joseph\'s University LI': 'St. Joseph\'s College - Long Island',
  'Stanford':               'Stanford University',
  'UC Irvine':              'University of California - Irvine',
  'UC San Diego':           'University of California - San Diego',
  'UC Santa Barbara':       'University of California - Santa Barbara',
  // TEST SCHOOL intentionally left with no mapping (stays NULL)
};

// ── Step 3: Normalize helper ──────────────────────────────────────────────────
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Build normalized CSV lookup
const csvNormMap = {};
for (const name of Object.keys(csvMap)) {
  csvNormMap[normalize(name)] = name;
}

// ── Step 4: Connect to DB and get all schools ─────────────────────────────────
const conn = await createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, name FROM schools ORDER BY name');

// ── Step 5: First, clear ALL existing link values ─────────────────────────────
await conn.execute('UPDATE schools SET recruitingQuestionnaireUrl = NULL, athleticsWebsiteUrl = NULL');
console.log('Cleared all existing link values.');

// ── Step 6: Re-seed each school ───────────────────────────────────────────────
let updated = 0;
let skipped = 0;
const results = [];

for (const row of rows) {
  // Skip TEST SCHOOL
  if (row.name === 'TEST SCHOOL') {
    skipped++;
    results.push({ db: row.name, csv: null, q: null, a: null, status: 'SKIPPED (test)' });
    continue;
  }

  // Find CSV name: manual override first, then exact match, then normalized match
  let csvName = null;
  if (MANUAL_OVERRIDES[row.name]) {
    csvName = MANUAL_OVERRIDES[row.name];
  } else if (csvMap[row.name]) {
    csvName = row.name;
  } else {
    const normKey = normalize(row.name);
    csvName = csvNormMap[normKey] || null;
  }

  if (!csvName || !csvMap[csvName]) {
    skipped++;
    results.push({ db: row.name, csv: null, q: null, a: null, status: 'NO MATCH' });
    continue;
  }

  const { questionnaire, athletics } = csvMap[csvName];
  
  await conn.execute(
    'UPDATE schools SET recruitingQuestionnaireUrl = ?, athleticsWebsiteUrl = ? WHERE id = ?',
    [questionnaire || null, athletics || null, row.id]
  );
  updated++;
  results.push({ db: row.name, csv: csvName, q: questionnaire, a: athletics, status: 'OK' });
}

await conn.end();

// ── Step 7: Print final mapping for verification ──────────────────────────────
console.log('\n=== FINAL MAPPING VERIFICATION ===');
console.log(`Updated: ${updated} | Skipped/No match: ${skipped}\n`);

console.log('--- SUCCESSFULLY MAPPED ---');
for (const r of results.filter(r => r.status === 'OK')) {
  const dbLabel = r.db === r.csv ? r.db : `${r.db} → ${r.csv}`;
  console.log(`✓ ${dbLabel}`);
  console.log(`  Q: ${r.q || 'NULL'}`);
  console.log(`  A: ${r.a || 'NULL'}`);
}

console.log('\n--- SKIPPED / NO MATCH ---');
for (const r of results.filter(r => r.status !== 'OK')) {
  console.log(`✗ ${r.db} (${r.status})`);
}
