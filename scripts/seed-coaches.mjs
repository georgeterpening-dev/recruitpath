/**
 * seed-coaches.mjs
 * Parses the coach CSV and inserts coaches into the coaches table.
 * Matches CSV school names to DB school IDs using fuzzy normalization.
 * Skips "has been removed" rows and duplicate entries.
 */

import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const CSV_PATH = '/home/ubuntu/upload/Untitledspreadsheet-Sheet1(2).csv';

// ─── Normalize school name for matching ─────────────────────────────────────
function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\buniversity\b/g, 'university')
    .replace(/\bcollege\b/g, 'college')
    .trim();
}

// ─── Parse CSV ───────────────────────────────────────────────────────────────
function parseCSV(content) {
  const lines = content.split('\n');
  const coaches = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted fields)
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());

    // CSV columns: School Name, col2, col3, col4, col5, First Name, Last Name, Position, Email
    const schoolName = fields[0]?.trim() || '';
    const firstName = fields[5]?.trim() || '';
    const lastName = fields[6]?.trim() || '';
    const position = fields[7]?.trim() || '';
    const email = fields[8]?.trim() || '';

    if (!schoolName || !firstName || !lastName || !position) continue;

    // Skip "has been removed" rows
    if (
      firstName.toLowerCase().includes('has been removed') ||
      lastName.toLowerCase().includes('has been removed') ||
      position.toLowerCase().includes('has been removed') ||
      firstName.toLowerCase().includes('ac ') ||
      firstName.toLowerCase().startsWith('head coach ') ||
      firstName.toLowerCase().startsWith('assistant coach ') ||
      firstName.toLowerCase().startsWith('volunteer') ||
      firstName.toLowerCase().startsWith('recruiting')
    ) continue;

    // Also skip rows where firstName looks like a sentence (contains "has been")
    if (firstName.toLowerCase().includes('has been')) continue;

    coaches.push({
      schoolName,
      firstName,
      lastName,
      position,
      email: email || null,
    });
  }

  return coaches;
}

