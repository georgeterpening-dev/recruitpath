/**
 * seed-sort-order.mjs
 *
 * Sets the sortOrder field on all schools to implement popularity-based ordering
 * within each division. Lower sortOrder = more prominent program.
 *
 * Rankings use exact DB school names and filter by division to prevent
 * cross-division contamination.
 *
 * Schools not explicitly ranked receive sortOrder = 500 (unranked within division).
 * Unranked schools within a division are sorted alphabetically at query time.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Step 1: Reset all sortOrder to 500 (unranked baseline)
await conn.execute('UPDATE schools SET sortOrder = 500');
console.log('Reset all sortOrder to 500');

// ─── D1 Rankings ─────────────────────────────────────────────────────────────
// Exact DB names, filtered by division = 'D1'
// Based on: NCAA championships, MPSF/EIVA/MIVA dominance, national visibility
const d1Rankings = [
  { name: 'UCLA',                           order: 1  },
  { name: 'USC',                            order: 2  },
  { name: 'Long Beach State',               order: 3  },
  { name: 'Hawaii',                         order: 4  },
  { name: 'Stanford',                       order: 5  },
  { name: 'BYU',                            order: 6  },
  { name: 'Pepperdine',                     order: 7  },
  { name: 'UC Irvine',                      order: 8  },
  { name: 'UC Santa Barbara',               order: 9  },
  { name: 'Ohio State',                     order: 10 },
  { name: 'Penn State',                     order: 11 },
  { name: 'Ball State',                     order: 12 },
  { name: 'UC San Diego',                   order: 13 },
  { name: 'Harvard',                        order: 14 },
  { name: 'George Mason',                   order: 15 },
  { name: 'Loyola Chicago',                 order: 16 },
  { name: 'Sacred Heart',                   order: 17 },
  { name: 'McKendree University',           order: 18 },
  { name: 'Lindenwood University',          order: 19 },
  { name: 'Northern Kentucky University',   order: 20 },
  { name: 'Manhattan College',              order: 21 },
  { name: 'University of the Pacific',      order: 22 },
  { name: 'University of Maryland Eastern Shore', order: 23 },
];

// ─── D2 Rankings ─────────────────────────────────────────────────────────────
// Exact DB names for the 19 D2 schools in the database
// Based on: AVCA D2 rankings, conference strength, program history
const d2Rankings = [
  { name: 'American International College', order: 1  },
  { name: 'Barry University',               order: 2  },
  { name: 'Rockhurst University',           order: 3  },
  { name: 'Roosevelt University',           order: 4  },
  { name: 'Dominican University New York',  order: 5  },
  { name: 'St. Thomas Aquinas College',     order: 6  },
  { name: 'Thomas More University',         order: 7  },
  { name: 'Southwest Baptist University',   order: 8  },
  { name: 'Menlo College',                  order: 9  },
  { name: 'Jessup University',              order: 10 },
  { name: 'Vanguard University of Southern California', order: 11 },
  { name: 'University of California - Merced', order: 12 },
  { name: 'Davenport University',           order: 13 },
  { name: 'Roberts Wesleyan University',    order: 14 },
  { name: 'University of Jamestown',        order: 15 },
  { name: 'Kentucky State University',      order: 16 },
  { name: 'LeMoyne-Owen College',           order: 17 },
  { name: 'Benedict College',               order: 18 },
  { name: 'Catawba College',                order: 19 },
];

// ─── D3 Rankings ─────────────────────────────────────────────────────────────
// Exact DB names for D3 schools — 143 total, ranking top ~50
// Based on: AVCA D3 rankings, SCIAC/UAA/NESCAC prominence, program longevity
const d3Rankings = [
  // SCIAC powerhouses (California)
  { name: 'Cal Lutheran',                   order: 1  },
  { name: 'Claremont-Mudd-Scripps',         order: 2  },
  { name: 'Pomona-Pitzer',                  order: 3  },
  { name: 'Whittier College',               order: 4  },
  { name: 'La Verne',                       order: 5  },
  { name: 'Redlands',                       order: 6  },
  { name: 'Caltech',                        order: 7  },
  // Strong Eastern/Midwest programs
  { name: 'NYU',                            order: 8  },
  { name: 'Vassar College',                 order: 9  },
  { name: 'Stevens Institute of Technology', order: 10 },
  { name: 'Springfield College',            order: 11 },
  { name: 'Juniata College',                order: 12 },
  { name: 'Messiah University',             order: 13 },
  { name: 'Carthage College',               order: 14 },
  { name: 'Lewis University',               order: 15 },
  { name: 'Southern Virginia University',   order: 16 },
  { name: 'Augustana College - Illinois',   order: 17 },
  { name: 'Baldwin Wallace University',     order: 18 },
  { name: 'Elmhurst University',            order: 19 },
  { name: 'North Central College',          order: 20 },
  { name: 'Massachusetts Institute of Technology - MIT', order: 21 },
  { name: 'Baruch College',                 order: 22 },
  { name: 'Brooklyn College',               order: 23 },
  { name: 'Hunter College',                 order: 24 },
  { name: 'Bard College',                   order: 25 },
  { name: 'Nazareth University',            order: 26 },
  { name: 'Arcadia University',             order: 27 },
  { name: 'Alvernia University',            order: 28 },
  { name: 'North Park University',          order: 29 },
  { name: 'Concordia University - Chicago', order: 30 },
  { name: 'Loras College',                  order: 31 },
  { name: 'Wittenberg University',          order: 32 },
  { name: 'Wisconsin Lutheran College',     order: 33 },
  { name: 'Marian University - Wisconsin',  order: 34 },
  { name: 'St. Norbert College',            order: 35 },
  { name: 'Bridgewater College',            order: 36 },
  { name: 'Shenandoah University',          order: 37 },
  { name: 'Randolph-Macon College',         order: 38 },
  { name: 'Roanoke College',                order: 39 },
  { name: 'Virginia Wesleyan University',   order: 40 },
  { name: 'Eastern Mennonite University',   order: 41 },
  { name: 'Guilford College',               order: 42 },
  { name: 'Averett University',             order: 43 },
  { name: 'Emory & Henry University',       order: 44 },
  { name: 'Ferrum College',                 order: 45 },
  { name: 'University of Lynchburg',        order: 46 },
  { name: 'Randolph College',               order: 47 },
  { name: 'Hampden-Sydney College',         order: 48 },
  { name: 'Bryn Athyn College',             order: 49 },
  { name: 'Cairn University',               order: 50 },
];

// ─── NAIA Rankings ───────────────────────────────────────────────────────────
// Exact DB names for NAIA schools — 72 total, ranking top ~35
// Based on: NAIA championship history, conference prominence
const naiaRankings = [
  { name: 'Campbellsville University',      order: 1  },
  { name: 'Bethel University - Indiana',    order: 2  },
  { name: 'Indiana Wesleyan University',    order: 3  },
  { name: 'Olivet Nazarene University',     order: 4  },
  { name: 'Dordt University',               order: 5  },
  { name: 'Grand View University',          order: 6  },
  { name: 'Viterbo University',             order: 7  },
  { name: 'Clarke University',              order: 8  },
  { name: 'Benedictine University - Mesa',  order: 9  },
  { name: 'Arizona Christian University',   order: 10 },
  { name: 'Aquinas College - Michigan',     order: 11 },
  { name: 'Calumet College of St. Joseph',  order: 12 },
  { name: 'Judson University',              order: 13 },
  { name: 'Trinity Christian College',      order: 14 },
  { name: 'Indiana Wesleyan University',    order: 15 },
  { name: 'Hastings College',               order: 16 },
  { name: 'Avila University',               order: 17 },
  { name: 'Morningside College',            order: 18 },
  { name: 'Brescia University',             order: 19 },
  { name: 'Bluefield University',           order: 20 },
  { name: 'Carolina University',            order: 21 },
  { name: 'Oklahoma Wesleyan University',   order: 22 },
  { name: 'Central Christian College of Kansas', order: 23 },
  { name: 'St. Ambrose University',         order: 24 },
  { name: 'Missouri Baptist University',    order: 25 },
  { name: 'Missouri Valley College',        order: 26 },
  { name: 'Graceland University',           order: 27 },
  { name: 'Ottawa University',              order: 28 },
  { name: 'Ottawa University-Surprise',     order: 29 },
  { name: 'Park University',                order: 30 },
  { name: 'Park University Gilbert',        order: 31 },
  { name: 'The Master\'s University',       order: 32 },
  { name: 'Soka University of America',     order: 33 },
  { name: 'Pacific Union College',          order: 34 },
  { name: 'La Sierra University',           order: 35 },
];

// ─── CC Rankings ─────────────────────────────────────────────────────────────
// Exact DB names for CC schools — 33 total, ranking top ~20
// Based on: California CC system prominence, program history
const ccRankings = [
  { name: 'Long Beach City College',        order: 1  },
  { name: 'El Camino College',              order: 2  },
  { name: 'Palomar College',                order: 3  },
  { name: 'Santa Monica College',           order: 4  },
  { name: 'Fullerton College',              order: 5  },
  { name: 'Orange Coast College',           order: 6  },
  { name: 'Golden West College',            order: 7  },
  { name: 'Irvine Valley College',          order: 8  },
  { name: 'Antelope Valley College',        order: 9  },
  { name: 'Moorpark College',               order: 10 },
  { name: 'Santa Barbara City College',     order: 11 },
  { name: 'College of DuPage',              order: 12 },
  { name: 'Brookdale Community College',    order: 13 },
  { name: 'Atlantic Cape Community College', order: 14 },
  { name: 'Borough of Manhattan Community College', order: 15 },
  { name: 'Grossmont College',              order: 16 },
  { name: 'Pierce College - Los Angeles',   order: 17 },
  { name: 'San Diego Mesa College',         order: 18 },
  { name: 'San Diego Miramar College',      order: 19 },
  { name: 'Santiago Canyon College',        order: 20 },
  { name: 'Nassau Community College',       order: 21 },
  { name: 'Douglas College (New Westminster)', order: 22 },
];

// ─── Execute Updates ──────────────────────────────────────────────────────────

async function updateRankings(rankings, division) {
  let updated = 0;
  let notFound = [];
  for (const { name, order } of rankings) {
    const [result] = await conn.execute(
      'UPDATE schools SET sortOrder = ? WHERE name = ? AND division = ?',
      [order, name, division]
    );
    if (result.affectedRows > 0) {
      updated++;
    } else {
      notFound.push(name);
    }
  }
  console.log(`${division}: ${updated}/${rankings.length} ranked`);
  if (notFound.length > 0) {
    console.log(`  Not found: ${notFound.join(', ')}`);
  }
}

console.log('\nSeeding popularity rankings...\n');

await updateRankings(d1Rankings, 'D1');
await updateRankings(d2Rankings, 'D2');
await updateRankings(d3Rankings, 'D3');
await updateRankings(naiaRankings, 'NAIA');
await updateRankings(ccRankings, 'CC');

// Verify final state
const [rows] = await conn.execute(`
  SELECT division, 
    COUNT(*) as total,
    SUM(CASE WHEN sortOrder < 500 THEN 1 ELSE 0 END) as ranked
  FROM schools 
  GROUP BY division 
  ORDER BY CASE division WHEN 'D1' THEN 1 WHEN 'D2' THEN 2 WHEN 'D3' THEN 3 WHEN 'NAIA' THEN 4 WHEN 'CC' THEN 5 ELSE 6 END
`);

console.log('\nFinal state:');
rows.forEach(r => {
  console.log(`  ${r.division}: ${r.total} total, ${r.ranked} explicitly ranked`);
});

await conn.end();
console.log('\nDone!');