// ─── Determine if a position is "head coach" level ──────────────────────────
function isHeadCoach(position) {
  const p = position.toLowerCase();
  return (
    p.includes('head coach') ||
    p.includes('co-head coach') ||
    p.includes('interim head coach') ||
    p.includes('director of volleyball')
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);

  // Load all schools from DB
  const [schoolRows] = await conn.query('SELECT id, name FROM schools');
  const schoolMap = new Map();
  for (const row of schoolRows) {
    schoolMap.set(normalize(row.name), row.id);
  }

  // Also build a map with common aliases
  const aliases = {
    'byu': 'mvb-byu',
    'brigham young university': 'mvb-byu',
    'ball state': 'mvb-ballstate',
    'ball state university': 'mvb-ballstate',
    'ohio state': 'mvb-ohio-state',
    'ohio state university': 'mvb-ohio-state',
    'penn state': 'mvb-penn-state',
    'pennsylvania state university': 'mvb-penn-state',
    'uc san diego': 'mvb-uc-san-diego',
    'university of california san diego': 'mvb-uc-san-diego',
    'uc santa barbara': 'mvb-uc-santa-barbara',
    'university of california santa barbara': 'mvb-uc-santa-barbara',
    'uc irvine': 'mvb-uc-irvine',
    'university of california irvine': 'mvb-uc-irvine',
    'ucla': 'mvb-ucla',
    'university of california los angeles': 'mvb-ucla',
    'usc': 'mvb-usc',
    'university of southern california': 'mvb-usc',
    'nyu': 'mvb-nyu',
    'new york university': 'mvb-nyu',
    'long beach state': 'mvb-long-beach-state',
    'california state university long beach': 'mvb-long-beach-state',
    'csulb': 'mvb-long-beach-state',
    'loyola chicago': 'mvb-loyola-chicago',
    'loyola university chicago': 'mvb-loyola-chicago',
    'sacred heart': 'mvb-sacred-heart',
    'sacred heart university': 'mvb-sacred-heart',
    'stanford': 'mvb-stanford',
    'stanford university': 'mvb-stanford',
    'pepperdine': 'mvb-pepperdine',
    'pepperdine university': 'mvb-pepperdine',
    'george mason': 'mvb-george-mason',
    'george mason university': 'mvb-george-mason',
    'hawaii': 'mvb-hawaii',
    'university of hawaii': 'mvb-hawaii',
    'university of hawaii at manoa': 'mvb-hawaii',
    'lewis university': 'mvb-lewis',
    'lewis': 'mvb-lewis',
    'lindenwood university': 'mvb-lindenwood',
    'lindenwood': 'mvb-lindenwood',
    'mckendree university': 'mvb-mckendree',
    'mckendree': 'mvb-mckendree',
    'messiah university': 'mvb-messiah',
    'messiah college': 'mvb-messiah',
    'southern virginia university': 'mvb-southern-virginia',
    'springfield college': 'mvb-springfield',
    'stevens institute of technology': 'mvb-stevens',
    'vassar college': 'mvb-vassar',
    'vassar': 'mvb-vassar',
    'juniata college': 'mvb-juniata',
    'carthage college': 'mvb-carthage',
    'cal lutheran': 'mvb-cal-lutheran',
    'california lutheran university': 'mvb-cal-lutheran',
    'st josephs university li': 'mvb-st-josephs-li',
    'st josephs university long island': 'mvb-st-josephs-li',
    'marian university  wisconsin': 'mvb-marian-wisconsin',
    'marian university wisconsin': 'mvb-marian-wisconsin',
    'milwaukee school of engineering': 'mvb-msoe',
    'msoe': 'mvb-msoe',
    'university of wisconsin  stevens point': 'mvb-uwsp',
    'university of wisconsin stevens point': 'mvb-uwsp',
    'uwsp': 'mvb-uwsp',
    'douglas college new westminster': 'mvb-douglas-college',
    'douglas college': 'mvb-douglas-college',
    'long beach city college': 'mvb-long-beach-city',
    'pierce college  los angeles': 'mvb-pierce-la',
    'pierce college los angeles': 'mvb-pierce-la',
    'san diego mesa college': 'mvb-san-diego-mesa',
    'san diego miramar college': 'mvb-san-diego-miramar',
    'santa barbara city college': 'mvb-santa-barbara-city',
    'santa monica college': 'mvb-santa-monica',
    'santiago canyon college': 'mvb-santiago-canyon',
    'college of dupage': 'mvb-college-of-dupage',
    'atlantic cape community college': 'mvb-atlantic-cape',
    'brookdale community college': 'mvb-brookdale',
    'middlesex college': 'mvb-middlesex',
    'ocean county college': 'mvb-ocean-county',
    'passaic county community college': 'mvb-passaic-county',
    'union county college': 'mvb-union-county',
    'borough of manhattan community college': 'mvb-bmcc',
    'finger lakes community college': 'mvb-finger-lakes',
    'hostos community college': 'mvb-hostos',
    'monroe university  bronx': 'mvb-monroe-bronx',
    'monroe university bronx': 'mvb-monroe-bronx',
    'monroe university  new rochelle': 'mvb-monroe-new-rochelle',
    'monroe university new rochelle': 'mvb-monroe-new-rochelle',
    'nassau community college': 'mvb-nassau',
    'harcum college': 'mvb-harcum',
    'northampton county area community college': 'mvb-northampton-cc',
    'bryant  stratton college  wisconsin': 'mvb-bryant-stratton-wi',
    'bryant stratton college wisconsin': 'mvb-bryant-stratton-wi',
    'arizona christian university': 'mvb-arizona-christian',
    'benedictine university  mesa': 'mvb-benedictine-mesa',
    'benedictine university mesa': 'mvb-benedictine-mesa',
    'ottawauniversitysurprise': 'mvb-ottawa-surprise',
    'ottawa universitysurprise': 'mvb-ottawa-surprise',
    'ottawa university surprise': 'mvb-ottawa-surprise',
    'park university gilbert': 'mvb-park-gilbert',
    'university of british columbia': 'mvb-ubc',
    'hope international university': 'mvb-hope-international',
    'la sierra university': 'mvb-la-sierra',
    'pacific union college': 'mvb-pacific-union',
    'simpson university': 'mvb-simpson',
    'soka university of america': 'mvb-soka',
    'the masters university': 'mvb-masters',
    "the master's university": 'mvb-masters',
    'westcliff university': 'mvb-westcliff',
    'st thomas university  florida': 'mvb-st-thomas-florida',
    'st thomas university florida': 'mvb-st-thomas-florida',
    'warner university': 'mvb-warner',
    'webber international university': 'mvb-webber',
    'life university': 'mvb-life',
    'reinhardt university': 'mvb-reinhardt',
    'truettmcconnell university': 'mvb-truett-mcconnell',
    'truett mcconnell university': 'mvb-truett-mcconnell',
    'governors state university': 'mvb-governors-state',
    'judson university': 'mvb-judson',
    'olivet nazarene university': 'mvb-olivet-nazarene',
    'saint xavier university': 'mvb-saint-xavier',
    'trinity christian college': 'mvb-trinity-christian',
    'bethel university  indiana': 'mvb-bethel-indiana',
    'bethel university indiana': 'mvb-bethel-indiana',
    'calumet college of st joseph': 'mvb-calumet',
    'goshen college': 'mvb-goshen',
    'huntington university': 'mvb-huntington',
    'indiana institute of technology': 'mvb-indiana-tech',
    'indiana university  east': 'mvb-iu-east',
    'indiana university east': 'mvb-iu-east',
    'indiana wesleyan university': 'mvb-indiana-wesleyan',
    'oakland city university': 'mvb-oakland-city',
    'saint maryofthewoods college': 'mvb-saint-mary-woods',
    'saint mary of the woods college': 'mvb-saint-mary-woods',
    'clarke university': 'mvb-clarke',
    'dordt university': 'mvb-dordt',
    'graceland university': 'mvb-graceland',
    'grand view university': 'mvb-grand-view',
    'morningside college': 'mvb-morningside',
    'mount mercy university': 'mvb-mount-mercy',
    'st ambrose university': 'mvb-st-ambrose',
    'william penn university': 'mvb-william-penn',
    'central christian college of kansas': 'mvb-central-christian-ks',
    'kansas wesleyan university': 'mvb-kansas-wesleyan',
    'ottawa university': 'mvb-ottawa',
    'brescia university': 'mvb-brescia',
    'campbellsville university': 'mvb-campbellsville',
    'georgetown college': 'mvb-georgetown-college',
    'midway university': 'mvb-midway',
    'fisher college': 'mvb-fisher',
    'aquinas college  michigan': 'mvb-aquinas-michigan',
    'aquinas college michigan': 'mvb-aquinas-michigan',
    'cornerstone university': 'mvb-cornerstone',
    'lawrence technological university': 'mvb-lawrence-tech',
    'rochester christian university': 'mvb-rochester-christian',
    'siena heights university': 'mvb-siena-heights',
    'avila university': 'mvb-avila',
    'culverstockton college': 'mvb-culver-stockton',
    'culver stockton college': 'mvb-culver-stockton',
    'mission university': 'mvb-mission',
    'missouri baptist university': 'mvb-missouri-baptist',
    'missouri valley college': 'mvb-missouri-valley',
    'park university': 'mvb-park',
    'university of health sciences and pharmacy in st louis': 'mvb-uhsp',
    'hastings college': 'mvb-hastings',
    'carolina university': 'mvb-carolina',
    'defiance college': 'mvb-defiance',
    'lourdes university': 'mvb-lourdes',
    'mount vernon nazarene university': 'mvb-mount-vernon-nazarene',
    'university of rio grande': 'mvb-rio-grande',
    'oklahoma wesleyan university': 'mvb-oklahoma-wesleyan',
    'penn state schuylkill': 'mvb-penn-state-schuylkill',
    'spartanburg methodist college': 'mvb-spartanburg-methodist',
    'cumberland university': 'mvb-cumberland',
    'milligan university': 'mvb-milligan',
    'bluefield university': 'mvb-bluefield',
    'viterbo university': 'mvb-viterbo',
    'edgewood college': 'mvb-edgewood',
    'lakeland university': 'mvb-lakeland',
    'lawrence university': 'mvb-lawrence',
    'maranatha baptist university': 'mvb-maranatha',
    'st norbert college': 'mvb-st-norbert',
    'wisconsin lutheran college': 'mvb-wisconsin-lutheran',
    // Additional aliases for CSV name variants
    'california state university  long beach': 'mvb-lbsu',
    'california state university long beach': 'mvb-lbsu',
    'california state university  northridge': 'mvb-csun',
    'california state university northridge': 'mvb-csun',
    'concordia university  irvine': 'mvb-concordia-irvine',
    'concordia university irvine': 'mvb-concordia-irvine',
    'st josephs college  long island': 'mvb-st-josephs-li',
    'st josephs college long island': 'mvb-st-josephs-li',
    'university of california  irvine': 'mvb-uci',
    'university of california irvine': 'mvb-uci',
    'university of california  san diego': 'mvb-ucsd',
    'university of california san diego': 'mvb-ucsd',
    'university of california  santa barbara': 'mvb-ucsb',
    'university of california santa barbara': 'mvb-ucsb',
    'purdue university  fort wayne': 'mvb-purdue-fort-wayne',
    'purdue university fort wayne': 'mvb-purdue-fort-wayne',
    'missouri university of science  technology': 'mvb-mst',
    'missouri university of science technology': 'mvb-mst',
    'dyouville university': 'mvb-dyouville',
    'd youville university': 'mvb-dyouville',
    'daemen university': 'mvb-daemen',
    'barton college': 'mvb-barton',
    'belmont abbey college': 'mvb-belmont-abbey',
    'central state university': 'mvb-central-state',
    'edward waters college': 'mvb-edward-waters',
    'erskine college': 'mvb-erskine',
    'fairleigh dickinson university': 'mvb-fairleigh-dickinson',
    'fort valley state university': 'mvb-fort-valley-state',
    'king university  tennessee': 'mvb-king-tennessee',
    'king university tennessee': 'mvb-king-tennessee',
    'leesmcrae college': 'mvb-lees-mcrae',
    'lees mcrae college': 'mvb-lees-mcrae',
    'lincoln memorial university': 'mvb-lincoln-memorial',
    'long island university': 'mvb-liu',
    'maryville university': 'mvb-maryville',
    'merrimack college': 'mvb-merrimack',
    'new jersey institute of technology': 'mvb-njit',
    'north greenville university': 'mvb-north-greenville',
    'princeton university': 'mvb-princeton',
    'queens university of charlotte': 'mvb-queens-charlotte',
    'quincy university': 'mvb-quincy',
    'university of charleston': 'mvb-charleston',
    'university of mount olive': 'mvb-mount-olive',
    'antelope valley college': 'mvb-antelope-valley',
    'el camino college': 'mvb-el-camino',
    'fullerton college': 'mvb-fullerton',
    'golden west college': 'mvb-golden-west',
    'grossmont college': 'mvb-grossmont',
    'irvine valley college': 'mvb-irvine-valley',
    'moorpark college': 'mvb-moorpark',
    'orange coast college': 'mvb-orange-coast',
    'palomar college': 'mvb-palomar',
  };

  // Parse CSV
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const rawCoaches = parseCSV(csvContent);

  console.log(`Parsed ${rawCoaches.length} coach entries from CSV`);

  // Clear existing coaches to avoid duplicates on re-run
  await conn.query('DELETE FROM coaches');
  console.log('Cleared existing coaches table');

  let inserted = 0;
  let skipped = 0;
  const unmatched = new Set();

  // Group coaches by school, track sort order per school
  const schoolCoachCount = new Map();

  // Deduplicate: same school + first + last + position
  const seen = new Set();

  for (const coach of rawCoaches) {
    const normName = normalize(coach.schoolName);

    // Try direct DB lookup first
    let schoolId = schoolMap.get(normName);

    // Try aliases
    if (!schoolId) {
      schoolId = aliases[normName];
    }

    // Try partial matching (remove common suffixes)
    if (!schoolId) {
      const simplified = normName
        .replace(/\buniversity\b/g, '')
        .replace(/\bcollege\b/g, '')
        .replace(/\bthe\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      for (const [dbNorm, dbId] of schoolMap) {
        const dbSimplified = dbNorm
          .replace(/\buniversity\b/g, '')
          .replace(/\bcollege\b/g, '')
          .replace(/\bthe\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (dbSimplified === simplified || dbNorm.includes(simplified) || simplified.includes(dbNorm)) {
          schoolId = dbId;
          break;
        }
      }
    }

    if (!schoolId) {
      unmatched.add(coach.schoolName);
      skipped++;
      continue;
    }

    // Dedup key
    const dedupKey = `${schoolId}|${coach.firstName.toLowerCase()}|${coach.lastName.toLowerCase()}|${coach.position.toLowerCase()}`;
    if (seen.has(dedupKey)) {
      skipped++;
      continue;
    }
    seen.add(dedupKey);

    // Determine sort order: head coaches get 0, others get incrementing values
    const countKey = schoolId;
    if (!schoolCoachCount.has(countKey)) {
      schoolCoachCount.set(countKey, { head: 0, other: 100 });
    }
    const counts = schoolCoachCount.get(countKey);

    let sortOrder;
    if (isHeadCoach(coach.position)) {
      sortOrder = counts.head++;
    } else {
      sortOrder = counts.other++;
    }

    await conn.query(
      'INSERT INTO coaches (schoolId, firstName, lastName, position, email, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
      [schoolId, coach.firstName, coach.lastName, coach.position, coach.email, sortOrder]
    );
    inserted++;
  }

  console.log(`\nResults:`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (unmatched or duplicate): ${skipped}`);
  if (unmatched.size > 0) {
    console.log(`\nUnmatched schools (${unmatched.size}):`);
    for (const name of [...unmatched].sort()) {
      console.log(`  - ${name}`);
    }
  }

  await conn.end();
}

main().catch(console.error);
